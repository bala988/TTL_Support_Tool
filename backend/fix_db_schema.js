
import { db } from './config/db.js';

const fixSchema = async () => {
    try {
        console.log("Updating expense_claims status ENUM...");
        // Ensure Draft and Submitted are in the ENUM
        await db.query(`
            ALTER TABLE expense_claims 
            MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Draft', 'Submitted') DEFAULT 'Pending'
        `);
        console.log("Successfully updated expense_claims status ENUM.");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
};

fixSchema();
