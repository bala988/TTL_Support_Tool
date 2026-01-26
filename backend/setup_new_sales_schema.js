
import { db } from "./config/db.js";

async function setupNewSalesSchema() {
    console.log("Starting full sales schema setup...");

    // 1. Update Main Table (sales_opportunities) - Ensure new header fields exist
    // We already did this, but re-running is safe with IF NOT EXISTS logic or catch blocks
    // Note: User didn't request new header fields in this specific prompt, but let's ensure base is solid.
    
    // 2. Create Stage Tables with EXACT User Fields
    // Strategy: DROP tables first to ensure clean slate for new columns, 
    // as ALTERing many columns is error-prone and we are in dev/setup mode.
    // WARNING: This deletes existing stage data. 
    
    const stages = [
        `DROP TABLE IF EXISTS sales_stage_1`,
        `DROP TABLE IF EXISTS sales_stage_2`,
        `DROP TABLE IF EXISTS sales_stage_3`,
        `DROP TABLE IF EXISTS sales_stage_4`,
        `DROP TABLE IF EXISTS sales_stage_5`,
        `DROP TABLE IF EXISTS sales_stage_6`,
        `DROP TABLE IF EXISTS sales_stage_7`,
    ];

    for (const dropQuery of stages) {
        await db.query(dropQuery);
    }
    console.log("Dropped existing stage tables for clean setup.");

    // Stage 1: Qualification & Discovery
    await db.query(`
        CREATE TABLE sales_stage_1 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            decision_maker_name VARCHAR(255),
            influencer_name VARCHAR(255),
            purchase_procurement VARCHAR(255),
            mapped_product VARCHAR(255),
            problem_statement TEXT,
            meeting_date_dm DATE,
            dm_name_meeting VARCHAR(255),
            rant_date DATE,
            qual_doc_upload VARCHAR(255),
            tech_qual_doc_ready VARCHAR(50),
            deal_map_org_chart VARCHAR(255),
            go_no_go VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_1");

    // Stage 2: Tech Presentation / Building Mindshare
    await db.query(`
        CREATE TABLE sales_stage_2 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            tech_solution_mapping VARCHAR(50),
            collect_use_cases VARCHAR(50),
            align_oem VARCHAR(100),
            oem_account_manager VARCHAR(255),
            oem_contact_email VARCHAR(255),
            top_presentation_doc VARCHAR(255),
            handoff_presales VARCHAR(50),
            cust_req_discovery TEXT,
            flp_upload VARCHAR(255),
            oem_presentation_upload VARCHAR(255),
            tech_success_doc VARCHAR(50),
            poc_use_case_doc VARCHAR(255),
            use_case_signoff VARCHAR(50),
            oem_approval VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_2");

    // Stage 3: POC / POV + Tech Solution + BOQ
    await db.query(`
        CREATE TABLE sales_stage_3 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            poc_detailed_doc_yn VARCHAR(50),
            poc_detailed_doc_upload VARCHAR(255),
            tech_solution_final_upload VARCHAR(255),
            boq_approval_upload VARCHAR(255),
            handoff_tech VARCHAR(50),
            detailed_poc_cases_upload VARCHAR(255),
            integrations_upload VARCHAR(255),
            poc_kickoff_date DATE,
            poc_completion_date DATE,
            poc_use_case_doc_final VARCHAR(255),
            solution_doc_upload VARCHAR(255),
            boq_version_upload VARCHAR(255),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_3");

    // Stage 4: Commercial Proposal / Negotiation / PO
    await db.query(`
        CREATE TABLE sales_stage_4 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            commercial_closure VARCHAR(50),
            technical_sow_closure VARCHAR(50),
            final_po_upload VARCHAR(255),
            cust_req_doc_review_upload VARCHAR(255),
            budgetary_quote_upload VARCHAR(255),
            negotiated_quote_upload VARCHAR(255),
            distributor_discount_yn VARCHAR(50),
            distributor_margin_percent VARCHAR(50),
            final_po_payment_terms_yn VARCHAR(50),
            distributor_approved_quote_upload VARCHAR(255),
            customer_po_upload VARCHAR(255),
            internal_finance_approval VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_4");

    // Stage 5: Ordering / Product Delivery
    await db.query(`
        CREATE TABLE sales_stage_5 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            b2b_ordering VARCHAR(50),
            product_delivery_type VARCHAR(50),
            license_delivery_type VARCHAR(50),
            verify_margins_yn VARCHAR(50),
            cross_verify_boq_yn VARCHAR(50),
            payment_terms_negotiation VARCHAR(50),
            order_placement_date DATE,
            weekly_delivery_updates VARCHAR(50),
            product_license_delivery_yn VARCHAR(50),
            delivery_confirmation_yn VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_5");

    // Stage 6: Implementation & Sign-Off
    await db.query(`
        CREATE TABLE sales_stage_6 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            project_plan_tracker_upload VARCHAR(255),
            project_completion_cert_upload VARCHAR(255),
            uat_signoff VARCHAR(50),
            project_plan_tech_align VARCHAR(50),
            milestones_tracking_yn VARCHAR(50),
            milestones_timeline TEXT,
            tech_implementation_uat_upload VARCHAR(255),
            admin_training VARCHAR(50),
            handover_signoff_doc VARCHAR(255),
            uat_completion_doc_yn VARCHAR(50),
            project_signoff VARCHAR(50),
            closure_mail_yn VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_6");

    // Stage 7: Invoice & Payment Collection
    await db.query(`
        CREATE TABLE sales_stage_7 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            opportunity_id INT NOT NULL,
            invoice_submission_upload VARCHAR(255),
            payment_success VARCHAR(50),
            finance_confirmation VARCHAR(50),
            submit_project_doc_finance VARCHAR(50),
            project_signoff_approval VARCHAR(50),
            invoice_submission_followup DATE,
            payment_confirmation_finance VARCHAR(50),
            thanks_mail_closure VARCHAR(50),
            recognition_internal_mail VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (opportunity_id) REFERENCES sales_opportunities(id) ON DELETE CASCADE
        )
    `);
    console.log("Created sales_stage_7");

    console.log("Sales schema setup complete.");
    process.exit(0);
}

setupNewSalesSchema().catch(err => {
    console.error("Setup failed:", err);
    process.exit(1);
});
