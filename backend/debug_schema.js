
import { db } from './config/db.js';

async function checkSchema() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM expense_claims");
    console.log("Schema for expense_claims:");
    console.table(rows);
    
    const [createTable] = await db.query("SHOW CREATE TABLE expense_claims");
    console.log("\nCreate Table Statement:");
    console.log(createTable[0]['Create Table']);

    process.exit(0);
  } catch (error) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

checkSchema();
