import express from "express";
import { signup, login, getAllUsers, getMe } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/users", getAllUsers);
router.get("/me", verifyToken, getMe);

export default router;
