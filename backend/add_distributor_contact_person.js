import { db } from "./config/db.js";

async function run() {
  try {
    console.log("Adding distributor_contact_person column...");
    await db.query(`
      ALTER TABLE sales_opportunities 
      ADD COLUMN distributor_contact_person VARCHAR(255) DEFAULT NULL
    `);
    console.log("Column added successfully.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error adding column:", error);
    }
  } finally {
    process.exit();
  }
}

run();
