import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import salesApprovalRoutes from "./routes/salesApprovalRoutes.js";
import reimbursementRoutes from "./routes/reimbursementRoutes.js";

import connectMongoDB from "./config/mongo.js";
import mongoRoutes from "./routes/mongoRoutes.js";

dotenv.config();

connectMongoDB(); // Connect to MongoDB

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/sales-approvals", salesApprovalRoutes);
app.use("/api/reimbursement", reimbursementRoutes);
app.use("/api", mongoRoutes); // Mount attendance routes


// Health check
app.get("/", (req, res) => {
  res.send("Ticket System API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
