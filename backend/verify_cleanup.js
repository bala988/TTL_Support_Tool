import { db } from "./config/db.js";

async function verifyCleanup() {
  try {
    const connection = await db.getConnection();
    
    try {
      const [users] = await connection.query("SELECT COUNT(*) as count FROM users");
      const [opportunities] = await connection.query("SELECT COUNT(*) as count FROM sales_opportunities");
      const [tickets] = await connection.query("SELECT COUNT(*) as count FROM tickets");

      console.log(`Users count: ${users[0].count}`);
      console.log(`Opportunities count: ${opportunities[0].count}`);
      console.log(`Tickets count: ${tickets[0].count}`);

    } finally {
      connection.release();
      process.exit();
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

verifyCleanup();