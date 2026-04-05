import Regularization from '../../models/mongo/Regularization.js';
import PunchClock from '../../models/mongo/PunchClock.js';

const getISTDateString = (date = new Date()) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset).toISOString().split('T')[0];
};

// @desc    Apply for attendance regularization
// @route   POST /api/regularization/apply
// @access  Private
export const applyRegularization = async (req, res, next) => {
  try {
    const { date, requestedPunchIn, requestedPunchOut, reason, workDescription } = req.body;

    if (!date || !requestedPunchIn || !requestedPunchOut || !reason || !workDescription) {
      return res.status(400).json({
        success: false,
        message: 'Date, punch-in time, punch-out time, reason, and work description are required',
      });
    }

    const today = getISTDateString();

    // Cannot regularize for today or future dates
    if (date >= today) {
      return res.status(400).json({
        success: false,
        message: 'You can only regularize for past dates',
      });
    }

    // Check if there's a PunchClock record for that date
    const punchRecord = await PunchClock.findOne({
      userId: req.mongoUser._id,
      date,
    });

    if (!punchRecord) {
      return res.status(400).json({
        success: false,
        message: 'No punch-in record found for this date. Regularization is only available for days you punched in but forgot to punch out.',
      });
    }

    // Only allow regularization for missed punch out days
    if (punchRecord.punchOut && !punchRecord.missedPunchOut) {
      return res.status(400).json({
        success: false,
        message: 'This day already has a valid punch-out record. No regularization needed.',
      });
    }

    // Check if there's already a pending regularization for this date
    const existing = await Regularization.findOne({
      userId: req.mongoUser._id,
      date,
      status: 'Pending',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending regularization request for this date',
      });
    }

    const regularization = await Regularization.create({
      userId: req.mongoUser._id,
      date,
      requestedPunchIn,
      requestedPunchOut,
      reason,
      workDescription,
    });

    res.status(201).json({
      success: true,
      message: 'Regularization request submitted successfully',
      data: { regularization },
    });
  } catch (error) {
    if (error.message === 'Punch out time must be after punch in time') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get my regularization requests
// @route   GET /api/regularization/my
// @access  Private
export const getMyRegularizations = async (req, res, next) => {
  try {
    const regularizations = await Regularization.find({ userId: req.mongoUser._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { regularizations },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all regularization requests (Admin)
// @route   GET /api/admin/regularizations
// @access  Admin
export const getAllRegularizations = async (req, res, next) => {
  try {
    const regularizations = await Regularization.find()
      .populate('userId', 'fullName email employeeId profilePicture')
      .populate('reviewedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { regularizations },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a regularization request (Admin)
// @route   PUT /api/admin/regularization/:id/review
// @access  Admin
export const reviewRegularization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected',
      });
    }

    const regularization = await Regularization.findById(id);
    if (!regularization) {
      return res.status(404).json({
        success: false,
        message: 'Regularization request not found',
      });
    }

    if (regularization.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed',
      });
    }

    // Update regularization record
    regularization.status = status;
    regularization.adminComment = adminComment || '';
    regularization.reviewedBy = req.mongoUser._id;
    regularization.reviewedAt = new Date();
    await regularization.save();

    // If approved, update the PunchClock record
    if (status === 'Approved') {
      const punchRecord = await PunchClock.findOne({
        userId: regularization.userId,
        date: regularization.date,
      });

      if (punchRecord) {
        // Build the punch-out datetime from the date + requested time
        const [outH, outM] = regularization.requestedPunchOut.split(':').map(Number);
        const punchOutDate = new Date(punchRecord.punchIn);
        punchOutDate.setHours(outH, outM, 0, 0);

        // If punchOut time is before punchIn (shouldn't happen, but safety)
        if (punchOutDate <= punchRecord.punchIn) {
          punchOutDate.setDate(punchOutDate.getDate() + 1);
        }

        punchRecord.punchOut = punchOutDate;
        punchRecord.totalMinutes = regularization.totalMinutes;
        punchRecord.missedPunchOut = false; // Clear the missed flag
        await punchRecord.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Regularization ${status.toLowerCase()} successfully`,
      data: { regularization },
    });
  } catch (error) {
    next(error);
  }
};
