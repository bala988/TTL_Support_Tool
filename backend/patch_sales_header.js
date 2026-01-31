
import { db } from "./config/db.js";

async function patchSalesHeader() {
    console.log("Starting sales header patch...");

    const alterQuery = "ALTER TABLE sales_opportunities ADD COLUMN IF NOT EXISTS distributor_contact_person VARCHAR(255)";

    try {
        await db.query(alterQuery);
        console.log(`Executed: ${alterQuery}`);
    } catch (err) {
        console.error(`Error executing ${alterQuery}:`, err.message);
    }

    console.log("Sales header patch complete.");
    process.exit(0);
}

patchSalesHeader();
