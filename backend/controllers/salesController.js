
import { db } from "../config/db.js";
import fs from "fs";
import path from "path";

// Helper to ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const createOpportunity = async (req, res) => {
  try {
    const {
      opportunity_name, customer_name, customer_address, customer_contact_person, customer_email,
      ttl_sales_name, ttl_contact_number, ttl_email, technical_owner,
      product, oem, oem_contact, oem_details, distributor_name, distributor_contact, distributor_contact_person, distributor_email,
      created_by,
      // Initial stage data might be passed (e.g. stage1 info)
      stage_data
    } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insert Header Info
      const [result] = await connection.query(
        `INSERT INTO sales_opportunities (
          opportunity_name, customer_name, customer_address, customer_contact_person, customer_email,
          ttl_sales_name, ttl_contact_number, ttl_email, technical_owner,
          product, oem, oem_contact, oem_details, distributor_name, distributor_contact, distributor_contact_person, distributor_email,
          current_stage, stage_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'In Progress', ?)`,
        [
          opportunity_name, customer_name, customer_address, customer_contact_person, customer_email,
          ttl_sales_name, ttl_contact_number, ttl_email, technical_owner,
          product, oem, oem_contact, oem_details, distributor_name, distributor_contact, distributor_contact_person, distributor_email,
          created_by
        ]
      );

      const opportunityId = result.insertId;

      // 2. Initialize Stage 1 (and potentially others, but mainly Stage 1)
      const stage1Data = stage_data?.stage1 || {};
      
      // Note: Updated columns for Stage 1
      await connection.query(
        `INSERT INTO sales_stage_1 (
          opportunity_id, decision_maker_name, influencer_name, purchase_procurement, 
          mapped_product, problem_statement, meeting_date_dm, dm_name_meeting, rant_date,
          qual_doc_upload, tech_qual_doc_ready, deal_map_org_chart, go_no_go
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          opportunityId,
          stage1Data.decision_maker_name || '',
          stage1Data.influencer_name || '',
          stage1Data.purchase_procurement || '',
          stage1Data.mapped_product || '',
          stage1Data.problem_statement || '',
          stage1Data.meeting_date_dm || null,
          stage1Data.dm_name_meeting || '',
          stage1Data.rant_date || null,
          stage1Data.qual_doc_upload || '',
          stage1Data.tech_qual_doc_ready || 'No',
          stage1Data.deal_map_org_chart || '',
          stage1Data.go_no_go || ''
        ]
      );

      // Initialize other stages as empty rows linked to this ID
      await connection.query("INSERT INTO sales_stage_2 (opportunity_id) VALUES (?)", [opportunityId]);
      await connection.query("INSERT INTO sales_stage_3 (opportunity_id) VALUES (?)", [opportunityId]);
      await connection.query("INSERT INTO sales_stage_4 (opportunity_id) VALUES (?)", [opportunityId]);
      await connection.query("INSERT INTO sales_stage_5 (opportunity_id) VALUES (?)", [opportunityId]);
      await connection.query("INSERT INTO sales_stage_6 (opportunity_id) VALUES (?)", [opportunityId]);
      await connection.query("INSERT INTO sales_stage_7 (opportunity_id) VALUES (?)", [opportunityId]);

      await connection.commit();

      res.status(201).json({
        status: "success",
        message: "Opportunity created successfully",
        opportunityId: opportunityId
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Create opportunity error:", error);
    res.status(500).json({ message: "Server error creating opportunity" });
  }
};

export const getOpportunities = async (req, res) => {
  try {
    const [opportunities] = await db.query(`
      SELECT s.*, s4.commercial_closure 
      FROM sales_opportunities s
      LEFT JOIN sales_stage_4 s4 ON s.id = s4.opportunity_id
      ORDER BY s.created_at DESC
    `);
    res.json(opportunities);
  } catch (error) {
    console.error("Get opportunities error:", error);
    res.status(500).json({ message: "Server error fetching opportunities" });
  }
};

export const getOpportunityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch Header
    const [opportunities] = await db.query("SELECT * FROM sales_opportunities WHERE id = ?", [id]);
    if (opportunities.length === 0) {
      return res.status(404).json({ message: "Opportunity not found" });
    }
    const opportunity = opportunities[0];

    // 2. Fetch Stage Data
    const [stage1] = await db.query("SELECT * FROM sales_stage_1 WHERE opportunity_id = ?", [id]);
    const [stage2] = await db.query("SELECT * FROM sales_stage_2 WHERE opportunity_id = ?", [id]);
    const [stage3] = await db.query("SELECT * FROM sales_stage_3 WHERE opportunity_id = ?", [id]);
    const [stage4] = await db.query("SELECT * FROM sales_stage_4 WHERE opportunity_id = ?", [id]);
    const [stage5] = await db.query("SELECT * FROM sales_stage_5 WHERE opportunity_id = ?", [id]);
    const [stage6] = await db.query("SELECT * FROM sales_stage_6 WHERE opportunity_id = ?", [id]);
    const [stage7] = await db.query("SELECT * FROM sales_stage_7 WHERE opportunity_id = ?", [id]);

    // 3. Reconstruct 'stage_data' object for frontend compatibility
    opportunity.stage_data = {
      stage1: stage1[0] || {},
      stage2: stage2[0] || {},
      stage3: stage3[0] || {},
      stage4: stage4[0] || {},
      stage5: stage5[0] || {},
      stage6: stage6[0] || {},
      stage7: stage7[0] || {}
    };

    res.json(opportunity);
  } catch (error) {
    console.error("Get opportunity error:", error);
    res.status(500).json({ message: "Server error fetching opportunity" });
  }
};

export const updateOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      current_stage, stage_status, stage_data,
      // Header fields
      opportunity_name, customer_name, customer_address, customer_contact_person, customer_email,
      ttl_sales_name, ttl_contact_number, ttl_email, technical_owner,
      product, oem, oem_contact, oem_details, distributor_name, distributor_contact, distributor_contact_person, distributor_email
    } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Update Header Info
      let updates = [];
      let params = [];
      
      const headerFields = {
        opportunity_name, customer_name, customer_address, customer_contact_person, customer_email,
        ttl_sales_name, ttl_contact_number, ttl_email, technical_owner,
        product, oem, oem_contact, oem_details, distributor_name, distributor_contact, distributor_contact_person, distributor_email,
        current_stage, stage_status
      };

      for (const [key, value] of Object.entries(headerFields)) {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (updates.length > 0) {
        params.push(id);
        await connection.query(`UPDATE sales_opportunities SET ${updates.join(", ")} WHERE id = ?`, params);
      }

      // 2. Update Stage Tables (if stage_data is provided)
      if (stage_data) {
        
        const updateStageTable = async (table, stageNum, allowedFields) => {
          if (stage_data[`stage${stageNum}`]) {
            const sData = stage_data[`stage${stageNum}`];
            const sUpdates = [];
            const sParams = [];
            
            for (const key of allowedFields) {
              if (sData[key] !== undefined) {
                sUpdates.push(`${key} = ?`);
                sParams.push(sData[key]);
              }
            }
            
            if (sUpdates.length > 0) {
              sParams.push(id);
              await connection.query(`UPDATE ${table} SET ${sUpdates.join(", ")} WHERE opportunity_id = ?`, sParams);
            }
          }
        };

        // Allowed fields per stage based on updated schema
        const stage1Fields = [
          'decision_maker_name', 'influencer_name', 'purchase_procurement', 'mapped_product', 
          'problem_statement', 'meeting_date_dm', 'dm_name_meeting', 'rant_date', 
          'qual_doc_upload', 'tech_qual_doc_ready', 'deal_map_org_chart', 'go_no_go'
        ];
        await updateStageTable('sales_stage_1', 1, stage1Fields);

        const stage2Fields = [
          'tech_solution_mapping', 'collect_use_cases', 'align_oem', 'oem_account_manager', 
          'oem_contact_email', 'tqd_presentation_yn', 'tqd_presentation_upload', 'handoff_presales', 
          'cust_req_discovery', 'flp_yn', 'flp_upload', 'oem_presentation_yn', 'oem_presentation_upload', 
          'tech_success_doc', 'poc_use_case_doc', 'use_case_signoff', 'oem_approval'
        ];
        await updateStageTable('sales_stage_2', 2, stage2Fields);

        const stage3Fields = [
          'poc_detailed_doc_yn', 'poc_detailed_doc_upload', 'tech_solution_final_yn', 'tech_solution_final_upload', 
          'boq_approval_yn', 'boq_approval_upload', 'handoff_tech', 'detailed_poc_cases_upload', 
          'integration_solution_yn', 'integrations_upload', 'poc_kickoff_date', 'poc_completion_date', 
          'poc_use_case_doc_final', 'solution_doc_upload', 'boq_version_yn', 'boq_version_number', 'boq_version_upload'
        ];
        await updateStageTable('sales_stage_3', 3, stage3Fields);

        const stage4Fields = [
          'commercial_closure', 'technical_sow_closure', 'final_po_upload', 'cust_req_doc_review_upload',
          'budgetary_quote_upload', 'negotiated_quote_upload', 'distributor_discount_yn', 'distributor_margin_percent',
          'final_po_payment_terms_yn', 'distributor_approved_quote_upload', 'customer_po_upload', 'internal_finance_approval'
        ];
        await updateStageTable('sales_stage_4', 4, stage4Fields);

        const stage5Fields = [
          'b2b_ordering', 'product_delivery_type', 'license_delivery_type', 'verify_margins_yn',
          'cross_verify_boq_yn', 'payment_terms_negotiation', 'order_placement_date', 'weekly_delivery_updates',
          'product_license_delivery_yn', 'delivery_confirmation_yn'
        ];
        await updateStageTable('sales_stage_5', 5, stage5Fields);

        const stage6Fields = [
          'project_plan_tracker_upload', 'project_completion_cert_upload', 'uat_signoff', 'project_plan_tech_align',
          'milestones_tracking_yn', 'milestones_timeline', 'tech_implementation_uat_upload', 'admin_training',
          'handover_signoff_doc', 'uat_completion_doc_yn', 'project_signoff', 'closure_mail_yn'
        ];
        await updateStageTable('sales_stage_6', 6, stage6Fields);

        const stage7Fields = [
          'invoice_submission_yn', 'invoice_submission_upload', 'payment_success', 'finance_confirmation', 
          'submit_project_doc_finance', 'project_signoff_approval', 'invoice_submission_followup', 
          'payment_confirmation_finance', 'thanks_mail_closure', 'recognition_internal_mail'
        ];
        await updateStageTable('sales_stage_7', 7, stage7Fields);
      }

      await connection.commit();
      res.json({ message: "Opportunity updated successfully" });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Update opportunity error:", error);
    res.status(500).json({ message: "Server error updating opportunity" });
  }
};

export const uploadSalesDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType, customName } = req.body; 

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const targetDir = `uploads/sales/${id}`;
    ensureDir(targetDir);

    let finalFileName = req.file.originalname;
    if (customName) {
      const ext = path.extname(req.file.originalname);
      finalFileName = `${customName}${ext}`;
    }

    const targetPath = path.join(targetDir, finalFileName);
    fs.renameSync(req.file.path, targetPath);

    res.json({
      message: "File uploaded successfully",
      filePath: targetPath,
      fileName: finalFileName
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error uploading file" });
  }
};
