import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';

// Initialize Tables
const initTables = async () => {
    try {
        // Expense Claims Header Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS expense_claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        report_name VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status ENUM('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected') DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES users(id)
      )
    `);

        // Expense Items Detail Table
        await db.query(`
      CREATE TABLE IF NOT EXISTS expense_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        claim_id INT NOT NULL,
        expense_type VARCHAR(100) NOT NULL,
        transaction_date DATE NOT NULL,
        business_purpose TEXT,
        vendor_name VARCHAR(255),
        city VARCHAR(100),
        payment_type VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        billable BOOLEAN DEFAULT FALSE,
        project_no VARCHAR(50),
        event VARCHAR(100),
        domestic_intl ENUM('Domestic', 'International') DEFAULT 'Domestic',
        receipt_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (claim_id) REFERENCES expense_claims(id) ON DELETE CASCADE
      )
    `);

        console.log("Reimbursement tables checked/created");
    } catch (err) {
        console.error("Error creating reimbursement tables:", err);
    }
};

initTables();

// Submit or Save Draft
export const submitClaim = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            employee_id,
            report_name,
            total_amount,
            expense_items,
            status = 'Submitted' // Default to Submitted if not specified, but UI will send 'Draft' for drafts
        } = req.body;

        const items = JSON.parse(expense_items);
        const files = req.files;

        // Map 'Pending' to 'Submitted' if legacy frontend sends it, or strictly use 'Submitted'
        const claimStatus = status === 'Save Draft' ? 'Draft' : (status === 'Pending' ? 'Submitted' : status);

        // 1. Create Handle
        console.log(`[submitClaim] Creating claim: ${report_name} with status: ${claimStatus} for emp: ${employee_id}`);
        const [result] = await connection.query(
            `INSERT INTO expense_claims (employee_id, report_name, total_amount, status) VALUES (?, ?, ?, ?)`,
            [employee_id, report_name, total_amount, claimStatus]
        );
        const claimId = result.insertId;
        console.log(`[submitClaim] Created claimId: ${claimId}`);

        // 2. Insert Items
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            let receiptPath = null;
            // Files are expected to be named receipt_${index} based on the array order passed
            const file = files.find(f => f.fieldname === `receipt_${i}`);
            if (file) {
                receiptPath = file.path.replace(/\\/g, '/');
            }

            await connection.query(
                `INSERT INTO expense_items (
                claim_id, expense_type, transaction_date, business_purpose, 
                vendor_name, city, payment_type, amount, billable, 
                project_no, event, domestic_intl, receipt_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    claimId, item.expense_type, item.transaction_date, item.business_purpose,
                    item.vendor_name, item.city, item.payment_type, item.amount,
                    item.billable, item.project_no, item.event,
                    item.domestic_intl, receiptPath
                ]
            );
        }

        await connection.commit();
        res.status(201).json({ message: `Claim ${claimStatus === 'Draft' ? 'saved as draft' : 'submitted'} successfully`, claimId });

    } catch (error) {
        await connection.rollback();
        console.error("Submit claim error:", error);
        res.status(500).json({ message: 'Failed to submit claim' });
    } finally {
        connection.release();
    }
};

