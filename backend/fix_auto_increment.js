
import { db } from './config/db.js';

async function fixAutoIncrement() {
    try {
        console.log("Starting DB Fix...");
        const connection = await db.getConnection();

        // 1. Fix expense_claims
        console.log("Checking expense_claims...");
        const [claims0] = await connection.query("SELECT * FROM expense_claims WHERE id = 0");
        if (claims0.length > 0) {
            console.log("Found claim with ID 0. Updating...");
            // Find a safe ID (max + 1)
            const [maxIdResult] = await connection.query("SELECT MAX(id) as maxId FROM expense_claims");
            const newId = (maxIdResult[0].maxId || 0) + 1;
            
            // Update items first to point to new ID
            await connection.query("UPDATE expense_items SET claim_id = ? WHERE claim_id = 0", [newId]);
            // Update claim
            await connection.query("UPDATE expense_claims SET id = ? WHERE id = 0", [newId]);
            console.log(`Moved ID 0 to ${newId}.`);
        }

        console.log("Applying AUTO_INCREMENT to expense_claims...");
        await connection.query("ALTER TABLE expense_claims MODIFY COLUMN id INT AUTO_INCREMENT");
        console.log("Success: expense_claims id is now AUTO_INCREMENT.");


        // 2. Fix expense_items
        console.log("Checking expense_items...");
        const [items0] = await connection.query("SELECT * FROM expense_items WHERE id = 0");
        if (items0.length > 0) {
            console.log("Found item with ID 0. Updating...");
            const [maxItemIdResult] = await connection.query("SELECT MAX(id) as maxId FROM expense_items");
            const newItemId = (maxItemIdResult[0].maxId || 0) + 1;
            await connection.query("UPDATE expense_items SET id = ? WHERE id = 0", [newItemId]);
            console.log(`Moved Item ID 0 to ${newItemId}.`);
        }

        console.log("Applying AUTO_INCREMENT to expense_items...");
        await connection.query("ALTER TABLE expense_items MODIFY COLUMN id INT AUTO_INCREMENT");
        console.log("Success: expense_items id is now AUTO_INCREMENT.");

        connection.release();
        console.log("All fixes applied successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Error applying fix:", error);
        console.error("SQL Message:", error.sqlMessage);
        process.exit(1);
    }
}

fixAutoIncrement();
