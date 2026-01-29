
import { db } from "../config/db.js";

const updateSchema = async () => {
  try {
    console.log("Updating schema...");

    // Add missing columns to sales_stage_2
    const stage2Columns = [
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS tqd_presentation_yn ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS tqd_presentation_upload VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS oem_presentation_yn ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS oem_presentation_upload VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS flp_yn ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS flp_upload VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS tech_solution_mapping ENUM('Yes', 'No') DEFAULT 'No'", // Verify if missing
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS collect_use_cases ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS align_oem VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS oem_account_manager VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS oem_contact_email VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS handoff_presales ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS cust_req_discovery TEXT",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS tech_success_doc ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS poc_use_case_doc VARCHAR(255)",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS use_case_signoff ENUM('Yes', 'No') DEFAULT 'No'",
      "ALTER TABLE sales_stage_2 ADD COLUMN IF NOT EXISTS oem_approval ENUM('Yes', 'No') DEFAULT 'No'"
    ];

    for (const query of stage2Columns) {
       try {
         await db.query(query);
         console.log("Executed:", query);
       } catch (e) {
         console.error("Failed:", query, e.message);
       }
    }

    console.log("Schema update complete.");
    process.exit(0);
  } catch (error) {
    console.error("Schema update failed:", error);
    process.exit(1);
  }
};

updateSchema();
