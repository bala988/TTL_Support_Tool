
import { db } from './config/db.js';

const fixData = async () => {
    try {
        console.log("Fixing invalid statuses...");

        // 1. Fix claims with empty status -> 'Draft' (safest assumption)
        const [result1] = await db.query(`UPDATE expense_claims SET status = 'Draft' WHERE status = '' OR status IS NULL`);
        console.log(`Updated ${result1.affectedRows} claims with empty/null status to 'Draft'.`);

        // 2. Fix 'submitted' (lowercase) -> 'Submitted'
        const [result2] = await db.query(`UPDATE expense_claims SET status = 'Submitted' WHERE status = 'submitted'`);
        console.log(`Updated ${result2.affectedRows} lowercase 'submitted' claims.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixData();
