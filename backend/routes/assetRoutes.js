import express from "express";
import { 
  getAssets, 
  getUserAssets, 
  createAsset, 
  updateAsset, 
  deleteAsset 
} from "../controllers/assetController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All asset routes are for admins
router.use(verifyToken);

router.get("/", getAssets);
router.get("/user/:userId", getUserAssets);
router.post("/", createAsset);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;
