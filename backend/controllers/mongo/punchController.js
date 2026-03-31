import PunchClock from '../../models/mongo/PunchClock.js';
import Attendance from '../../models/mongo/Attendance.js';

const getISTDate = (date = new Date()) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
};

const getISTDateString = (date = new Date()) => {
  return getISTDate(date).toISOString().split('T')[0];
};

// @desc    Punch In — also marks attendance for the day
// @route   POST /api/punch/in
// @access  Private
export const punchIn = async (req, res, next) => {
  try {
    const { workLocation } = req.body;
    if (!workLocation) {
      return res.status(400).json({ success: false, message: 'Work location is required' });
    }

    const today = getISTDateString();

    // Check if already punched in today
    const existing = await PunchClock.findOne({ userId: req.mongoUser._id, date: today });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already punched in today' });
    }

    // Create punch record
    const punch = await PunchClock.create({
      userId: req.mongoUser._id,
      date: today,
      punchIn: new Date(),
      workLocation,
    });

    // Auto-mark attendance for the day
    const existingAttendance = await Attendance.findOne({ userId: req.mongoUser._id, date: today });
    if (!existingAttendance) {
      await Attendance.create({
        userId: req.mongoUser._id,
        date: today,
        workLocation,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Punched in successfully',
      data: { punch },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already punched in today' });
    }
    next(error);
  }
};

// @desc    Punch Out
// @route   POST /api/punch/out
// @access  Private
export const punchOut = async (req, res, next) => {
  try {
    const today = getISTDateString();
    const punch = await PunchClock.findOne({ userId: req.mongoUser._id, date: today });

    if (!punch) {
      return res.status(400).json({ success: false, message: 'You haven\'t punched in today' });
    }

    if (punch.punchOut) {
      return res.status(400).json({ success: false, message: 'Already punched out today' });
    }

    const now = new Date();
    punch.punchOut = now;
    punch.totalMinutes = Math.round((now - punch.punchIn) / (1000 * 60));
    await punch.save();

    res.status(200).json({
      success: true,
      message: 'Punched out successfully',
      data: { punch },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's punch record
// @route   GET /api/punch/today
// @access  Private
export const getTodayPunch = async (req, res, next) => {
  try {
    const today = getISTDateString();
    const punch = await PunchClock.findOne({ userId: req.mongoUser._id, date: today });

    res.status(200).json({
      success: true,
      data: { punch },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly punch summary (Mon-Sun of current week)
// @route   GET /api/punch/weekly
// @access  Private
export const getWeeklySummary = async (req, res, next) => {
  try {
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    const istNow = getISTDate();
    
    // Get Monday of current week
    const dayOfWeek = istNow.getUTCDay(); // Using UTC methods since we've already added the offset
    const mondayOffset = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) - (weekOffset * 7);
    
    const monday = new Date(istNow);
    monday.setUTCDate(istNow.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);

    const weekData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Start range for query
    const mondayStr = monday.toISOString().split('T')[0];
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    const punches = await PunchClock.find({
      userId: req.mongoUser._id,
      date: { $gte: mondayStr, $lte: sundayStr },
    }).sort({ date: 1 });

    const now = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const punch = punches.find(p => p.date === dateStr);

        let hours = 0;
        if (punch) {
          if (punch.totalMinutes > 0) {
            hours = parseFloat((punch.totalMinutes / 60).toFixed(1));
          } else if (punch.punchIn && !punch.punchOut) {
            // Currently working — calculate live hours using original UTC 'now'
            const elapsed = (now - new Date(punch.punchIn)) / (1000 * 60 * 60);
            hours = parseFloat(Math.max(0, elapsed).toFixed(1));
          }
        }
        weekData.push({ day: days[i], date: dateStr, hours });
    }

    const totalHours = weekData.reduce((sum, d) => sum + d.hours, 0);

    res.status(200).json({
      success: true,
      data: {
        weekStart: mondayStr,
        weekEnd: sundayStr,
        days: weekData,
        totalHours: parseFloat(totalHours.toFixed(1)),
      },
    });
  } catch (error) {
    next(error);
  }
};

