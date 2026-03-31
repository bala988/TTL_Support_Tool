import { db } from "../config/db.js";
import fs from "fs";
import path from "path";
import { uploadFileToDrive } from "../services/googleDriveService.js";
import { sendTicketAcknowledgement } from "../services/whatsappService.js";
import { sendEmail } from "../utils/mailer.js";

// Mapping of customer names (lowercase) to their specific Google Drive Folder IDs
// This ensures attachments for these customers go to their dedicated folders
const getCustomerFolders = () => ({
  'collabera': process.env.GOOGLE_DRIVE_FOLDER_ID_COLLABERA,
  'flipkart': process.env.GOOGLE_DRIVE_FOLDER_ID_FLIPKART,
  'freshworks': process.env.GOOGLE_DRIVE_FOLDER_ID_FRESHWORKS,
  'groww': process.env.GOOGLE_DRIVE_FOLDER_ID_GROWW,
  'hexaware': process.env.GOOGLE_DRIVE_FOLDER_ID_HEXAWARE,
  'hexaware projects': process.env.GOOGLE_DRIVE_FOLDER_ID_HEXAWARE_PROJECTS,
  'movate': process.env.GOOGLE_DRIVE_FOLDER_ID_MOVATE,
  'mpl': process.env.GOOGLE_DRIVE_FOLDER_ID_MPL,
  'others': process.env.GOOGLE_DRIVE_FOLDER_ID_OTHERS,
  'quest': process.env.GOOGLE_DRIVE_FOLDER_ID_QUEST,
  'swiggy': process.env.GOOGLE_DRIVE_FOLDER_ID_SWIGGY,
  'vishwa samudra': process.env.GOOGLE_DRIVE_FOLDER_ID_VISHWA_SAMUDRA
});

// Helper function to get the correct folder ID based on customer name
// 1. Normalizes input (lowercase, trim)
// 2. Checks if specific folder exists for customer
// 3. Falls back to 'others' folder if customer not found in map
// 4. Final fallback to default TICKET folder from .env
const getCustomerFolderId = (customerName) => {
  if (!customerName) return process.env.GOOGLE_DRIVE_FOLDER_ID_TICKETS;
  const normalized = customerName.toLowerCase().trim();
  const folders = getCustomerFolders();
  return folders[normalized] || folders['others'] || process.env.GOOGLE_DRIVE_FOLDER_ID_TICKETS;
};

