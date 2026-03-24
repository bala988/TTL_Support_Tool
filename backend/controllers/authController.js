import { db } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await db.query(
      "INSERT INTO users (name, email, phone, password_hash, role, profile_picture, home_address, aadhar_number, pan_number, blood_group, emergency_contact, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        name,
        email,
        req.body.phone || null,
        passwordHash,
        role === 'sales' ? 'sales' : 'engineer',
        null,
        null,
        null,
        null,
        null,
        null
      ]
    );

    res.status(201).json({
      status: "success",
      message: "Signup successful"
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate Token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      status: "success",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profile_picture,
        homeAddress: user.home_address,
        aadharNumber: user.aadhar_number,
        panNumber: user.pan_number,
        bloodGroup: user.blood_group,
        emergencyContact: user.emergency_contact
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, name, email, phone, role FROM users ORDER BY name ASC");
    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};


export const getMe = async (req, res) => {
  try {
    const user = req.user; // Attached by verifyToken middleware
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      status: "success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profile_picture,
        homeAddress: user.home_address,
        aadharNumber: user.aadhar_number,
        panNumber: user.pan_number,
        bloodGroup: user.blood_group,
        emergencyContact: user.emergency_contact
      }
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};
