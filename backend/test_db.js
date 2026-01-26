import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'ttl'
};

async function checkDb() {
    try {
        console.log("Connecting to DB...");
        const conn = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        const [rows] = await conn.query("DESCRIBE users");
        console.log("Users table schema:");
        console.table(rows);

        await conn.end();
    } catch (error) {
        console.error("DB Error:", error);
    }
}

checkDb();
