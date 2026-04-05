import cron from 'node-cron';
import PunchClock from '../models/mongo/PunchClock.js';

/**
 * Midnight Punch Cleanup Service
 * 
 * Runs every day at 12:00 AM IST (00:00 IST = 18:30 UTC previous day).
 * Finds all punch records where the employee punched in but never punched out,
 * and marks them as "missed punch out" with 0 work hours.
 */

const getISTDateString = (date = new Date()) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset).toISOString().split('T')[0];
};

const closeAllOpenPunches = async () => {
  try {
    const today = getISTDateString();

    // Find all punch records that are still open (punched in but NOT today)
    // This catches any record from previous days that was never punched out
    const openPunches = await PunchClock.find({
      punchOut: null,
      missedPunchOut: { $ne: true },
      date: { $lt: today }, // Only close records from PREVIOUS days, not today
    });

    if (openPunches.length === 0) {
      console.log(`[Midnight Cleanup] No open punches to close.`);
      return;
    }

    console.log(`[Midnight Cleanup] Found ${openPunches.length} unclosed punch record(s). Closing them...`);

    for (const punch of openPunches) {
      punch.punchOut = null; // Keep punchOut as null to indicate "not punched out"
      punch.totalMinutes = 0; // 0 hours for the day
      punch.missedPunchOut = true; // Flag to indicate missed punch out
      await punch.save();
    }

    console.log(`[Midnight Cleanup] Successfully processed ${openPunches.length} missed punch-out record(s).`);
  } catch (error) {
    console.error('[Midnight Cleanup] Error closing open punches:', error);
  }
};

export const startMidnightCron = () => {
  // Run at 12:00 AM IST every day
  // With timezone set to Asia/Kolkata, '0 0 * * *' = midnight IST
  cron.schedule('0 0 * * *', async () => {
    console.log(`[Midnight Cleanup] Running midnight punch cleanup at ${new Date().toISOString()}`);
    await closeAllOpenPunches();
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[Midnight Cleanup] Cron job scheduled — will run at 12:00 AM IST daily.');

  // Also run immediately on server start to catch any missed ones from earlier
  closeAllOpenPunches();
};

export default startMidnightCron;
