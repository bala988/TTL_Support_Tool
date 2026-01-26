import { db } from "../config/db.js";

export const requestAccess = async (req, res) => {
  try {
    const { ticketId, requesterId } = req.body;

    // Check if request already exists
    const [existing] = await db.query(
      "SELECT * FROM approval WHERE ticket_id = ? AND requester_id = ?",
      [ticketId, requesterId]
    );

    if (existing.length > 0) {
      if (existing[0].access) {
        return res.status(400).json({ message: "Access already granted" });
      }
      return res.status(400).json({ message: "Request already sent" });
    }

    await db.query(
      "INSERT INTO approval (ticket_id, requester_id, access) VALUES (?, ?, false)",
      [ticketId, requesterId]
    );

    res.json({ status: "success", message: "Access requested" });
  } catch (error) {
    console.error("Request access error:", error);
    res.status(500).json({ message: "Server error requesting access" });
  }
};

export const getApprovals = async (req, res) => {
  try {
    const [approvals] = await db.query(`
      SELECT 
        a.id, a.access, a.created_at,
        t.id as ticket_id, t.issue_subject,
        u.name as requester_name, u.email as requester_email
      FROM approval a
      JOIN tickets t ON a.ticket_id = t.id
      JOIN users u ON a.requester_id = u.id
      ORDER BY a.created_at DESC
    `);

    res.json(approvals);
  } catch (error) {
    console.error("Get approvals error:", error);
    res.status(500).json({ message: "Server error fetching approvals" });
  }
};

export const updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { access } = req.body; // boolean

    await db.query(
      "UPDATE approval SET access = ? WHERE id = ?",
      [access, id]
    );

    res.json({ status: "success", message: `Access updated` });
  } catch (error) {
    console.error("Update approval error:", error);
    res.status(500).json({ message: "Server error updating approval" });
  }
};

export const deleteApproval = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM approval WHERE id = ?", [id]);
    res.json({ status: "success", message: "Request removed" });
  } catch (error) {
    console.error("Delete approval error:", error);
    res.status(500).json({ message: "Server error deleting approval" });
  }
};

export const getMyApprovals = async (req, res) => {
  try {
    const { userId } = req.params;
    const [approvals] = await db.query(
      "SELECT ticket_id, access FROM approval WHERE requester_id = ?",
      [userId]
    );
    res.json(approvals);
  } catch (error) {
    console.error("Get my approvals error:", error);
    res.status(500).json({ message: "Server error fetching my approvals" });
  }
};
