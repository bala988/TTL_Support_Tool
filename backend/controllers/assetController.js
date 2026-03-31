import { db } from "../config/db.js";

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private/Admin
export const getAssets = async (req, res) => {
  try {
    const [assets] = await db.query(`
      SELECT a.*, u.name as user_name, u.email as user_email 
      FROM assets a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(assets);
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ message: "Server error fetching assets" });
  }
};

// @desc    Get assets for a specific employee
// @route   GET /api/assets/user/:userId
// @access  Private/Admin
export const getUserAssets = async (req, res) => {
  try {
    const { userId } = req.params;
    const [assets] = await db.query("SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    res.json(assets);
  } catch (error) {
    console.error("Get user assets error:", error);
    res.status(500).json({ message: "Server error fetching user assets" });
  }
};

// @desc    Create/Assign new asset
// @route   POST /api/assets
// @access  Private/Admin
export const createAsset = async (req, res) => {
  try {
    const { user_id, asset_type, model_no, serial_no, given_date } = req.body;
    
    if (!user_id || !asset_type) {
      return res.status(400).json({ message: "User ID and Asset Type are required" });
    }

    const [result] = await db.query(
      "INSERT INTO assets (user_id, asset_type, model_no, serial_no, given_date, status) VALUES (?, ?, ?, ?, ?, 'assigned')",
      [user_id, asset_type, model_no, serial_no, given_date || new Date()]
    );

    res.status(201).json({
      status: "success",
      message: "Asset assigned successfully",
      assetId: result.insertId
    });
  } catch (error) {
    console.error("Create asset error:", error);
    res.status(500).json({ message: "Server error assigning asset" });
  }
};

// @desc    Update asset status (return, damage, etc.)
// @route   PUT /api/assets/:id
// @access  Private/Admin
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_type, model_no, serial_no, given_date, return_date, status } = req.body;

    const [result] = await db.query(
      "UPDATE assets SET asset_type = ?, model_no = ?, serial_no = ?, given_date = ?, return_date = ?, status = ? WHERE id = ?",
      [asset_type, model_no, serial_no, given_date, return_date, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ status: "success", message: "Asset updated successfully" });
  } catch (error) {
    console.error("Update asset error:", error);
    res.status(500).json({ message: "Server error updating asset" });
  }
};

// @desc    Delete asset record
// @route   DELETE /api/assets/:id
// @access  Private/Admin
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM assets WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ status: "success", message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ message: "Server error deleting asset" });
  }
};
