
import express from "express";
import multer from "multer";
import { 
  createOpportunity, 
  getOpportunities, 
  getOpportunityById, 
  updateOpportunity, 
  uploadSalesDocument 
} from "../controllers/salesController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/temp/" });

router.post("/", createOpportunity);
router.get("/", getOpportunities);
router.get("/:id", getOpportunityById);
router.put("/:id", updateOpportunity);
router.post("/:id/upload", upload.single("file"), uploadSalesDocument);

export default router;
