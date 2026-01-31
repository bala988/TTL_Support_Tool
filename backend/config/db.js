import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
// comment
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "root",

  database: process.env.DB_NAME || "tutelar_tech_labs",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
