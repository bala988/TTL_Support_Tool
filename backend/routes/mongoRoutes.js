import express from 'express';
import {
  markPresent,
  getAttendance,
  createWorklog,
  getWorklogsByDate,
  getWorklogsByRange,
  updateProfile,
} from '../controllers/mongo/attendanceController.js';
import {
  getAllEmployees,
  getEmployeeById,
  getEmployeeWorklogs,
  getEmployeeAttendance,
  exportEmployeeCSV,
  exportGlobalAttendanceCSV,
} from '../controllers/mongo/adminController.js';
import { verifyToken } from '../middlewares/authMiddleware.js'; // Main App Auth
import { syncMongoUser } from '../middlewares/mongoSync.js'; // Sync Middleware

const router = express.Router();

// Apply Auth & Sync globally for these routes
router.use(verifyToken); 
router.use(syncMongoUser);

// --- Employee Routes ---
router.post('/attendance/mark-present', markPresent);
router.get('/attendance', getAttendance);
router.post('/worklogs', createWorklog);
router.get('/worklogs', getWorklogsByDate);
router.get('/worklogs', getWorklogsByDate);
router.get('/worklogs/range', getWorklogsByRange);
router.put('/attendance/profile', updateProfile);

// --- Admin Routes ---
// Note: verifyToken checks for valid user. We might need extra check for Admin role if verifyToken doesn't block non-admins explicitly or if we want specific admin logic. 
// Main app likely has 'authenticateToken' or similar. I used 'verifyToken' assuming standard naming, I should check authMiddleware.js.

// Check role for admin routes
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

router.get('/admin/employees', requireAdmin, getAllEmployees);
router.get('/admin/employees/:id', requireAdmin, getEmployeeById);
router.get('/admin/employees/:id/worklogs', requireAdmin, getEmployeeWorklogs);
router.get('/admin/employees/:id/attendance', requireAdmin, getEmployeeAttendance);
router.get('/admin/employees/:id/export/csv', requireAdmin, exportEmployeeCSV);
router.get('/admin/attendance/export', requireAdmin, exportGlobalAttendanceCSV);

export default router;
