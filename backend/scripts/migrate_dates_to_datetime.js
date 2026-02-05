import { db } from "../config/db.js";

const migrate = async () => {
  try {
    console.log("Migrating tickets table open_date and close_date to DATETIME...");
    
    // Check if columns are already DATETIME
    const [columns] = await db.query("SHOW COLUMNS FROM tickets LIKE 'open_date'");
    if (columns[0].Type.toUpperCase().includes('DATETIME')) {
        console.log("open_date is already DATETIME.");
    } else {
        await db.query("ALTER TABLE tickets MODIFY open_date DATETIME NOT NULL");
        console.log("open_date converted to DATETIME.");
    }

    const [columnsClose] = await db.query("SHOW COLUMNS FROM tickets LIKE 'close_date'");
    if (columnsClose[0].Type.toUpperCase().includes('DATETIME')) {
        console.log("close_date is already DATETIME.");
    } else {
        await db.query("ALTER TABLE tickets MODIFY close_date DATETIME NULL");
        console.log("close_date converted to DATETIME.");
    }
    
    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
