import { db } from "../config/db.js";
import fs from "fs";
import path from "path";
import { uploadFileToDrive } from "../services/googleDriveService.js";
import { sendTicketAcknowledgement } from "../services/whatsappService.js";

// Mapping of customer names (lowercase) to their specific Google Drive Folder IDs
// This ensures attachments for these customers go to their dedicated folders
const CUSTOMER_FOLDERS = {
  'collabera': '1u8QBAQOEe7SBvbz6T-eCH7kv4RBoYpp9',
  'flipkart': '1_jD2ChEzj96mk7y1DnLoKCvUylDGOHbx',
  'freshworks': '1M6zgVLsp83j-N_6XurQfdwB2iWapDSps',
  'groww': '1MGKkBBgt-yBBDSUMo4CqpLFQIwUD1giF',
  'hexaware': '1VYMv3-tBwHIrnxS4eJfyrhmVPvRlYyyn',
  'hexaware projects': '1KkgSzXqwk7hOGjyp2mqoYeZ06wWV7yqs',
  'movate': '1ezCV-1POU6qiUd8eLxfm8tP4LOlWkqRo',
  'mpl': '1MQCxWJ1BtSyYnmzPtUIOqEqgYWtf5boX',
  'others': '1T3KTK8sovxapjTrSK_ZUVklZ_vAxESYm',
  'quest': '175t-SDI7ak_GZHNBZBJFpuLJdBC2pfjY',
  'swiggy': '1vc347pcfCyw-gPKOj7QabFhl1BCa1FVZ',
  'vishwa samudra': '1xQUqBTwv2DAH5EShsS3g-QAYKNu5MT2L'
};

// Helper function to get the correct folder ID based on customer name
// 1. Normalizes input (lowercase, trim)
// 2. Checks if specific folder exists for customer
// 3. Falls back to 'others' folder if customer not found in map
// 4. Final fallback to default TICKET folder from .env
const getCustomerFolderId = (customerName) => {
  if (!customerName) return process.env.GOOGLE_DRIVE_FOLDER_ID_TICKETS;
  const normalized = customerName.toLowerCase().trim();
  return CUSTOMER_FOLDERS[normalized] || CUSTOMER_FOLDERS['others'] || process.env.GOOGLE_DRIVE_FOLDER_ID_TICKETS;
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

    const initialTimeline = [
      {
        date: open_date || new Date().toLocaleString(),
        event: "Ticket created",
        user: "System",
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
        assigned_engineer, engineer_phone, engineer_email,
        issue_subject, issue_description, oem_tac_involved, tac_case_number,
        engineer_remarks, problem_resolution, reference_url,
        open_date || new Date(), close_date || null, created_by, JSON.stringify(initialTimeline)
      ]
    );

    const ticketId = result.insertId;

    // Handle attachment
    if (req.file) {
      console.log(`Processing attachment: ${req.file.originalname}`);

      // Construct new filename: ticketno_issue_description(first 20 char)
      const cleanDesc = (issue_description || 'issue').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const fileExt = path.extname(req.file.originalname);
      const newFileName = `${ticketNumber}_${cleanDesc}${fileExt}`;

      let filePath = req.file.path; // Default to temp path

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

        // Delete local temp file
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.warn("Failed to delete temp file after Drive upload:", e);
        }
      } else {
        console.warn("Google Drive upload failed, falling back to local storage. Error:", driveResult.error);

        // Fallback: Move to permanent local storage
        const targetDir = `uploads/tickets/${ticketId}`;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const targetPath = path.join(targetDir, newFileName);
        // Rename (move) file from temp to target
        // check if file exists at req.file.path (it might not if upload logic messed with it, but here it should be fine)
        if (fs.existsSync(req.file.path)) {
          fs.renameSync(req.file.path, targetPath);
          filePath = targetPath;
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
      await sendTicketAcknowledgement(customer_name, contact_name, ticketNumber, contact_phone);
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
        t.engineer_remarks, t.problem_resolution,
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
    const [tickets] = await db.query("SELECT * FROM tickets WHERE id = ?", [id]);

    if (tickets.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const [attachments] = await db.query(
      "SELECT * FROM ticket_attachments WHERE ticket_id = ?",
      [id]
    );

    res.json({
      ticket: tickets[0],
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
      engineer_remarks, problem_resolution, timeline, rough_notes
    } = req.body;

    let query = `UPDATE tickets SET 
        status = ?, severity = ?, issue_subject = ?, issue_description = ?,
        engineer_remarks = ?, problem_resolution = ?, rough_notes = ?`;

    const params = [status, severity, issue_subject, issue_description, engineer_remarks, problem_resolution, rough_notes];

    if (timeline) {
      query += `, timeline = ?`;
      params.push(typeof timeline === 'string' ? timeline : JSON.stringify(timeline));
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await db.query(query, params);

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

export const transferTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_engineer } = req.body;

    await db.query(
      "UPDATE tickets SET assigned_engineer = ? WHERE id = ?",
      [assigned_engineer, id]
    );

    res.json({ message: "Ticket transferred successfully" });
  } catch (error) {
    console.error("Transfer ticket error:", error);
    res.status(500).json({ message: "Server error transferring ticket" });
  }
};
