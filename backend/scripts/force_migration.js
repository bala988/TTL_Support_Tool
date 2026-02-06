import mysql from 'mysql2/promise';

const configs = [
    { user: 'root', password: '', database: 'ttl_support_tool', port: 3307 },
    { user: 'root', password: 'root', database: 'ttl_support_tool', port: 3307 },
    { user: 'root', password: '', database: 'ttl_support_tool', port: 3306 }, // Falback port
    { user: 'root', password: 'root', database: 'ttl_support_tool', port: 3306 }
];

async function migrate() {
    for (const config of configs) {
        console.log(`Trying config: User=${config.user}, Port=${config.port}, Pass=${config.password ? '****' : '(empty)'}`);
        let conn;
        try {
            conn = await mysql.createConnection(config);
            console.log("Connected successfully!");
            
            const columns = [
                "profile_picture LONGTEXT",
                "home_address TEXT",
                "aadhar_number VARCHAR(50)",
                "pan_number VARCHAR(50)",
                "blood_group VARCHAR(10)",
                "emergency_contact VARCHAR(20)"
            ];

            // Check columns
            const [existing] = await conn.query("SHOW COLUMNS FROM users");
            const existingNames = existing.map(c => c.Field);
            
            for (const colDef of columns) {
                const colName = colDef.split(' ')[0];
                if (!existingNames.includes(colName)) {
                    console.log(`Adding ${colName}...`);
                    try {
                        await conn.query(`ALTER TABLE users ADD COLUMN ${colDef}`);
                        console.log(`Added ${colName}`);
                    } catch (e) {
                         // Ignore if duplicate or error, just log
                         console.error(`Error adding ${colName}:`, e.message);
                    }
                } else {
                    console.log(`${colName} exists.`);
                }
            }
            
            console.log("Migration complete.");
            await conn.end();
            return; // Success, exit
            
        } catch (error) {
            console.log(`Connection failed for this config: ${error.message}`);
        }
    }
    console.error("All connection attempts failed.");
}

migrate();
