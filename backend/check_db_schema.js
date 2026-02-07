import dotenv from "dotenv";
import path from "path";

// Load env vars from .env in current directory (backend)
dotenv.config();

// Now import db
// Note: We need to use dynamic import because static imports are hoisted
const { db } = await import("./config/db.js");

async function checkSchema() {
  try {
    const [columns] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ttl_support_tool' 
      AND TABLE_NAME = 'tickets'
      ORDER BY COLUMN_NAME;
    `);
    
    console.log("Schema Information for tickets (with Nullable):");
    console.log(JSON.stringify(columns, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

checkSchema();
