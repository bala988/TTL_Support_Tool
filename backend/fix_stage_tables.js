import { db } from './config/db.js';

async function fixStageTables() {
    try {
        const tables = [
            'sales_stage_1',
            'sales_stage_2',
            'sales_stage_3',
            'sales_stage_4',
            'sales_stage_5',
            'sales_stage_6',
            'sales_stage_7'
        ];

        const connection = await db.getConnection();

        for (const table of tables) {
            console.log(`Processing ${table}...`);

            // 1. Check if ID=0 exists and delete it to prevent conflict when enabling Auto Inc
            const [rows] = await connection.query(`SELECT count(*) as count FROM ${table} WHERE id = 0`);
            if (rows[0].count > 0) {
                console.log(`  Found ${rows[0].count} row(s) with id=0 in ${table}. Deleting to fix schema...`);
                await connection.query(`DELETE FROM ${table} WHERE id = 0`);
            }

            // 2. Modify ID to be AUTO_INCREMENT
            // We assume ID is already INT and PRIMARY KEY based on the error "key 'PRIMARY'"
            try {
                await connection.query(`ALTER TABLE ${table} MODIFY id INT(11) NOT NULL AUTO_INCREMENT`);
                console.log(`  ✅ Fixed: Enabled AUTO_INCREMENT on ${table}.id`);
            } catch (err) {
                console.error(`  ❌ Error updating ${table}:`, err.message);
            }
        }

        connection.release();
        console.log("All tables processed.");
        process.exit(0);

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

fixStageTables();