export const createTicket = async (req, res) => {
  try {
    const {
      severity, ticket_type, technology_domain, customer_name, customer_serial_no,
      tsg_id, csp_id, contact_name, contact_phone, contact_email,
      assigned_engineer, engineer_phone, engineer_email,
      issue_subject, issue_description, oem_tac_involved, tac_case_number,
      engineer_remarks, problem_resolution, reference_url,
      open_date, close_date, created_by
    } = req.body;

    // Validate contact phone - must be exactly 10 digits to avoid server errors
    const phoneDigits = String(contact_phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ message: "Invalid contact phone. Enter a 10-digit mobile number." });
    }

    const [creator] = await db.query(
      "SELECT name FROM users WHERE id = ?",
      [created_by]
    );
    const createdByName = creator.length ? creator[0].name : "System";

    const initialTimeline = [
      {
        date: (open_date ? new Date(open_date) : new Date()).toISOString(),
        event: "Ticket created",
        user: createdByName,
        type: "create"
      }
    ];

    // Generate custom ticket ID
    // Format: TTLDDMMYY0001
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;

    const prefix = `TTL${dateStr}`;

    // Find the latest ticket number with this prefix
    const [latestTickets] = await db.query(
      "SELECT ticket_number FROM tickets WHERE ticket_number LIKE ? ORDER BY id DESC LIMIT 1",
      [`${prefix}%`]
    );

    let nextSeq = 1;
    if (latestTickets.length > 0 && latestTickets[0].ticket_number) {
      const lastId = latestTickets[0].ticket_number;
      // Expected format: TTLDDMMYYxxxx (prefix + 4 digits)
      const lastSeqStr = lastId.replace(prefix, '');
      const lastSeq = parseInt(lastSeqStr);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const ticketNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    // Fix: Ensure open_date is in valid MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
    // If open_date is ISO string (2025-02-07T10:00:00.000Z), slice it.
    // If it is just Date (YYYY-MM-DD), append time.
    let formattedOpenDate = open_date ? new Date(open_date) : new Date();
    if (isNaN(formattedOpenDate.getTime())) {
        formattedOpenDate = new Date();
    }
    // Convert to MySQL format
    const toMySQLDate = (date) => {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    };
    
    // Ensure created_by is valid (handle potential empty string)
    const creatorId = created_by && created_by !== "undefined" && created_by !== "null" ? created_by : null;

    let finalEmail = engineer_email || "";
    let finalPhone = engineer_phone || "";
    if (assigned_engineer) {
      const [u] = await db.query("SELECT email, phone FROM users WHERE name = ? LIMIT 1", [assigned_engineer]);
      if (u.length > 0) {
        finalEmail = u[0].email || "";
        finalPhone = u[0].phone || "";
      }
    }

    const [result] = await db.query(
      `INSERT INTO tickets (
        ticket_number,
        severity, ticket_type, technology_domain, customer_name, customer_serial_no,
        tsg_id, csp_id, contact_name, contact_phone, contact_email,
        assigned_engineer, engineer_phone, engineer_email,
        issue_subject, issue_description, oem_tac_involved, tac_case_number,
        engineer_remarks, problem_resolution, reference_url,
        open_date, close_date, created_by, status, timeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)`,
      [
        ticketNumber,
        severity, ticket_type, technology_domain, customer_name, customer_serial_no,
        tsg_id, csp_id, contact_name, contact_phone, contact_email,
        assigned_engineer, finalPhone, finalEmail,
        issue_subject, issue_description, oem_tac_involved, tac_case_number,
        engineer_remarks, problem_resolution, reference_url,
        toMySQLDate(formattedOpenDate), close_date || null, creatorId, JSON.stringify(initialTimeline)
      ]
    );

    const ticketId = result.insertId;

    // Handle attachment
    if (req.file) {
      console.log(`Processing attachment for ticket ${ticketNumber}: ${req.file.originalname}`);

      // Construct new filename: ticketno_issue_description(first 20 char)
      const cleanDesc = (issue_description || 'issue').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const fileExt = path.extname(req.file.originalname);
      const newFileName = `${ticketNumber}_${cleanDesc}${fileExt}`;

      let filePath = req.file.path; // Default to temp path

      // Try uploading to Google Drive
      const folderId = getCustomerFolderId(customer_name);
      console.log(`Uploading to folder: ${folderId} for customer: ${customer_name}`);
      
      let driveResult = { success: false };
      try {
          driveResult = await uploadFileToDrive(
            req.file.path,
            newFileName,
            req.file.mimetype,
            folderId
          );
      } catch (driveError) {
          console.error("Drive upload exception:", driveError);
      }

      if (driveResult.success) {
        console.log("Attachment uploaded to Google Drive successfully");
        filePath = driveResult.webViewLink;

        // Delete local temp file
        try {
          if (fs.existsSync(req.file.path)) {
             fs.unlinkSync(req.file.path);
          }
        } catch (e) {
          console.warn("Failed to delete temp file after Drive upload:", e);
        }
      } else {
        console.warn("Google Drive upload failed, falling back to local storage. Error:", driveResult.error || "Unknown error");

        // Fallback: Move to permanent local storage
        const targetDir = path.join('uploads', 'tickets', String(ticketId)); // Use path.join for cross-platform
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const targetPath = path.join(targetDir, newFileName);
        
        // Copy and delete (safer than rename across partitions/mounts)
        try {
            if (fs.existsSync(req.file.path)) {
                fs.copyFileSync(req.file.path, targetPath);
                fs.unlinkSync(req.file.path);
                filePath = targetPath;
            } else {
                console.error("Temp file not found for fallback move:", req.file.path);
            }
        } catch (moveError) {
            console.error("Failed to move file locally:", moveError);
            // Don't fail the request, just log it. Ticket is created.
        }
      }

      await db.query(
        `INSERT INTO ticket_attachments (
          ticket_id, file_name, file_path, file_type, file_size
        ) VALUES (?, ?, ?, ?, ?)`,
        [ticketId, newFileName, filePath, req.file.mimetype, req.file.size]
      );
    }

    // Send WhatsApp Acknowledgement
    if (contact_phone) {
      await sendTicketAcknowledgement(contact_name,        // {{1}} Hello {{1}}
        ticketNumber,         // {{2}} Ticket ID
        issue_description,    // {{3}} Issue
        assigned_engineer,    // {{4}} Assigned Engineer
        engineer_phone,       // {{5}} Engineer Contact
        contact_phone         // Recipient number
      );
    }


    res.status(201).json({
      status: "success",
      message: "Ticket created successfully",
      ticketId,
      ticketNumber // Return the formatted ticket number
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: "Server error creating ticket" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(`
      SELECT 
        t.id, t.ticket_number, t.severity, t.status, t.ticket_type, t.customer_name as customer, 
        t.customer_serial_no, t.technology_domain as product, t.open_date, t.close_date, t.assigned_engineer,
        t.issue_subject, t.issue_description, t.oem_tac_involved, t.tac_case_number,
        t.engineer_remarks, t.problem_resolution, t.reference_url, t.timeline,
        u.name as created_by_name
      FROM tickets t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.open_date DESC
    `);

    res.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ message: "Server error fetching tickets" });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const [tickets] = await db.query(`
      SELECT t.*, u.name as created_by_name,
        eng.phone as assigned_engineer_phone,
        eng.email as assigned_engineer_email
      FROM tickets t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users eng ON eng.name = t.assigned_engineer
      WHERE t.id = ?
    `, [id]);
    
    // Debug logs removed to prevent console spam

    if (tickets.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const [attachments] = await db.query(
      "SELECT * FROM ticket_attachments WHERE ticket_id = ?",
      [id]
    );

    const ticket = tickets[0];

    // Force override stale values using JOIN data
    if (ticket.assigned_engineer_phone) {
      ticket.engineer_phone = ticket.assigned_engineer_phone;
    }

    if (ticket.assigned_engineer_email) {
      ticket.engineer_email = ticket.assigned_engineer_email;
    }

    // Debug log removed

    // Ensure dates are ISO strings for frontend consistency
    if (ticket.open_date && !(ticket.open_date instanceof Date)) {
      ticket.open_date = new Date(ticket.open_date).toISOString();
    } else if (ticket.open_date instanceof Date) {
      ticket.open_date = ticket.open_date.toISOString();
    }
    
    if (ticket.close_date && !(ticket.close_date instanceof Date)) {
      ticket.close_date = new Date(ticket.close_date).toISOString();
    } else if (ticket.close_date instanceof Date) {
      ticket.close_date = ticket.close_date.toISOString();
    }

    res.json({
      ticket,
      attachments
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({ message: "Server error fetching ticket" });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, severity, issue_subject, issue_description,
      engineer_remarks, problem_resolution, timeline, rough_notes,
      oem_tac_involved, tac_case_number, reference_url,
      close_date
    } = req.body;

    let parsedOemTac = oem_tac_involved === 'null' ? null : oem_tac_involved;
    let parsedTacCase = tac_case_number === 'null' ? null : tac_case_number;
    let parsedEngRemarks = engineer_remarks === 'null' ? null : engineer_remarks;
    let parsedProbRes = problem_resolution === 'null' ? null : problem_resolution;
    let parsedRoughNotes = rough_notes === 'null' ? null : rough_notes;

    let query = `UPDATE tickets SET 
        status = ?, severity = ?, issue_subject = ?, issue_description = ?,
        engineer_remarks = ?, problem_resolution = ?, rough_notes = ?,
        oem_tac_involved = ?, tac_case_number = ?, reference_url = ?`;

    const params = [status, severity, issue_subject, issue_description, parsedEngRemarks, parsedProbRes, parsedRoughNotes, parsedOemTac, parsedTacCase, reference_url];

    if (timeline) {
      query += `, timeline = ?`;
      params.push(typeof timeline === 'string' ? timeline : JSON.stringify(timeline));
    }

    // Fix: If status is Closed, ensure close_date is set.
    // Use provided close_date (UTC) if available to avoid DB server timezone issues with NOW()
    if (status === 'Closed') {
       if (close_date) {
           const d = new Date(close_date);
           const validDate = isNaN(d.getTime()) ? new Date() : d;
           const mysqlDate = validDate.toISOString().slice(0, 19).replace('T', ' ');
           query += `, close_date = ?`;
           params.push(mysqlDate);
       } else {
           query += `, close_date = IFNULL(close_date, NOW())`;
       }
    } else {
       query += `, close_date = NULL`;
    }

    // Safely map identifier to primary key integer to resolve TTL string vs ID mismatch
    const [matching] = await db.query("SELECT id FROM tickets WHERE id = ? OR ticket_number = ?", [id, id]);
    if (matching.length === 0) {
      return res.status(404).json({ message: "Update rejected: Ticket identifier not found in DB." });
    }
    const safeDbId = matching[0].id;
    
    query += ` WHERE id = ?`;
    params.push(safeDbId);

    try {
      const [updateResult] = await db.query(query, params);
      if (updateResult.affectedRows === 0) {
        console.warn("Update processed but 0 matching rows changed for identifier:", safeDbId);
      }
    } catch (err) {
      const msg = String(err.message || '');
      if (msg.includes('incorrect enum value') || msg.includes('Invalid ENUM value')) {
        await db.query(`
          ALTER TABLE tickets 
          MODIFY COLUMN status ENUM('Open', 'In Progress', 'Pending from Customer', 'Closed') 
          DEFAULT 'Open'
        `);
        const [retryResult] = await db.query(query, params);
        if (retryResult.affectedRows === 0) {
          console.warn("Enum update processed but 0 matching rows changed for identifier:", safeDbId);
        }
      } else {
        throw err;
      }
    }

    // Handle new attachment if provided
    if (req.file) {
      console.log(`Processing new attachment for ticket ${id}: ${req.file.originalname}`);

      // Need ticket info for naming convention and folder selection
      const [ticketInfo] = await db.query("SELECT ticket_number, customer_name FROM tickets WHERE id = ?", [id]);
      
      if (ticketInfo.length > 0) {
        const { ticket_number, customer_name } = ticketInfo[0];
        
        // Construct new filename
        const cleanDesc = (issue_description || 'update').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const fileExt = path.extname(req.file.originalname);
        const newFileName = `${ticket_number}_${cleanDesc}_updated${fileExt}`;

        let filePath = req.file.path;

        // Try uploading to Google Drive
        const folderId = getCustomerFolderId(customer_name);
        console.log(`Uploading to folder: ${folderId} for customer: ${customer_name}`);
        
        const driveResult = await uploadFileToDrive(
          req.file.path,
          newFileName,
          req.file.mimetype,
          folderId
        );

        if (driveResult.success) {
          console.log("Attachment uploaded to Google Drive successfully");
          filePath = driveResult.webViewLink;

          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            console.warn("Failed to delete temp file:", e);
          }
        } else {
          console.warn("Drive upload failed, using local storage");
          const targetDir = `uploads/tickets/${id}`;
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const targetPath = path.join(targetDir, newFileName);
          if (fs.existsSync(req.file.path)) {
            fs.renameSync(req.file.path, targetPath);
            filePath = targetPath;
          }
        }

        await db.query(
          `INSERT INTO ticket_attachments (
            ticket_id, file_name, file_path, file_type, file_size
          ) VALUES (?, ?, ?, ?, ?)`,
          [id, newFileName, filePath, req.file.mimetype, req.file.size]
        );
      }
    }

    res.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ message: "Server error updating ticket" });
  }
};

