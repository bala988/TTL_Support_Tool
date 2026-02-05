import { db } from "../config/db.js";

const updateStatusEnum = async () => {
  try {
    console.log("Updating tickets table status ENUM to include 'Pending from Customer'...");
    
    await db.query(`
      ALTER TABLE tickets 
      MODIFY COLUMN status ENUM('Open', 'In Progress', 'Pending from Customer', 'Closed') 
      DEFAULT 'Open'
    `);
    
    console.log("Successfully updated status ENUM.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to update status ENUM:", error);
    process.exit(1);
  }
};

updateStatusEnum();
