import express from "express";
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from "../controllers/customerController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All customer routes are for admins
router.use(verifyToken);

router.get("/", getCustomers);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