export const sendFeedbackEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { to, subject, message } = req.body;
    const [tickets] = await db.query("SELECT ticket_number, contact_email, customer_name FROM tickets WHERE id = ?", [id]);
    if (tickets.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    const ticket = tickets[0];
    const recipient = to && to.trim() ? to.trim() : ticket.contact_email;
    const emailSubject = subject && subject.trim() ? subject.trim() : `Feedback for Ticket ${ticket.ticket_number || id}`;
    const html = `<div><p>${message || "Please find the feedback attachment for your reference."}</p><p>Ticket: ${ticket.ticket_number || id}</p></div>`;

    let attachmentPath = null;
    let attachmentName = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const cleanName = `Feedback_${ticket.ticket_number || id}${ext}`;
      const targetDir = path.join('uploads', 'tickets', String(id), 'feedback');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const dest = path.join(targetDir, cleanName);
      fs.copyFileSync(req.file.path, dest);
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      attachmentPath = dest;
      attachmentName = cleanName;

      await db.query(
        `INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)`,
        [id, cleanName, dest, req.file.mimetype, req.file.size]
      );
    }

    const attachments = attachmentPath ? [{ filename: attachmentName, path: attachmentPath, contentType: req.file.mimetype }] : [];
    await sendEmail({ to: recipient, subject: emailSubject, html, attachments });

    res.json({ message: "Feedback email sent" });
  } catch (error) {
    console.error("Feedback email error:", error);
    res.status(500).json({ message: "Server error sending feedback email" });
  }
};

