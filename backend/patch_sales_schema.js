
import { db } from "./config/db.js";

async function patchSalesSchema() {
    console.log("Starting sales schema patch...");

    const alterQueries = [
        // Stage 4 Additions
        "ALTER TABLE sales_stage_4 ADD COLUMN IF NOT EXISTS budgetary_quote_yn VARCHAR(50)",
        "ALTER TABLE sales_stage_4 ADD COLUMN IF NOT EXISTS negotiated_quote_yn VARCHAR(50)",
        "ALTER TABLE sales_stage_4 ADD COLUMN IF NOT EXISTS customer_po_yn VARCHAR(50)",

        // Stage 6 Additions
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS project_plan_tracker_yn VARCHAR(50)",
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS project_completion_cert_yn VARCHAR(50)",
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS project_plan_tech_align_yn VARCHAR(50)",
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS tech_align_engineer_name VARCHAR(255)",
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS milestones_tracking_meet VARCHAR(50)",
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS tech_implementation_uat_yn VARCHAR(50)",
        "ALTER TABLE sales_stage_6 ADD COLUMN IF NOT EXISTS handover_signoff_yn VARCHAR(50)"
    ];

    for (const query of alterQueries) {
        try {
            await db.query(query);
            console.log(`Executed: ${query}`);
        } catch (err) {
            console.error(`Error executing ${query}:`, err.message);
        }
    }

    console.log("Sales schema patch complete.");
    process.exit(0);
}

patchSalesSchema();
