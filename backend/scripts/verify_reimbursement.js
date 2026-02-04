import dotenv from "dotenv";
dotenv.config({ path: 'backend/.env' }); // Adjust path as the script is running from root or backend
import { db } from "../config/db.js";

const verify = async () => {
    try {
        console.log("Verifying Reimbursement Tables...");

        const [claimsTable] = await db.query("DESCRIBE expense_claims");
        console.log("✅ expense_claims table exists. Columns:", claimsTable.map(c => c.Field).join(", "));

        const [itemsTable] = await db.query("DESCRIBE expense_items");
        console.log("✅ expense_items table exists. Columns:", itemsTable.map(c => c.Field).join(", "));

        console.log("\nVerification Successful!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Verification Failed:", err.message);
        process.exit(1);
    }
};

verify();
