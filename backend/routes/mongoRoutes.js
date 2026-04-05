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
  getDashboardStats,
} from '../controllers/mongo/adminController.js';
import {
  punchIn,
  punchOut,
  getTodayPunch,
  getWeeklySummary,
} from '../controllers/mongo/punchController.js';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
} from '../controllers/mongo/leaveController.js';
import {
  applyRegularization,
  getMyRegularizations,
  getAllRegularizations,
  reviewRegularization,
} from '../controllers/mongo/regularizationController.js';
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

// --- Punch Clock Routes ---
router.post('/punch/in', punchIn);
router.post('/punch/out', punchOut);
router.get('/punch/today', getTodayPunch);
router.get('/punch/weekly', getWeeklySummary);

// --- Leave Routes (Employee) ---
router.post('/leave/apply', applyLeave);
router.get('/leave/my', getMyLeaves);

// --- Regularization Routes (Employee) ---
router.post('/regularization/apply', applyRegularization);
router.get('/regularization/my', getMyRegularizations);

// --- Admin Routes ---
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
router.get('/admin/stats', requireAdmin, getDashboardStats);

// --- Leave Routes (Admin) ---
router.get('/admin/leaves', requireAdmin, getAllLeaves);
router.put('/admin/leave/:id/review', requireAdmin, reviewLeave);

// --- Regularization Routes (Admin) ---
router.get('/admin/regularizations', requireAdmin, getAllRegularizations);
router.put('/admin/regularization/:id/review', requireAdmin, reviewRegularization);

export default router;
