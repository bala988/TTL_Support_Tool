import { db } from "./config/db.js";

const addTicketNumberColumn = async () => {
  try {
    await db.query(`
      ALTER TABLE tickets
      ADD COLUMN ticket_number VARCHAR(100) AFTER id;
    `);
    console.log("Successfully added ticket_number column to tickets table");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("ticket_number column already exists");
    } else {
      console.error("Error adding ticket_number column:", error);
    }
    process.exit(1);
  }
};

addTicketNumberColumn();
