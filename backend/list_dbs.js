import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "root"
});

async function listDbs() {
  try {
    const [rows] = await db.query("SHOW DATABASES");
    console.log(rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
listDbs();
