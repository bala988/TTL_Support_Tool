import { db } from "../config/db.js";

// Initialize table (ensure it exists)
const initTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_approvals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        opportunity_id INT NOT NULL,
        requester_id INT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_request (opportunity_id)
      )
    `);
    


    // Comprehensive Schema Patch for Stages 2-7
    const schemaUpdates = [
      // Stage 2
      { table: 'sales_stage_2', cols: [
         "ADD COLUMN IF NOT EXISTS tqd_presentation_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS tqd_presentation_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS oem_presentation_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS oem_presentation_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS flp_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS flp_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS handoff_presales ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS cust_req_discovery TEXT",
         "ADD COLUMN IF NOT EXISTS tech_solution_mapping ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS collect_use_cases ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS align_oem VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS oem_account_manager VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS oem_contact_email VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS tech_success_doc ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS poc_use_case_doc VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS use_case_signoff ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS oem_approval ENUM('Yes', 'No') DEFAULT 'No'"
      ]},
      // Stage 3
      { table: 'sales_stage_3', cols: [
         "ADD COLUMN IF NOT EXISTS poc_detailed_doc_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS poc_detailed_doc_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS tech_solution_final_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS tech_solution_final_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS boq_approval_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS boq_approval_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS handoff_tech ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS detailed_poc_cases_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS integration_solution_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS integrations_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS poc_kickoff_date DATE",
         "ADD COLUMN IF NOT EXISTS poc_completion_date DATE",
         "ADD COLUMN IF NOT EXISTS poc_use_case_doc_final VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS solution_doc_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS boq_version_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS boq_version_number VARCHAR(50)",
         "ADD COLUMN IF NOT EXISTS boq_version_upload VARCHAR(255)"
      ]},
      // Stage 4
      { table: 'sales_stage_4', cols: [
         "ADD COLUMN IF NOT EXISTS commercial_closure ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS technical_sow_closure ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS final_po_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS cust_req_doc_review_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS budgetary_quote_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS negotiated_quote_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS distributor_discount_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS distributor_margin_percent VARCHAR(50)",
         "ADD COLUMN IF NOT EXISTS final_po_payment_terms_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS distributor_approved_quote_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS customer_po_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS internal_finance_approval ENUM('Yes', 'No') DEFAULT 'No'"
      ]},
      // Stage 5
      { table: 'sales_stage_5', cols: [
         "ADD COLUMN IF NOT EXISTS b2b_ordering ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS product_delivery_type ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS license_delivery_type VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS verify_margins_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS cross_verify_boq_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS payment_terms_negotiation ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS order_placement_date DATE",
         "ADD COLUMN IF NOT EXISTS weekly_delivery_updates VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS product_license_delivery_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS delivery_confirmation_yn ENUM('Yes', 'No') DEFAULT 'No'"
      ]},
      // Stage 6
      { table: 'sales_stage_6', cols: [
         "ADD COLUMN IF NOT EXISTS project_plan_tracker_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS project_completion_cert_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS uat_signoff ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS project_plan_tech_align ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS milestones_tracking_yn ENUM('Yes', 'No') DEFAULT 'No'", 
         "ADD COLUMN IF NOT EXISTS milestones_timeline VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS tech_implementation_uat_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS admin_training ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS handover_signoff_doc VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS uat_completion_doc_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS project_signoff ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS closure_mail_yn ENUM('Yes', 'No') DEFAULT 'No'"
      ]},
      // Stage 7
      { table: 'sales_stage_7', cols: [
         "ADD COLUMN IF NOT EXISTS invoice_submission_yn ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS invoice_submission_upload VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS payment_success ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS finance_confirmation ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS submit_project_doc_finance ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS project_signoff_approval ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS invoice_submission_followup VARCHAR(255)",
         "ADD COLUMN IF NOT EXISTS payment_confirmation_finance ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS thanks_mail_closure ENUM('Yes', 'No') DEFAULT 'No'",
         "ADD COLUMN IF NOT EXISTS recognition_internal_mail ENUM('Yes', 'No') DEFAULT 'No'"
      ]}
    ];

    for (const update of schemaUpdates) {
       for (const colDef of update.cols) {
         try {
           await db.query(`ALTER TABLE ${update.table} ${colDef}`);
         } catch (e) {
           // Ignore errors if col exists
         }
       }
    }



    // console.log("Sales Approvals table checked/created");
  } catch (err) {
    console.error("Error creating sales_approvals table:", err);
  }
};

initTable();

export const requestSalesApproval = async (req, res) => {
  try {
    const { opportunityId, requesterId } = req.body;

    // Check if request already exists
    const [existing] = await db.query(
      "SELECT * FROM sales_approvals WHERE opportunity_id = ?",
      [opportunityId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'Approved') {
        return res.status(400).json({ message: "Access already granted" });
      }
      if (existing[0].status === 'Pending') {
        return res.status(400).json({ message: "Request already pending" });
      }
      // If Rejected, allow re-request (update status to Pending)
      await db.query(
        "UPDATE sales_approvals SET status = 'Pending' WHERE id = ?",
        [existing[0].id]
      );
      return res.json({ status: "success", message: "Approval re-requested" });
    }

    await db.query(
      "INSERT INTO sales_approvals (opportunity_id, requester_id, status) VALUES (?, ?, 'Pending')",
      [opportunityId, requesterId]
    );

    res.json({ status: "success", message: "Approval requested" });
  } catch (error) {
    console.error("Request sales approval error:", error);
    res.status(500).json({ message: "Server error requesting approval" });
  }
};

export const getSalesApprovals = async (req, res) => {
  try {
    const [approvals] = await db.query(`
      SELECT 
        sa.id, sa.status, sa.created_at,
        so.id as opportunity_id, so.opportunity_name, so.customer_name,
        u.name as requester_name, u.email as requester_email
      FROM sales_approvals sa
      JOIN sales_opportunities so ON sa.opportunity_id = so.id
      JOIN users u ON sa.requester_id = u.id
      ORDER BY sa.created_at DESC
    `);

    res.json(approvals);
  } catch (error) {
    console.error("Get sales approvals error:", error);
    res.status(500).json({ message: "Server error fetching approvals" });
  }
};

export const updateSalesApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    // Update approval status
    await db.query(
      "UPDATE sales_approvals SET status = ? WHERE id = ?",
      [status, id]
    );

    // If Approved, update the opportunity directly
    if (status === 'Approved') {
      // Fetch opportunity ID first to be safe or use a join update
      const [approval] = await db.query("SELECT opportunity_id FROM sales_approvals WHERE id = ?", [id]);
      
      if (approval.length > 0) {
        const oppId = approval[0].opportunity_id;
        
        // Update Go/No-Go in sales_stage_1 directly
        await db.query(
          "UPDATE sales_stage_1 SET go_no_go = 'Yes' WHERE opportunity_id = ?",
          [oppId]
        );
      }
    }

    res.json({ status: "success", message: `Request ${status}` });
  } catch (error) {
    console.error("Update sales approval error:", error);
    res.status(500).json({ message: "Server error updating approval" });
  }
};

export const getApprovalStatus = async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const [approval] = await db.query(
      "SELECT status FROM sales_approvals WHERE opportunity_id = ?",
      [opportunityId]
    );
    
    if (approval.length === 0) {
        return res.json({ status: null });
    }
    
    res.json({ status: approval[0].status });
  } catch (error) {
      console.error("Get approval status error:", error);
      res.status(500).json({ message: "Server error" });
  }
}
