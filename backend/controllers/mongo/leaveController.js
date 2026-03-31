import Leave from '../../models/mongo/Leave.js';
import User from '../../models/mongo/User.js';

// @desc    Apply for leave
// @route   POST /api/leave/apply
// @access  Private
export const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'Leave type, from date, and to date are required' });
    }

    if (!['Planned', 'Sick'].includes(leaveType)) {
      return res.status(400).json({ success: false, message: 'Leave type must be Planned or Sick' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (to < from) {
      return res.status(400).json({ success: false, message: 'To date must be after from date' });
    }

    // Planned leave must be at least 14 days in advance
    if (leaveType === 'Planned') {
      const now = new Date();
      const minDate = new Date(now);
      minDate.setDate(minDate.getDate() + 14);
      minDate.setHours(0, 0, 0, 0);

      if (from < minDate) {
        return res.status(400).json({
          success: false,
          message: 'Planned leave must be applied at least 2 weeks (14 days) in advance',
        });
      }
    }

    // Calculate total days (inclusive)
    const diffTime = Math.abs(to - from);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      userId: req.mongoUser._id,
      leaveType,
      fromDate,
      toDate,
      totalDays,
      reason: reason || '',
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my leave applications
// @route   GET /api/leave/my
// @access  Private
export const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ userId: req.mongoUser._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { leaves },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave applications (Admin)
// @route   GET /api/admin/leaves
// @access  Admin
export const getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find()
      .populate('userId', 'fullName email employeeId profilePicture')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { leaves },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject leave (Admin)
// @route   PUT /api/admin/leave/:id/review
// @access  Admin
export const reviewLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This leave has already been reviewed' });
    }

    leave.status = status;
    leave.adminComment = adminComment || '';
    leave.reviewedBy = req.mongoUser._id;
    leave.reviewedAt = new Date();
    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      data: { leave },
    });
  } catch (error) {
    next(error);
  }
};