// Update existing Draft
export const updateDraft = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
            report_name,
            total_amount,
            expense_items,
            status // 'Draft' or 'Submitted'
        } = req.body;

        const items = JSON.parse(expense_items);
        const files = req.files || [];

        // Check if actually draft
        const [check] = await connection.query(`SELECT status FROM expense_claims WHERE id = ?`, [id]);
        if (check.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Claim not found" });
        }
        if (check[0].status === 'Submitted' || check[0].status === 'Approved' || check[0].status === 'Rejected') {
            await connection.rollback();
            return res.status(400).json({ message: "Cannot edit submitted or processed claims" });
        }

        const claimStatus = (status === 'Pending' || !status) ? 'Submitted' : status;

        // 1. Update Header
        console.log(`[updateDraft] Updating draft ${id} with status ${claimStatus}`);

        await connection.query(
            `UPDATE expense_claims SET report_name=?, total_amount=?, status=? WHERE id=?`,
            [report_name, total_amount, claimStatus, id]
        );

        // 2. Replace Items (Simpler strategy: Delete all and Insert new)
        // NOTE: This deletes old receipt paths from DB. We should ideally keep old paths if not changed.
        // For existing items, backend should receive the old path if no new file is uploaded?
        // Or simpler: We treat this wrapper as full replacement.
        // If an item has an ID (existing), we arguably should update. 
        // BUT 'items' from frontend might just be the full list.
        // Let's go with DELETE ALL for this claim and RE-INSERT. 
        // CAVEAT: We lose old files if we don't handle them.
        // FIX: Start by getting current items to preserve paths if needed?
        // Let's assume frontend sends `receipt_path` string for existing items that didn't change,
        // and for new files it sends the `receipt_${index}` file.

        await connection.query(`DELETE FROM expense_items WHERE claim_id = ?`, [id]);

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let receiptPath = item.receipt_path || null; // Preserve existing if sent

            // Check for NEW file upload for this index
            const file = files.find(f => f.fieldname === `receipt_${i}`);
            if (file) {
                receiptPath = file.path.replace(/\\/g, '/');
            }

            await connection.query(
                `INSERT INTO expense_items (
                claim_id, expense_type, transaction_date, business_purpose, 
                vendor_name, city, payment_type, amount, billable, 
                project_no, event, domestic_intl, receipt_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, item.expense_type, item.transaction_date, item.business_purpose,
                    item.vendor_name, item.city, item.payment_type, item.amount,
                    item.billable, item.project_no, item.event,
                    item.domestic_intl, receiptPath
                ]
            );
        }

        await connection.commit();
        res.json({ message: `Draft ${claimStatus === 'Submitted' ? 'submitted' : 'updated'} successfully`, claimId: id });

    } catch (error) {
        await connection.rollback();
        console.error("Update draft error:", error);
        res.status(500).json({ message: "Failed to update draft" });
    } finally {
        connection.release();
    }
};

// Get Claims for Employee
export const getMyClaims = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const [claims] = await db.query(
            `SELECT * FROM expense_claims WHERE employee_id = ? ORDER BY created_at DESC`,
            [employeeId]
        );
        res.json(claims);
    } catch (error) {
        console.error("Get my claims error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Pending Claims (Admin)
export const getPendingClaims = async (req, res) => {
    try {
        // Only return pending claims, join with user info
        const [claims] = await db.query(`
            SELECT 
                ec.*, 
                u.name as employee_name, 
                u.email as employee_email
            FROM expense_claims ec
            JOIN users u ON ec.employee_id = u.id
            WHERE ec.status IN ('Submitted', 'Pending') 
            ORDER BY ec.created_at ASC
        `);
        res.json(claims);
    } catch (error) {
        console.error("Get pending claims error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Approved Expenses (Admin Analysis)
export const getApprovedExpenses = async (req, res) => {
    try {
        const { groupBy } = req.query; // 'date', 'vendor', or null

        let query = `
            SELECT 
                ei.*,
                ec.report_name,
                u.name as employee_name
            FROM expense_items ei
            JOIN expense_claims ec ON ei.claim_id = ec.id
            JOIN users u ON ec.employee_id = u.id
            WHERE ec.status = 'Approved'
        `;

        // Fetch all approved items first (flat list)
        // We do grouping in JS to avoid MySQL version issues with JSON_ARRAYAGG
        const flatQuery = `
            SELECT 
                ei.*,
                ec.report_name,
                u.name as employee_name
            FROM expense_items ei
            JOIN expense_claims ec ON ei.claim_id = ec.id
            JOIN users u ON ec.employee_id = u.id
            WHERE ec.status = 'Approved'
            ORDER BY ei.transaction_date DESC
        `;

        const [flatResults] = await db.query(flatQuery);

        if (!groupBy) {
            return res.json(flatResults);
        }

        // JS Grouping Logic
        const grouped = flatResults.reduce((acc, item) => {
            let key = '';
            if (groupBy === 'date') {
                try {
                    key = new Date(item.transaction_date).toISOString().split('T')[0];
                } catch (e) { key = 'Invalid Date'; }
            } else if (groupBy === 'vendor') {
                key = item.vendor_name || 'Unknown Vendor';
            }

            if (!acc[key]) {
                acc[key] = {
                    group_key: key,
                    count: 0,
                    total_amount: 0,
                    items: []
                };
            }

            acc[key].count++;
            acc[key].total_amount += parseFloat(item.amount || 0);
            acc[key].items.push(item);
            return acc;
        }, {});

        // Convert object to array and sort
        const parsedResults = Object.values(grouped).sort((a, b) => {
            if (groupBy === 'date') return new Date(b.group_key) - new Date(a.group_key);
            return b.total_amount - a.total_amount;
        });

        console.log(`[getApprovedExpenses] Fetched ${parsedResults.length} groups (JS Grouping)`);
        res.json(parsedResults);

    } catch (error) {
        console.error("Get approved expenses error:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// Get Claim Details (Items)
export const getClaimDetails = async (req, res) => {
    try {
        const { claimId } = req.params;
        const [items] = await db.query(
            `SELECT * FROM expense_items WHERE claim_id = ?`,
            [claimId]
        );
        res.json(items);
    } catch (error) {
        console.error("Get claim details error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update Claim Status
export const updateClaimStatus = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        await db.query(
            `UPDATE expense_claims SET status = ? WHERE id = ?`,
            [status, claimId]
        );

        res.json({ message: `Claim ${status} successfully` });
    } catch (error) {
        console.error("Update claim status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// Get Grouped Expenses
export const getGroupedExpenses = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { by } = req.query; // 'date' or 'vendor'

        let query = "";
        if (by === 'date') {
            query = `
                SELECT DATE(transaction_date) as transaction_date, 
                       SUM(amount) AS total_amount, 
                       COUNT(*) AS expense_count
                FROM expense_items 
                WHERE claim_id = ? 
                GROUP BY DATE(transaction_date)
                ORDER BY transaction_date DESC
            `;
        } else if (by === 'vendor') {
            query = `
                SELECT vendor_name, 
                       SUM(amount) AS total_amount, 
                       COUNT(*) AS expense_count
                FROM expense_items 
                WHERE claim_id = ? 
                GROUP BY vendor_name
                ORDER BY total_amount DESC
            `;
        } else {
            return res.status(400).json({ message: "Invalid grouping parameter" });
        }

        const [groups] = await db.query(query, [claimId]);
        res.json(groups);

    } catch (error) {
        console.error("Get grouped expenses error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -- EXPORTS & ZIP --
export const exportExcel = async (req, res) => {
    try {
        const { claimId } = req.params;
        const [claim] = await db.query(`SELECT * FROM expense_claims WHERE id = ?`, [claimId]);
        const [items] = await db.query(`SELECT * FROM expense_items WHERE claim_id = ?`, [claimId]);

        if (claim.length === 0) return res.status(404).json({ message: "Claim not found" });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Expense Report');

        // Header Info
        sheet.addRow(['Report Name:', claim[0].report_name]);
        sheet.addRow(['Total Amount:', claim[0].total_amount]);
        sheet.addRow(['Status:', claim[0].status]);
        sheet.addRow([]);

        // Table Header
        sheet.addRow(['Date', 'Type', 'Vendor', 'Business Purpose', 'City', 'Payment', 'Amount', 'Billable']);

        // Items
        items.forEach(item => {
            sheet.addRow([
                new Date(item.transaction_date).toLocaleDateString(),
                item.expense_type,
                item.vendor_name,
                item.business_purpose,
                item.city,
                item.payment_type,
                item.amount,
                item.billable ? 'Yes' : 'No'
            ]);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=claim_${claimId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Excel export error:", error);
        res.status(500).json({ message: "Export failed" });
    }
};

export const exportPdf = async (req, res) => {
    try {
        const { claimId } = req.params;
        const [claim] = await db.query(`SELECT * FROM expense_claims WHERE id = ?`, [claimId]);
        const [items] = await db.query(`SELECT * FROM expense_items WHERE claim_id = ?`, [claimId]);

        if (claim.length === 0) return res.status(404).json({ message: "Claim not found" });

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=claim_${claimId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Expense Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Report Name: ${claim[0].report_name}`);
        doc.text(`Total Amount: ${claim[0].total_amount}`);
        doc.text(`Status: ${claim[0].status}`);
        doc.moveDown();

        // Items (Simple list for now, table is complex in raw PDFKit)
        doc.fontSize(14).text('Expenses:', { underline: true });
        doc.moveDown();

        items.forEach(item => {
            doc.fontSize(10).text(`${new Date(item.transaction_date).toLocaleDateString()} - ${item.expense_type} - ${item.vendor_name} - Rs.${item.amount}`);
            doc.fontSize(8).text(`Purpose: ${item.business_purpose} | City: ${item.city}`);
            doc.moveDown(0.5);
        });

        doc.end();

    } catch (error) {
        console.error("PDF export error:", error);
        res.status(500).json({ message: "Export failed" });
    }
};

