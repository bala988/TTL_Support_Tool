import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: 'ttl'
};

async function addRoughNotesColumn() {
    let conn;
    try {
        console.log("Connecting to database...");
        conn = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        console.log("Checking if rough_notes column exists in tickets table...");
        const [columns] = await conn.query("SHOW COLUMNS FROM tickets LIKE 'rough_notes'");

        if (columns.length === 0) {
            console.log("Adding rough_notes column...");
            await conn.query("ALTER TABLE tickets ADD COLUMN rough_notes TEXT");
            console.log("rough_notes column added successfully.");
        } else {
            console.log("rough_notes column already exists.");
        }

    } catch (error) {
        console.error("Error adding column:", error);
    } finally {
        if (conn) await conn.end();
    }
}

addRoughNotesColumn();
