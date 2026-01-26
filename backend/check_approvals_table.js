import { db } from './config/db.js';

async function checkTable() {
  try {
    const [rows] = await db.query("DESCRIBE approvals");
    console.log("Approvals Table Structure:");
    console.table(rows);
    process.exit(0);
  } catch (error) {
    console.error("Error describing table:", error);
    process.exit(1);
  }
}

checkTable();
