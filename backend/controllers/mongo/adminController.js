import User from '../../models/mongo/User.js';
import Attendance from '../../models/mongo/Attendance.js';
import Worklog from '../../models/mongo/Worklog.js';
import generateCSV from '../../utils/generateCSV.js';
// Google Drive service imported dynamically below to avoid crash if googleapis not installed

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private (Admin)
export const getAllEmployees = async (req, res, next) => {
  try {
    const { search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = { role: 'employee' };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    // Get employees
    const employees = await User.find(query).sort(sort);
    
    res.status(200).json({
      success: true,
      data: { 
        employees: employees.map(emp => ({
          id: emp._id,
          fullName: emp.fullName,
          employeeId: emp.employeeId,
          email: emp.email,
          phoneNumber: emp.phoneNumber,
          profilePicture: emp.profilePicture,
          joinedDate: emp.createdAt,
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee details
// @route   GET /api/admin/employees/:id
// @access  Private (Admin)
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      role: 'employee',
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          employeeId: employee.employeeId,
          email: employee.email,
          role: employee.role,
          phoneNumber: employee.phoneNumber,
          profilePicture: employee.profilePicture,
          joinedDate: employee.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee worklogs
// @route   GET /api/admin/employees/:id/worklogs?month=YYYY-MM
// @access  Private (Admin)
export const getEmployeeWorklogs = async (req, res, next) => {
  try {
    const { month } = req.query;
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be in YYYY-MM format',
      });
    }
    
    const worklogs = await Worklog.find({
      userId: req.params.id,
      date: { $regex: `^${month}` },
    }).sort({ date: 1, fromTime: 1 });
    
    res.status(200).json({
      success: true,
      data: { worklogs },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee attendance
// @route   GET /api/admin/employees/:id/attendance?month=YYYY-MM
// @access  Private (Admin)
export const getEmployeeAttendance = async (req, res, next) => {
  try {
    const { month } = req.query;
    
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be in YYYY-MM format',
      });
    }
    
    const attendance = await Attendance.find({
      userId: req.params.id,
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

// @desc    Export employee worklogs as CSV
// @route   GET /api/admin/employees/:id/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private (Admin)
export const exportEmployeeCSV = async (req, res, next) => {
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
    
    // Get employee
    const employee = await User.findOne({
      _id: req.params.id,
      role: 'employee',
    });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }
    
    // Get worklogs
    const worklogs = await Worklog.find({
      userId: req.params.id,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1, fromTime: 1 });
    
    if (worklogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'CSV File is Empty - No worklogs found for the specified date range',
      });
    }
    
    // Generate CSV
    const csv = generateCSV(worklogs);
    
    // Upload to Google Drive (asynchronous, don't wait for it)
    const filename = `${employee.employeeId}_worklogs_${from}_to_${to}.csv`;
    
    // Try to upload to Google Drive if available
    try {
      const { uploadCSVToDrive, isGoogleDriveConfigured } = await import('../../services/googleDriveService.js');
      
      if (isGoogleDriveConfigured()) {
        // Upload asynchronously without blocking the response
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID_CSV;
        uploadCSVToDrive(csv, filename, folderId)
          .then(result => {
            if (result.success) {
              console.log(`✅ CSV uploaded to Google Drive: ${filename}`);
              if (result.webViewLink) {
                console.log(`   View link: ${result.webViewLink}`);
              }
            } else {
              console.error(`❌ Failed to upload CSV to Google Drive: ${result.error}`);
            }
          })
          .catch(error => {
            console.error('❌ Google Drive upload error:', error.message);
          });
      } else {
        console.warn('⚠️ Google Drive not configured, skipping upload');
      }
    } catch (importError) {
      // Google Drive service not available (googleapis not installed)
      console.warn('⚠️ Google Drive service not available (run: npm install googleapis)');
    }
    
    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Export global attendance as CSV
// @route   GET /api/admin/attendance/export?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private (Admin)
export const exportGlobalAttendanceCSV = async (req, res, next) => {
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
    
    // 1. Get all employees
    const employees = await User.find({ role: 'employee' }).sort({ employeeId: 1 }).select('fullName employeeId email');
    
    // 2. Get all attendance records in range
    const attendanceRecords = await Attendance.find({
      date: { $gte: from, $lte: to }
    });
    
    // Create a map for quick lookup: "date_userId" -> status
    const attendanceMap = new Set();
    attendanceRecords.forEach(record => {
      attendanceMap.add(`${record.date}_${record.userId.toString()}`);
    });
    
    // 3. Generate dates in range
    const dates = [];
    const currentDate = new Date(from);
    const endDate = new Date(to);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 4. Build CSV Data
    // Header: Date | Employee ID | Full Name | Email | Status
    const csvRows = [];
    csvRows.push(['Date', 'Employee ID', 'Full Name', 'Email', 'Status'].join(','));
    
    dates.forEach(date => {
        employees.forEach(emp => {
            const hasAttendance = attendanceMap.has(`${date}_${emp._id.toString()}`);
            const status = hasAttendance ? 'Present' : 'Absent';
            
            // CSV Safe strings (handle commas)
            const safeName = `"${emp.fullName.replace(/"/g, '""')}"`;
            const safeEmail = `"${emp.email.replace(/"/g, '""')}"`;
            const safeId = `"${emp.employeeId.replace(/"/g, '""')}"`;
            
            csvRows.push([date, safeId, safeName, safeEmail, status].join(','));
        });
    });
    
    const csvContent = csvRows.join('\n');
    const filename = `attendance_report_${from}_to_${to}.csv`;
    
    // 5. Upload to Google Drive
    try {
        const { uploadCSVToDrive, isGoogleDriveConfigured } = await import('../../services/googleDriveService.js');
        if (isGoogleDriveConfigured()) {
            const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID_ATTENDANCE || process.env.GOOGLE_DRIVE_FOLDER_ID; // Use specific attendance folder
            
            uploadCSVToDrive(csvContent, filename, folderId)
                 .then(result => {
                    if (result.success) {
                        console.log(`✅ Global Attendance CSV uploaded: ${filename}`);
                    } else {
                        console.error(`❌ Global CSV Upload Failed: ${result.error}`);
                    }
                 })
                 .catch(err => console.error('❌ Async upload error:', err));
        }
    } catch (err) {
        console.warn('Google Drive service optional dependency issue:', err.message);
    }
    
    // 6. Send Response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
    
  } catch (error) {
    next(error);
  }
};
