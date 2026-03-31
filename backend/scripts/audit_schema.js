import { db } from "../config/db.js";

async function checkSchema() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log("Existing Tables:");
    console.log(JSON.stringify(tables, null, 2));

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [columns] = await db.query(`DESCRIBE ${tableName}`);
      console.log(`\nColumns in ${tableName}:`);
      console.log(JSON.stringify(columns, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

checkSchema();
