import { db } from "../config/db.js";

async function fixUsersId() {
  try {
    console.log("Fixing users.id to AUTO_INCREMENT PRIMARY KEY...");
    // Ensure id is AUTO_INCREMENT
    await db.query("ALTER TABLE users MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT");
    console.log("Updated users.id to INT NOT NULL AUTO_INCREMENT.");
    // Verify
    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'id'");
    console.table(columns);
    process.exit(0);
  } catch (error) {
    console.error("Failed to update users.id:", error);
    process.exit(1);
  }
}

fixUsersId();
