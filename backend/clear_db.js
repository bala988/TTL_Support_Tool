import { db } from "./config/db.js";

async function clearDatabase() {
  try {
    console.log("Starting database cleanup...");

    const connection = await db.getConnection();
    
    try {
      // 1. Disable Foreign Key Checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // 2. Get all tables
      const [tables] = await connection.query("SHOW TABLES");
      
      if (tables.length === 0) {
        console.log("No tables found.");
        return;
      }

      const dbName = process.env.DB_NAME || "ttl_support_tool";
      const keyName = `Tables_in_${dbName}`;

      // 3. Truncate tables except 'users'
      for (const row of tables) {
        // Try to get table name from the row object (key might vary depending on mysql version/driver but usually Tables_in_dbname)
        const tableName = Object.values(row)[0]; 

        if (tableName === 'users') {
          console.log(`Skipping table: ${tableName}`);
          continue;
        }

        console.log(`Truncating table: ${tableName}`);
        await connection.query(`TRUNCATE TABLE ${tableName}`);
      }

      // 4. Re-enable Foreign Key Checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("Database cleanup completed successfully!");

    } catch (err) {
      console.error("Error during cleanup:", err);
    } finally {
      connection.release();
      process.exit();
    }

  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

clearDatabase();
