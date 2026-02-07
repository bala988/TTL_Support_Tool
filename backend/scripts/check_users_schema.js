import { db } from "../config/db.js";

async function checkUsersSchema() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM users");
    console.log("Users table columns:");
    console.table(columns);
    const [createStmt] = await db.query("SHOW CREATE TABLE users");
    console.log("\nCreate Table:");
    console.log(createStmt[0]['Create Table']);
    process.exit(0);
  } catch (error) {
    console.error("Error describing users table:", error);
    process.exit(1);
  }
}

checkUsersSchema();
