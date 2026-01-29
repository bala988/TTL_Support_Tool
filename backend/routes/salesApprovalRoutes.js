import express from "express";
import { 
  requestSalesApproval, 
  getSalesApprovals, 
  updateSalesApproval,
  getApprovalStatus
} from "../controllers/salesApprovalController.js";

const router = express.Router();

router.post("/request", requestSalesApproval);
router.get("/", getSalesApprovals);
router.put("/:id", updateSalesApproval);
router.get("/status/:opportunityId", getApprovalStatus);

export default router;