// Delete an attachment record and remove local file if present
export const deleteAttachment = async (req, res) => {
  try {
    const { ticketId, attachmentId } = req.params;
    // Fetch attachment info
    const [rows] = await db.query(
      "SELECT file_path FROM ticket_attachments WHERE id = ? AND ticket_id = ?",
      [attachmentId, ticketId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Attachment not found" });
    }
    const filePath = rows[0].file_path || '';

    // Delete DB record
    await db.query("DELETE FROM ticket_attachments WHERE id = ? AND ticket_id = ?", [attachmentId, ticketId]);

    // If local file, try to delete (ignore errors)
    try {
      if (filePath && !/^https?:\/\//i.test(filePath) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn("Failed to delete local attachment file:", e);
    }

    res.json({ message: "Attachment deleted" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    res.status(500).json({ message: "Server error deleting attachment" });
  }
};

export const transferTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_engineer, userName } = req.body;

    console.log("Assign request:", assigned_engineer);

    // Get correct engineer details from users table
    const [users] = await db.query(
      "SELECT email, phone FROM users WHERE name = ? LIMIT 1",
      [assigned_engineer]
    );

    if (!users.length) {
      return res.status(400).json({ message: "Engineer not found" });
    }

    const newEmail = users[0].email || "";
    const newPhone = users[0].phone || "";

    // Get existing timeline
    const [tickets] = await db.query(
      "SELECT id, timeline FROM tickets WHERE id = ? OR ticket_number = ?",
      [id, id]
    );

    if (!tickets.length) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const actualId = tickets[0].id;
    let timeline = [];
    if (tickets[0].timeline) {
      timeline = typeof tickets[0].timeline === 'string'
        ? JSON.parse(tickets[0].timeline)
        : tickets[0].timeline;
    }

    // Add assignment event
    console.log("Timeline before push:", timeline);
    timeline.push({
      date: new Date().toISOString(),
      event: `Assigned to ${assigned_engineer}`,
      user: userName || "Admin",
      type: "assign"
    });
    console.log("Timeline after push:", timeline);

    const timelineStr = JSON.stringify(timeline);
    console.log("Saving timeline string:", timelineStr);

    // 🔥 CRITICAL: update DB correctly
    const [updateResult] = await db.query(
      `UPDATE tickets 
       SET assigned_engineer = ?, 
           engineer_email = ?, 
           engineer_phone = ?, 
           timeline = ? 
       WHERE id = ?`,
      [assigned_engineer, newEmail, newPhone, timelineStr, actualId]
    );

    if (updateResult.affectedRows === 0) {
       return res.status(400).json({ message: "Assignment update rejected: DB returned 0 rows affected." });
    }

    console.log("DB updated successfully");

    res.json({ message: "Ticket transferred successfully" });

  } catch (error) {
    console.error("Transfer error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
