import { z } from 'zod';
import { db } from '../../config/db.js';
import Attendance from '../../models/mongo/Attendance.js';
import Worklog from '../../models/mongo/Worklog.js';
import validateWorklogOverlap from '../../utils/validateWorklogOverlap.js';
import bcrypt from 'bcrypt';

// Validation schemas
const attendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const worklogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  fromTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'From time must be in HH:mm format'),
  toTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'To time must be in HH:mm format'),
  activity: z.string().min(5, 'Activity description must be at least 5 characters'),
  customerName: z.string().optional().nullable(),
  ticketId: z.string().optional().nullable(),
});

// @desc    Mark attendance as present
// @route   POST /api/attendance/mark-present
// @access  Private (Employee - via MongoSync)
export const markPresent = async (req, res, next) => {
  try {
    const validatedData = attendanceSchema.parse(req.body);
    
    // Check if already marked
    const existingAttendance = await Attendance.findOne({
      userId: req.mongoUser._id,
      date: validatedData.date,
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date',
      });
    }
    
    // Create attendance record
    const attendance = await Attendance.create({
      userId: req.mongoUser._id,
      date: validatedData.date,
    });
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((e) => e.message),
      });
    }
    next(error);
  }
};

// @desc    Get attendance by month
// @route   GET /api/attendance?month=YYYY-MM
// @access  Private (Employee)
export const getAttendance = async (req, res, next) => {
  try {
    const { month } = req.query;
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be in YYYY-MM format',
      });
    }
    
    // Get all attendance records for this month
    const attendance = await Attendance.find({
      userId: req.mongoUser._id,
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create worklog
// @route   POST /api/attendance/worklogs
// @access  Private (Employee)
export const createWorklog = async (req, res, next) => {
  try {
    const validatedData = worklogSchema.parse(req.body);
    
    // Validate time range
    const [fromHours, fromMinutes] = validatedData.fromTime.split(':').map(Number);
    const [toHours, toMinutes] = validatedData.toTime.split(':').map(Number);
    const fromTotalMinutes = fromHours * 60 + fromMinutes;
    const toTotalMinutes = toHours * 60 + toMinutes;
    
    if (toTotalMinutes <= fromTotalMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }
    
    // Check for overlaps
    const overlapCheck = await validateWorklogOverlap(
      req.mongoUser._id,
      validatedData.date,
      validatedData.fromTime,
      validatedData.toTime
    );
    
    if (!overlapCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: overlapCheck.message,
      });
    }
    
    // Create worklog
    const worklog = await Worklog.create({
      userId: req.mongoUser._id,
      date: validatedData.date,
      fromTime: validatedData.fromTime,
      toTime: validatedData.toTime,
      activity: validatedData.activity,
      customerName: validatedData.customerName || null,
      ticketId: validatedData.ticketId || null,
    });
    
    res.status(201).json({
      success: true,
      message: 'Worklog created successfully',
      data: { worklog },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((e) => e.message),
      });
    }
    next(error);
  }
};

// @desc    Get worklogs by date
// @route   GET /api/attendance/worklogs?date=YYYY-MM-DD
// @access  Private (Employee)
export const getWorklogsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Date must be in YYYY-MM-DD format',
      });
    }
    
    const worklogs = await Worklog.find({
      userId: req.mongoUser._id,
      date,
    }).sort({ fromTime: 1 });
    
    res.status(200).json({
      success: true,
      data: { worklogs },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get worklogs by date range
// @route   GET /api/attendance/worklogs/range?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private (Employee)
export const getWorklogsByRange = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      return res.status(400).json({
        success: false,
        message: 'From date must be in YYYY-MM-DD format',
      });
    }
    
    if (!to || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'To date must be in YYYY-MM-DD format',
      });
    }
    
    const worklogs = await Worklog.find({
      userId: req.mongoUser._id,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1, fromTime: 1 });
    
    res.status(200).json({
      success: true,
      data: { worklogs },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee profile
// @route   PUT /api/attendance/profile
// @access  Private (Employee)
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, homeAddress, aadharNumber, panNumber, bloodGroup, emergencyContact, profilePicture, newPassword } = req.body;
    
    // Update fields
    if (fullName) req.mongoUser.fullName = fullName;
    if (phoneNumber) req.mongoUser.phoneNumber = phoneNumber;
    if (homeAddress) req.mongoUser.homeAddress = homeAddress;
    if (aadharNumber) req.mongoUser.aadharNumber = aadharNumber;
    if (panNumber) req.mongoUser.panNumber = panNumber;
    if (bloodGroup) req.mongoUser.bloodGroup = bloodGroup;
    if (emergencyContact) req.mongoUser.emergencyContact = emergencyContact;
    if (profilePicture) req.mongoUser.profilePicture = profilePicture;
    if (newPassword) req.mongoUser.passwordHash = newPassword;
    
    const updatedUser = await req.mongoUser.save();
    
    try {
      if (updatedUser.email) {
        if (newPassword) {
          const salt = await bcrypt.genSalt(10);
          const mysqlPasswordHash = await bcrypt.hash(newPassword, salt);
          await db.query(
            "UPDATE users SET name = ?, phone = ?, home_address = ?, aadhar_number = ?, pan_number = ?, blood_group = ?, emergency_contact = ?, profile_picture = ?, password_hash = ? WHERE email = ?",
            [
              updatedUser.fullName,
              updatedUser.phoneNumber || null,
              updatedUser.homeAddress || null,
              updatedUser.aadharNumber || null,
              updatedUser.panNumber || null,
              updatedUser.bloodGroup || null,
              updatedUser.emergencyContact || null,
              updatedUser.profilePicture || null,
              mysqlPasswordHash,
              updatedUser.email
            ]
          );
        } else {
          await db.query(
            "UPDATE users SET name = ?, phone = ?, home_address = ?, aadhar_number = ?, pan_number = ?, blood_group = ?, emergency_contact = ?, profile_picture = ? WHERE email = ?",
            [
              updatedUser.fullName, 
              updatedUser.phoneNumber || null, 
              updatedUser.homeAddress || null,
              updatedUser.aadharNumber || null,
              updatedUser.panNumber || null,
              updatedUser.bloodGroup || null,
              updatedUser.emergencyContact || null,
              updatedUser.profilePicture || null,
              updatedUser.email
            ]
          );
        }
      }
    } catch (mysqlError) {
      console.error('MySQL Sync Error:', mysqlError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { 
        user: {
             id: updatedUser._id,
             fullName: updatedUser.fullName,
             email: updatedUser.email,
             role: updatedUser.role,
             employeeId: updatedUser.employeeId,
             phoneNumber: updatedUser.phoneNumber,
             profilePicture: updatedUser.profilePicture,
             homeAddress: updatedUser.homeAddress,
             aadharNumber: updatedUser.aadharNumber,
             panNumber: updatedUser.panNumber,
             bloodGroup: updatedUser.bloodGroup,
             emergencyContact: updatedUser.emergencyContact
        }
      },
    });
  } catch (error) {
    next(error);
  }
};
