import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: 'ttl' // Ensure we select the DB
};

async function checkColumns() {
    let conn;
    try {
        console.log("Connecting to MySQL server...");
        conn = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        const [rows] = await conn.query("SHOW COLUMNS FROM users");
        console.log("Columns in 'users' table:");
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));

    } catch (error) {
        console.error("Error checking columns:", error);
    } finally {
        if (conn) await conn.end();
    }
}

checkColumns();
