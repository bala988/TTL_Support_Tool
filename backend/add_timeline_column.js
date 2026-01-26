import { db } from './config/db.js';

async function addTimelineColumn() {
  try {
    // Check if column exists
    const [columns] = await db.query("SHOW COLUMNS FROM tickets LIKE 'timeline'");
    if (columns.length === 0) {
      console.log("Adding timeline column...");
      await db.query("ALTER TABLE tickets ADD COLUMN timeline JSON");
      console.log("Timeline column added.");
    } else {
      console.log("Timeline column already exists.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error altering table:", error);
    process.exit(1);
  }
}

addTimelineColumn();
