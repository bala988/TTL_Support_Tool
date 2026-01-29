import { db } from "./config/db.js";

const addPhoneColumn = async () => {
  try {
    await db.query(`
      ALTER TABLE users
      ADD COLUMN phone VARCHAR(20) AFTER email;
    `);
    console.log("Phone column added successfully to users table.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Phone column already exists.");
    } else {
      console.error("Error adding phone column:", error);
    }
  } finally {
    process.exit();
  }
};//testing

addPhoneColumn();