export const downloadReceiptsZip = async (req, res) => {
    try {
        const { claimId } = req.params;
        const [items] = await db.query(`SELECT receipt_path FROM expense_items WHERE claim_id = ? AND receipt_path IS NOT NULL`, [claimId]);

        if (items.length === 0) return res.status(404).json({ message: "No receipts found" });

        const archive = archiver('zip', { zlib: { level: 9 } });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=receipts_${claimId}.zip`);

        archive.pipe(res);

        items.forEach((item, index) => {
            // Check if file exists
            if (fs.existsSync(item.receipt_path)) {
                archive.file(item.receipt_path, { name: `receipt_${index + 1}_${path.basename(item.receipt_path)}` });
            }
        });

        await archive.finalize();

    } catch (error) {
        console.error("ZIP download error:", error);
        res.status(500).json({ message: "ZIP generation failed" });
    }
};

export const exportItemsBulk = async (req, res) => {
    try {
        const { itemIds } = req.body; // Array of IDs
        const { type } = req.query; // 'excel' or 'pdf'

        if (!itemIds || itemIds.length === 0) {
            return res.status(400).json({ message: "No items selected" });
        }

        // Fetch details including employee and report info
        const query = `
            SELECT 
                ei.*,
                ec.report_name,
                u.name as employee_name
            FROM expense_items ei
            JOIN expense_claims ec ON ei.claim_id = ec.id
            JOIN users u ON ec.employee_id = u.id
            WHERE ei.id IN (?)
        `;

        const [items] = await db.query(query, [itemIds]);

        if (items.length === 0) {
            return res.status(404).json({ message: "Selected items not found" });
        }

        if (type === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Selected Expenses');

            // Table Header
            sheet.addRow(['Date', 'Employee', 'Report', 'Type', 'Vendor', 'Business Purpose', 'City', 'Payment', 'Amount', 'Billable']);

            // Items
            items.forEach(item => {
                sheet.addRow([
                    new Date(item.transaction_date).toLocaleDateString(),
                    item.employee_name,
                    item.report_name,
                    item.expense_type,
                    item.vendor_name,
                    item.business_purpose,
                    item.city,
                    item.payment_type,
                    item.amount,
                    item.billable ? 'Yes' : 'No'
                ]);
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=expenses_export.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } else if (type === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=expenses_export.pdf`);

            doc.pipe(res);

            // Header
            doc.fontSize(20).text('Expense Export', { align: 'center' });
            doc.moveDown();

            // Items
            // doc.fontSize(14).text('Selected Items:', { underline: true });
            // doc.moveDown();

            items.forEach(item => {
                doc.fontSize(10).text(`${new Date(item.transaction_date).toLocaleDateString()} - ${item.employee_name} (${item.report_name})`);
                doc.fontSize(12).text(`${item.expense_type} - ${item.vendor_name} - Rs.${item.amount}`);
                doc.fontSize(8).text(`Purpose: ${item.business_purpose} | City: ${item.city}`);
                doc.moveDown(0.5);
                doc.moveTo(doc.x, doc.y).lineTo(500, doc.y).stroke(); // Separator line
                doc.moveDown(0.5);
            });

            doc.end();
        } else {
            return res.status(400).json({ message: "Invalid export type" });
        }

    } catch (error) {
        console.error("Bulk export error:", error);
        res.status(500).json({ message: "Export failed" });
    }
};
