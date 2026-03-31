import { db } from "./config/db.js";
import fs from "fs";

async function verifyTables() {
  try {
    const [rows] = await db.query('SHOW TABLES');
    const tables = rows.map(r => Object.values(r)[0]);
    fs.writeFileSync('tables_found.txt', tables.join('\n'));
    console.log(`✅ Found ${tables.length} tables. Saved to tables_found.txt`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying tables:", error);
    process.exit(1);
  }
}

verifyTables();
