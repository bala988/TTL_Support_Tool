
import { db } from './config/db.js';

const checkStatus = async () => {
    try {
        const [rows] = await db.query("SELECT id, report_name, status FROM expense_claims");
        console.log("Current Claims Statuses:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkStatus();
