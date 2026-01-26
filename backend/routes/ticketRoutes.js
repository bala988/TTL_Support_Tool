import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  transferTicket
} from "../controllers/ticketController.js";

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post("/create", upload.single("attachment"), createTicket);
router.get("/dashboard", getTickets);
router.get("/:id", getTicketById);
router.put("/:id", updateTicket);
router.put("/:id/transfer", transferTicket);

export default router;
