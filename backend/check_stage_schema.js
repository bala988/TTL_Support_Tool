import { db } from './config/db.js';

async function checkSchema() {
    try {
        const tables = ['sales_stage_1', 'sales_stage_2', 'sales_stage_3', 'sales_stage_4', 'sales_stage_5', 'sales_stage_6', 'sales_stage_7'];

        for (const table of tables) {
            const [rows] = await db.query(`DESCRIBE ${table}`);
            console.log(`\nSchema for ${table}:`);
            rows.forEach(row => {
                if (row.Field === 'id') {
                    console.log(`${row.Field}: Type=${row.Type}, Key=${row.Key}, Extra=${row.Extra}`);
                }
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
