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
    database: process.env.DB_NAME || 'ttl_support_tool' // Ensure we select the DB
};

console.log("DB Config Host:", dbConfig.host);
console.log("DB Config Port:", dbConfig.port);
console.log("DB Config User:", dbConfig.user);
console.log("DB Config DB:", dbConfig.database);

async function addColumns() {
    let conn;
    try {
        console.log("Connecting to MySQL server...");
        conn = await mysql.createConnection(dbConfig);
        console.log("Connected.");
        
        // Check version
        const [version] = await conn.query('SELECT VERSION() as version');
        console.log("MySQL Version:", version[0].version);

        const columns = [
            "profile_picture LONGTEXT",
            "home_address TEXT",
            "aadhar_number VARCHAR(50)",
            "pan_number VARCHAR(50)",
            "blood_group VARCHAR(10)",
            "emergency_contact VARCHAR(20)"
        ];

        // Check columns first to avoid error if they exist (manual check since IF NOT EXISTS is version dependent)
        const [existingCols] = await conn.query(`SHOW COLUMNS FROM users`);
        const existingColNames = existingCols.map(c => c.Field);

        for (const colDef of columns) {
            const colName = colDef.split(' ')[0];
            if (!existingColNames.includes(colName)) {
                 console.log(`Adding column: ${colName}`);
                 try {
                     await conn.query(`ALTER TABLE users ADD COLUMN ${colDef}`);
                 } catch (e) {
                     console.error(`Failed to add ${colName}:`, e.message);
                 }
            } else {
                console.log(`Column ${colName} already exists.`);
            }
        }

        console.log("Verifying final columns:");
        const [finalCols] = await conn.query("SHOW COLUMNS FROM users");
        finalCols.forEach(row => console.log(`- ${row.Field} (${row.Type})`));

    } catch (error) {
        console.error("Critical Error:", error);
    } finally {
        if (conn) await conn.end();
    }
}

addColumns();
