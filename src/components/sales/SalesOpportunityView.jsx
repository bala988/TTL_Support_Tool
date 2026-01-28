
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import EngineerLayout from "../common/EngineerLayout";
import { Save, Upload, CheckCircle, AlertCircle, Lock, ChevronRight, Calendar, FileText } from "lucide-react";

export default function SalesOpportunityView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(1);
  const [maxStage, setMaxStage] = useState(1); // The highest unlocked stage
  
  // Header State
  const [header, setHeader] = useState({
    opportunity_name: '', customer_name: '', customer_address: '',
    customer_contact_person: '', customer_email: '',
    ttl_sales_name: '', ttl_contact_number: '', ttl_email: '',
    technical_owner: '', product: '', oem: '', oem_contact: '', oem_details: '',
    distributor_name: '', distributor_contact: '', distributor_email: ''
  });

  // Stage Data State (JSON structure)
  const [stageData, setStageData] = useState({
    stage1: {
      decision_maker_name: '', influencer_name: '', purchase_procurement: '',
      mapped_product: '', problem_statement: '', 
      meeting_date_dm: '', dm_name_meeting: '', rant_date: '',
      qual_doc_upload: '', tech_qual_doc_ready: 'No', deal_map_org_chart: '',
      go_no_go: 'No'
    },
    stage2: {
      tech_solution_mapping: 'No', collect_use_cases: 'No',
      align_oem: '', oem_account_manager: '', oem_contact_email: '',
      tqd_presentation_yn: 'No', tqd_presentation_upload: '',
      handoff_presales: 'No',
      cust_req_discovery: '', 
      flp_yn: 'No', flp_upload: '', 
      oem_presentation_yn: 'No', oem_presentation_upload: '',
      tech_success_doc: 'No', poc_use_case_doc: '', use_case_signoff: 'No',
      oem_approval: 'No'
    },
    stage3: {
      poc_detailed_doc_yn: 'No', poc_detailed_doc_upload: '',
      tech_solution_final_yn: 'No', tech_solution_final_upload: '',
      boq_approval_yn: 'No', boq_approval_upload: '',
      handoff_tech: 'No', detailed_poc_cases_upload: '', 
      integration_solution_yn: 'No', integrations_upload: '',
      poc_kickoff_date: '', poc_completion_date: '',
      poc_use_case_doc_final: '', solution_doc_upload: '', 
      boq_version_yn: 'No', boq_version_number: '', boq_version_upload: ''
    },
    stage4: {
      commercial_closure: 'No', technical_sow_closure: 'No',
      final_po_upload: '', cust_req_doc_review_upload: '',
      budgetary_quote_yn: 'No', budgetary_quote_upload: '',
      negotiated_quote_yn: 'No', negotiated_quote_upload: '',
      distributor_discount_yn: 'No', distributor_margin_percent: '',
      final_po_payment_terms_yn: 'No', distributor_approved_quote_upload: '',
      customer_po_yn: 'No', customer_po_upload: '', internal_finance_approval: 'No'
    },
    stage5: {
      b2b_ordering: 'No', product_delivery_type: 'No',
      license_delivery_type: '', verify_margins_yn: 'No',
      cross_verify_boq_yn: 'No', payment_terms_negotiation: 'No',
      order_placement_date: '', weekly_delivery_updates: '',
      product_license_delivery_yn: 'No', delivery_confirmation_yn: 'No'
    },
    stage6: {
      project_plan_tracker_yn: 'No', project_plan_tracker_upload: '',
      project_completion_cert_yn: 'No', project_completion_cert_upload: '',
      uat_signoff: 'No', 
      project_plan_tech_align_yn: 'No', tech_align_engineer_name: '',
      milestones_tracking_meet: '', milestones_timeline: '',
      tech_implementation_uat_yn: 'No', tech_implementation_uat_upload: '', 
      admin_training: 'No',
      handover_signoff_yn: 'No', handover_signoff_doc: '', 
      uat_completion_doc_yn: 'No',
      project_signoff: 'No', closure_mail_yn: 'No'
    },
    stage7: {
      invoice_submission_yn: 'No', invoice_submission_upload: '', 
      payment_success: 'No',
      finance_confirmation: 'No', submit_project_doc_finance: 'No',
      project_signoff_approval: 'No', invoice_submission_followup: '',
      payment_confirmation_finance: 'No', thanks_mail_closure: 'No',
      recognition_internal_mail: 'No'
    }
  });

  const [stageStatus, setStageStatus] = useState('In Progress');

  useEffect(() => {
    if (isEditMode) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/sales/${id}`);
      const data = await res.json();
      
      // Populate Header
      setHeader({
        opportunity_name: data.opportunity_name,
        customer_name: data.customer_name,
        customer_address: data.customer_address,
        customer_contact_person: data.customer_contact_person,
        customer_email: data.customer_email,
        ttl_sales_name: data.ttl_sales_name,
        ttl_contact_number: data.ttl_contact_number,
        ttl_email: data.ttl_email,
        technical_owner: data.technical_owner,
        product: data.product,
        oem: data.oem,
        oem_contact: data.oem_contact,
        oem_details: data.oem_details,
        distributor_name: data.distributor_name,
        distributor_contact: data.distributor_contact,
        distributor_email: data.distributor_email
      });

      // Populate Stages
      if (data.stage_data) {
        setStageData(data.stage_data); 
      }
      
      setActiveStage(data.current_stage || 1);
      setMaxStage(data.current_stage || 1);
      setStageStatus(data.stage_status);

    } catch (error) {
      console.error("Error fetching opportunity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  const handleStageDataChange = (stage, field, value) => {
    setStageData(prev => ({
      ...prev,
      [`stage${stage}`]: {
        ...prev[`stage${stage}`],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (e, stage, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    // Construct custom name rule: TTL-customername-product-date-SUFFIX
    const dateStr = new Date().toISOString().split('T')[0];
    const cleanCustomer = (header.customer_name || 'CUST').replace(/[^a-zA-Z0-9]/g, '');
    const cleanProduct = (header.product || 'PROD').replace(/[^a-zA-Z0-9]/g, '');
    const customName = `TTL-${cleanCustomer}-${cleanProduct}-${dateStr}-${docType}`;
    
    formData.append('docType', docType);
    formData.append('customName', customName);

    try {
      const url = isEditMode 
        ? `http://localhost:5000/api/sales/${id}/upload`
        : null; 
      
      if (!url) {
        toast.error("Please save the opportunity first before uploading files.");
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.fileName) {
        // Find the correct field key for this upload
        // We assume docType passed matches the state key
        handleStageDataChange(stage, docType, data.fileName); 
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const canAdvance = () => {
    if (activeStage === 1) return stageData.stage1.go_no_go === 'Yes';
    if (activeStage === 2) return stageData.stage2.handoff_presales === 'Yes' && stageData.stage2.oem_approval === 'Yes';
    if (activeStage === 3) return stageData.stage3.handoff_tech === 'Yes';
    if (activeStage === 4) return stageData.stage4.commercial_closure === 'Yes';
    if (activeStage === 6) {
      return stageData.stage6.uat_completion_doc_yn === 'Yes' && 
             stageData.stage6.project_signoff === 'Yes' && 
             stageData.stage6.closure_mail_yn === 'Yes';
    }
    return true;
  };

  const saveOpportunity = async (payload, isNextStage = false) => {
    const url = isEditMode 
      ? `http://localhost:5000/api/sales/${id}` 
      : `http://localhost:5000/api/sales`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isNextStage) {
          toast.success("Stage Completed! Moving to next...");
          const next = activeStage + 1;
          setActiveStage(next);
          setMaxStage(Math.max(maxStage, next));
          setStageStatus('In Progress');
        } else {
          toast.success("Progress saved! (Draft)");
        }
        
        if (!isEditMode && data.opportunityId) {
          navigate(`/sales/${data.opportunityId}`);
        }
      } else {
        toast.error("Error saving: " + data.message);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Network error while saving");
    }
  };

  const handleSaveDraft = (e) => {
    e?.preventDefault();
    const payload = {
      ...header,
      stage_status: 'In Progress',
      stage_data: stageData,
      created_by: localStorage.getItem("userId")
    };
    
    // Only update current_stage if we are creating a new opportunity
    if (!isEditMode) {
      payload.current_stage = activeStage;
    }

    saveOpportunity(payload, false);
  };

  const handleNextStage = (e) => {
    e?.preventDefault();
    
    if (!canAdvance()) {
      toast.error("Cannot advance. Please fill all mandatory fields marked with * and ensure approvals are 'Yes'.");
      return;
    }
    
    if (activeStage >= 7) {
      toast.success("Opportunity already at final stage!");
      return;
    }

    const payload = {
      ...header,
      current_stage: activeStage + 1, // Advance to next
      stage_status: 'In Progress', // Reset status for next stage
      stage_data: stageData,
      created_by: localStorage.getItem("userId")
    };
    saveOpportunity(payload, true);
  };

  const renderStageBar = () => {
    const stages = [
      "Qualification", "Tech Presentation", "POC / POV", 
      "Commercial", "Ordering", "Implementation", "Invoice"
    ];
    
    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
        {stages.map((name, idx) => {
          const step = idx + 1;
          const isActive = activeStage === step;
          const isCompleted = step < activeStage; 
          const isLocked = step > maxStage;

          return (
            <div 
              key={step} 
              className={`flex flex-col items-center min-w-[120px] relative cursor-pointer ${isLocked ? 'opacity-50' : ''}`}
              onClick={() => !isLocked && setActiveStage(step)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors
                ${isActive ? 'bg-indigo-600 text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {isCompleted ? <CheckCircle className="w-6 h-6" /> : step}
              </div>
              <span className={`text-xs font-medium text-center ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                {name}
              </span>
              {idx < stages.length - 1 && (
                <div className="hidden md:block absolute top-5 left-1/2 w-full h-1 bg-gray-200 -z-10" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper for Upload Input
  const FileUpload = ({ label, stage, field, value }) => (
    <div className="border p-3 rounded-lg bg-gray-50">
      <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Choose File
          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, stage, field)} />
        </label>
        {value ? (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {value}
          </span>
        ) : (
          <span className="text-xs text-gray-400">No file chosen</span>
        )}
      </div>
    </div>
  );

  // Helper for Yes/No Dropdown
  const YesNoSelect = ({ label, stage, field, value, required }) => (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select 
        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
        value={value || 'No'}
        onChange={(e) => handleStageDataChange(stage, field, e.target.value)}
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>
  );

  return (
    <EngineerLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? `Opportunity: ${header.opportunity_name}` : "New Opportunity"}
          </h1>
          <button onClick={handleSaveDraft} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-sm">
            <Save className="w-4 h-4" /> Save Draft
          </button>
        </div>

        {/* 1. HEADER SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Section 1: Customer & Sales Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Customer & Sales Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name</label>
                <input name="opportunity_name" placeholder="Enter opportunity name" value={header.opportunity_name} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input name="customer_name" placeholder="Enter customer name" value={header.customer_name} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact Person</label>
                   <input name="customer_contact_person" placeholder="Contact person" value={header.customer_contact_person} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
                <textarea name="customer_address" placeholder="Enter address" value={header.customer_address} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg h-20 resize-none" />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                 <input type="email" name="customer_email" placeholder="email@customer.com" value={header.customer_email} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">TTL Sales Info</h3>
                <div className="space-y-3">
                  <input name="ttl_sales_name" placeholder="TTL Sales Name" value={header.ttl_sales_name} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" name="ttl_contact_number" placeholder="TTL Contact Number" value={header.ttl_contact_number} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                    <input type="email" name="ttl_email" placeholder="TTL Email" value={header.ttl_email} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Technical & Distributor Details */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Technical & Distributor Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technical Owner / Presales</label>
                <select name="technical_owner" value={header.technical_owner} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white">
                  <option value="">Select Technical Owner</option>
                  <option value="Unassigned">Unassigned</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select name="product" value={header.product} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white">
                    <option value="">Select Product</option>
                    <option value="NGFW">NGFW</option>
                    <option value="SASE">SASE</option>
                    <option value="Endpoint">Endpoint Security</option>
                    <option value="XDR">XDR</option>
                    <option value="SIEM">SIEM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OEM</label>
                  <select name="oem" value={header.oem} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white">
                    <option value="">Select OEM</option>
                    <option value="Palo Alto">Palo Alto</option>
                    <option value="Fortinet">Fortinet</option>
                    <option value="AWS">AWS</option>
                    <option value="Proofpoint">Proofpoint</option>
                    <option value="CrowdStrike">CrowdStrike</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input name="oem_contact" placeholder="OEM Contact Person" value={header.oem_contact} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                 <input name="oem_details" placeholder="OEM Additional Details" value={header.oem_details} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Distributor Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name</label>
                    <select name="distributor_name" value={header.distributor_name} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg bg-white">
                      <option value="">Select Distributor</option>
                      <option value="Ingram Micro">Ingram Micro</option>
                      <option value="Redington">Redington</option>
                      <option value="Westcon">Westcon</option>
                      <option value="Tech Data">Tech Data</option>
                      <option value="Savex">Savex</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="distributor_contact" placeholder="Distributor Contact" value={header.distributor_contact} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                    <input type="email" name="distributor_email" placeholder="Distributor Email" value={header.distributor_email} onChange={handleHeaderChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STAGE PROGRESS */}
        {renderStageBar()}

        {/* 3. STAGE DETAILS PANEL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Stage {activeStage}: {
                ["Qualification & Discovery", "Tech Presentation", "POC / POV", "Commercial", "Ordering", "Implementation", "Invoice"][activeStage-1]
              }
            </h2>
            <div className="flex gap-2">
               {/* Advance Button */}
               <button 
                 onClick={handleNextStage}
                 disabled={activeStage === 7}
                 className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
               >
                 Next Stage <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* DYNAMIC FORM CONTENT BASED ON STAGE */}
          
          {/* STAGE 1 */}
          {activeStage === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <h3 className="font-semibold text-gray-700 mb-3">Identify Decision Makers, Influencers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input placeholder="Decision Maker Name" className="border p-2 rounded" value={stageData.stage1.decision_maker_name} onChange={(e) => handleStageDataChange(1, 'decision_maker_name', e.target.value)} />
                  <input placeholder="Influencer Name" className="border p-2 rounded" value={stageData.stage1.influencer_name} onChange={(e) => handleStageDataChange(1, 'influencer_name', e.target.value)} />
                  <input placeholder="Purchase / Procurement" className="border p-2 rounded" value={stageData.stage1.purchase_procurement} onChange={(e) => handleStageDataChange(1, 'purchase_procurement', e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Map applicable cybersecurity solutions</label>
                <select className="w-full border p-2 rounded" value={stageData.stage1.mapped_product} onChange={(e) => handleStageDataChange(1, 'mapped_product', e.target.value)}>
                   <option value="">Select Product</option>
                   <option value="Product A">Product A</option>
                   <option value="Product B">Product B</option>
                </select>
              </div>

              <div className="col-span-full">
                 <label className="block text-sm font-medium mb-1">Identify Problem or Requirement Statement</label>
                 <textarea className="w-full border p-2 rounded" value={stageData.stage1.problem_statement} onChange={(e) => handleStageDataChange(1, 'problem_statement', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Meet Decision Maker (Date)</label>
                <input type="date" className="w-full border p-2 rounded" value={stageData.stage1.meeting_date_dm} onChange={(e) => handleStageDataChange(1, 'meeting_date_dm', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Decision Maker Name (Meeting)</label>
                <input className="w-full border p-2 rounded" value={stageData.stage1.dm_name_meeting} onChange={(e) => handleStageDataChange(1, 'dm_name_meeting', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prepare BANT (Date)</label>
                <input type="date" className="w-full border p-2 rounded" value={stageData.stage1.rant_date} onChange={(e) => handleStageDataChange(1, 'rant_date', e.target.value)} />
              </div>

              <FileUpload label="Get or Fill Qualification/Questionnaire (TTL-CUST-PROD-DATE)" stage={1} field="qual_doc_upload" value={stageData.stage1.qual_doc_upload} />

              <YesNoSelect label="Technical Qualification Document Ready?" stage={1} field="tech_qual_doc_ready" value={stageData.stage1.tech_qual_doc_ready} />
              
              <FileUpload label="Deal Map Prepared (Org Chart)" stage={1} field="deal_map_org_chart" value={stageData.stage1.deal_map_org_chart} />

              <YesNoSelect label="Go or No Go (Admin/Manager Sign-off)" stage={1} field="go_no_go" value={stageData.stage1.go_no_go} required={true} />
            </div>
          )}

          {/* STAGE 2 */}
          {activeStage === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <YesNoSelect label="Tech Solution Mapping with Requirement" stage={2} field="tech_solution_mapping" value={stageData.stage2.tech_solution_mapping} />
              <YesNoSelect label="Collect detailed business and technical use cases" stage={2} field="collect_use_cases" value={stageData.stage2.collect_use_cases} />
              
              <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded bg-gray-50">
                 <h4 className="col-span-full font-medium">Align Right OEM</h4>
                 <select className="border p-2 rounded" value={stageData.stage2.align_oem} onChange={(e) => handleStageDataChange(2, 'align_oem', e.target.value)}>
                    <option value="">Select OEM</option>
                    <option value="Palo Alto">Palo Alto</option>
                    <option value="F5">F5</option>
                    <option value="AWS">AWS</option>
                    <option value="Proofpoint">Proofpoint</option>
                 </select>
                 <input placeholder="Account Manager" className="border p-2 rounded" value={stageData.stage2.oem_account_manager} onChange={(e) => handleStageDataChange(2, 'oem_account_manager', e.target.value)} />
                 <input placeholder="Contact Email" className="border p-2 rounded" value={stageData.stage2.oem_contact_email} onChange={(e) => handleStageDataChange(2, 'oem_contact_email', e.target.value)} />
              </div>

              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                 <YesNoSelect label="TQD Presentation" stage={2} field="tqd_presentation_yn" value={stageData.stage2.tqd_presentation_yn} />
                 {stageData.stage2.tqd_presentation_yn === 'Yes' && (
                    <FileUpload label="Upload TQD Presentation" stage={2} field="tqd_presentation_upload" value={stageData.stage2.tqd_presentation_upload} />
                 )}
              </div>

              <YesNoSelect label="Handoff to Presales Team" stage={2} field="handoff_presales" value={stageData.stage2.handoff_presales} required={true} />
              
              <div className={`col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 ${stageData.stage2.handoff_presales !== 'Yes' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="col-span-full">
                     <label className="block text-sm font-medium mb-1">Customer Requirement Discovery Call (Notes)</label>
                     <textarea className="w-full border p-2 rounded" value={stageData.stage2.cust_req_discovery} onChange={(e) => handleStageDataChange(2, 'cust_req_discovery', e.target.value)} />
                  </div>

                  <div>
                     <YesNoSelect label="First Level Presentation from TTL (FLP)" stage={2} field="flp_yn" value={stageData.stage2.flp_yn} />
                     {stageData.stage2.flp_yn === 'Yes' && (
                       <FileUpload label="Upload FLP" stage={2} field="flp_upload" value={stageData.stage2.flp_upload} />
                     )}
                  </div>

                  <div>
                     <YesNoSelect label="Second Level Presentation from OEM" stage={2} field="oem_presentation_yn" value={stageData.stage2.oem_presentation_yn} />
                     {stageData.stage2.oem_presentation_yn === 'Yes' && (
                       <FileUpload label="Upload OEM Presentation" stage={2} field="oem_presentation_upload" value={stageData.stage2.oem_presentation_upload} />
                     )}
                  </div>
                  
                  <YesNoSelect label="Documenting Tech Success with OEM and Customer" stage={2} field="tech_success_doc" value={stageData.stage2.tech_success_doc} />
                  <FileUpload label="Use Case / POC Document" stage={2} field="poc_use_case_doc" value={stageData.stage2.poc_use_case_doc} />
                  
                  <YesNoSelect label="Use Case Signoff from Customer" stage={2} field="use_case_signoff" value={stageData.stage2.use_case_signoff} />
                  <YesNoSelect label="Approval from OEM (Account Manager)" stage={2} field="oem_approval" value={stageData.stage2.oem_approval} required={true} />
              </div>
            </div>
          )}

          {/* STAGE 3 */}
          {activeStage === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                 <YesNoSelect label="POC Detailed Document Ready?" stage={3} field="poc_detailed_doc_yn" value={stageData.stage3.poc_detailed_doc_yn} />
                 {stageData.stage3.poc_detailed_doc_yn === 'Yes' && (
                    <FileUpload label="Upload POC Detailed Doc" stage={3} field="poc_detailed_doc_upload" value={stageData.stage3.poc_detailed_doc_upload} />
                 )}
              </div>

              <div>
                  <YesNoSelect label="Tech Solution Finalization" stage={3} field="tech_solution_final_yn" value={stageData.stage3.tech_solution_final_yn} />
                  {stageData.stage3.tech_solution_final_yn === 'Yes' && (
                     <FileUpload label="Upload Tech Solution Doc" stage={3} field="tech_solution_final_upload" value={stageData.stage3.tech_solution_final_upload} />
                  )}
              </div>

              <div>
                  <YesNoSelect label="BOQ Approval" stage={3} field="boq_approval_yn" value={stageData.stage3.boq_approval_yn} />
                  {stageData.stage3.boq_approval_yn === 'Yes' && (
                     <FileUpload label="Upload BOQ Approval" stage={3} field="boq_approval_upload" value={stageData.stage3.boq_approval_upload} />
                  )}
              </div>
              
              <YesNoSelect label="Handoff to Tech Team" stage={3} field="handoff_tech" value={stageData.stage3.handoff_tech} />
              
              <div>
                  <YesNoSelect label="Integration with Solution" stage={3} field="integration_solution_yn" value={stageData.stage3.integration_solution_yn} />
                  {stageData.stage3.integration_solution_yn === 'Yes' && (
                     <FileUpload label="Upload Integration Doc" stage={3} field="integrations_upload" value={stageData.stage3.integrations_upload} />
                  )}
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1">POC Kickoff Date</label>
                 <input type="date" className="w-full border p-2 rounded" value={stageData.stage3.poc_kickoff_date} onChange={(e) => handleStageDataChange(3, 'poc_kickoff_date', e.target.value)} />
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1">POC Completion Date</label>
                 <input type="date" className="w-full border p-2 rounded" value={stageData.stage3.poc_completion_date} onChange={(e) => handleStageDataChange(3, 'poc_completion_date', e.target.value)} />
              </div>

              <FileUpload label="POC / Use Case Document (POC-DOC)" stage={3} field="poc_use_case_doc_final" value={stageData.stage3.poc_use_case_doc_final} />
              <FileUpload label="Solution Document (SOL-DOC)" stage={3} field="solution_doc_upload" value={stageData.stage3.solution_doc_upload} />
              
              <div className="col-span-full border p-4 rounded bg-gray-50">
                  <YesNoSelect label="BOQ Initial to Final Approved Versions" stage={3} field="boq_version_yn" value={stageData.stage3.boq_version_yn} />
                  {stageData.stage3.boq_version_yn === 'Yes' && (
                     <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Version</label>
                            <select className="w-full border p-2 rounded" value={stageData.stage3.boq_version_number} onChange={(e) => handleStageDataChange(3, 'boq_version_number', e.target.value)}>
                                <option value="">Select Version</option>
                                {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                            </select>
                        </div>
                        <FileUpload label="Upload BOQ Version" stage={3} field="boq_version_upload" value={stageData.stage3.boq_version_upload} />
                     </div>
                  )}
              </div>
            </div>
          )}

          {/* STAGE 4 */}
          {activeStage === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <YesNoSelect label="Commercial Closure" stage={4} field="commercial_closure" value={stageData.stage4.commercial_closure} />
              <YesNoSelect label="Technical SOW Closure" stage={4} field="technical_sow_closure" value={stageData.stage4.technical_sow_closure} />
              
              <FileUpload label="Final PO" stage={4} field="final_po_upload" value={stageData.stage4.final_po_upload} />
              <FileUpload label="Customer Req Doc & POC Review (CRD)" stage={4} field="cust_req_doc_review_upload" value={stageData.stage4.cust_req_doc_review_upload} />
              
              <FileUpload label="Budgetary Quotes (BOQ)" stage={4} field="budgetary_quote_upload" value={stageData.stage4.budgetary_quote_upload} />
              <FileUpload label="Negotiated Quotes (NQ)" stage={4} field="negotiated_quote_upload" value={stageData.stage4.negotiated_quote_upload} />
              
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <YesNoSelect label="Distributor Discounts with Margin %" stage={4} field="distributor_discount_yn" value={stageData.stage4.distributor_discount_yn} />
                <input placeholder="Margin %" className="border p-2 rounded mt-6" value={stageData.stage4.distributor_margin_percent} onChange={(e) => handleStageDataChange(4, 'distributor_margin_percent', e.target.value)} />
              </div>

              <YesNoSelect label="Final PO Received along with Payment Terms" stage={4} field="final_po_payment_terms_yn" value={stageData.stage4.final_po_payment_terms_yn} />
              
              <FileUpload label="Distributor Approved Quote in INR (Dist)" stage={4} field="distributor_approved_quote_upload" value={stageData.stage4.distributor_approved_quote_upload} />
              <div>
                 <YesNoSelect label="Customer PO (Cust-PO)" stage={4} field="customer_po_yn" value={stageData.stage4.customer_po_yn} />
                 {stageData.stage4.customer_po_yn === 'Yes' && (
                    <FileUpload label="Upload Customer PO" stage={4} field="customer_po_upload" value={stageData.stage4.customer_po_upload} />
                 )}
              </div>
              
              <YesNoSelect label="Internal Finance Approval" stage={4} field="internal_finance_approval" value={stageData.stage4.internal_finance_approval} />
            </div>
          )}

          {/* STAGE 5 */}
          {activeStage === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <YesNoSelect label="B2B Ordering" stage={5} field="b2b_ordering" value={stageData.stage5.b2b_ordering} />
               
               <div>
                 <label className="block text-sm font-medium mb-1">Product Delivery Type</label>
                 <select className="w-full border p-2 rounded" value={stageData.stage5.product_delivery_type} onChange={(e) => handleStageDataChange(5, 'product_delivery_type', e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Door to Door">Door to Door</option>
                    <option value="Customer">Customer</option>
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1">License Delivery</label>
                 <select className="w-full border p-2 rounded" value={stageData.stage5.license_delivery_type} onChange={(e) => handleStageDataChange(5, 'license_delivery_type', e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                 </select>
               </div>

               <YesNoSelect label="Verification of Margins in PO Against Dist Quote" stage={5} field="verify_margins_yn" value={stageData.stage5.verify_margins_yn} />
               <YesNoSelect label="Cross Verification of BOQ (Items vs Order)" stage={5} field="cross_verify_boq_yn" value={stageData.stage5.cross_verify_boq_yn} />
               <YesNoSelect label="Payment Terms Negotiation" stage={5} field="payment_terms_negotiation" value={stageData.stage5.payment_terms_negotiation} />
               
               <div>
                 <label className="block text-sm font-medium mb-1">Order Placement and Confirmation from OEM (Date)</label>
                 <input type="date" className="w-full border p-2 rounded" value={stageData.stage5.order_placement_date} onChange={(e) => handleStageDataChange(5, 'order_placement_date', e.target.value)} />
               </div>

               <div>
                 <label className="block text-sm font-medium mb-1">Weekly Delivery Updates</label>
                 <select className="w-full border p-2 rounded" value={stageData.stage5.weekly_delivery_updates} onChange={(e) => handleStageDataChange(5, 'weekly_delivery_updates', e.target.value)}>
                    <option value="">Select Update</option>
                    <option value="Week 1">Week 1</option>
                    <option value="Week 2">Week 2</option>
                    <option value="Week 3">Week 3</option>
                    <option value="Week 4">Week 4</option>
                    <option value="Week 5">Week 5</option>
                 </select>
               </div>

               <YesNoSelect label="Product / License Delivery" stage={5} field="product_license_delivery_yn" value={stageData.stage5.product_license_delivery_yn} />
               <YesNoSelect label="Delivery Confirmation" stage={5} field="delivery_confirmation_yn" value={stageData.stage5.delivery_confirmation_yn} />
            </div>
          )}

          {/* STAGE 6 */}
          {activeStage === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <YesNoSelect label="Project Plan and Tracker" stage={6} field="project_plan_tracker_yn" value={stageData.stage6.project_plan_tracker_yn} />
                 {stageData.stage6.project_plan_tracker_yn === 'Yes' && (
                    <FileUpload label="Upload Project Plan Tracker" stage={6} field="project_plan_tracker_upload" value={stageData.stage6.project_plan_tracker_upload} />
                 )}
              </div>

              <div>
                 <YesNoSelect label="Project Completion (Cert)" stage={6} field="project_completion_cert_yn" value={stageData.stage6.project_completion_cert_yn} />
                 {stageData.stage6.project_completion_cert_yn === 'Yes' && (
                    <FileUpload label="Upload Completion Cert" stage={6} field="project_completion_cert_upload" value={stageData.stage6.project_completion_cert_upload} />
                 )}
              </div>
              
              <YesNoSelect label="UAT Sign-off" stage={6} field="uat_signoff" value={stageData.stage6.uat_signoff} />
              
              <div>
                 <YesNoSelect label="Project Plan and Technical Team Alignment" stage={6} field="project_plan_tech_align_yn" value={stageData.stage6.project_plan_tech_align_yn} />
                 {stageData.stage6.project_plan_tech_align_yn === 'Yes' && (
                    <input 
                      placeholder="Enter Engineer Name" 
                      className="w-full border p-2 rounded mt-2" 
                      value={stageData.stage6.tech_align_engineer_name} 
                      onChange={(e) => handleStageDataChange(6, 'tech_align_engineer_name', e.target.value)} 
                    />
                 )}
              </div>
              
              <div>
                 <label className="block text-sm font-medium mb-1">Milestones Tracking</label>
                 <select 
                   className="w-full border p-2 rounded" 
                   value={stageData.stage6.milestones_tracking_meet} 
                   onChange={(e) => handleStageDataChange(6, 'milestones_tracking_meet', e.target.value)}
                 >
                   <option value="">Select Milestone</option>
                   {[...Array(10)].map((_, i) => <option key={i+1} value={`meet${i+1}`}>{`meet${i+1}`}</option>)}
                 </select>
              </div>
              
              <div className="col-span-full">
                 <label className="block text-sm font-medium mb-1">Milestones Timeline</label>
                 <textarea className="w-full border p-2 rounded" value={stageData.stage6.milestones_timeline} onChange={(e) => handleStageDataChange(6, 'milestones_timeline', e.target.value)} />
              </div>

              <div>
                 <YesNoSelect label="Tech Implementation and UAT Testing (UAT)" stage={6} field="tech_implementation_uat_yn" value={stageData.stage6.tech_implementation_uat_yn} />
                 {stageData.stage6.tech_implementation_uat_yn === 'Yes' && (
                    <FileUpload label="Upload UAT Doc" stage={6} field="tech_implementation_uat_upload" value={stageData.stage6.tech_implementation_uat_upload} />
                 )}
              </div>
              
              <YesNoSelect label="Admin Training" stage={6} field="admin_training" value={stageData.stage6.admin_training} />
              
              <div>
                 <YesNoSelect label="Handover and Signoff (Project-Doc)" stage={6} field="handover_signoff_yn" value={stageData.stage6.handover_signoff_yn} />
                 {stageData.stage6.handover_signoff_yn === 'Yes' && (
                    <FileUpload label="Upload Handover Doc" stage={6} field="handover_signoff_doc" value={stageData.stage6.handover_signoff_doc} />
                 )}
              </div>
              
              <YesNoSelect label="UAT Completion Document" stage={6} field="uat_completion_doc_yn" value={stageData.stage6.uat_completion_doc_yn} required={true} />
              <YesNoSelect label="Project Signoff" stage={6} field="project_signoff" value={stageData.stage6.project_signoff} required={true} />
              <YesNoSelect label="Closure Update Mail to OEM" stage={6} field="closure_mail_yn" value={stageData.stage6.closure_mail_yn} required={true} />
            </div>
          )}

          {/* STAGE 7 */}
          {activeStage === 7 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <YesNoSelect label="Invoice Submission (Invoice)" stage={7} field="invoice_submission_yn" value={stageData.stage7.invoice_submission_yn} />
                  {stageData.stage7.invoice_submission_yn === 'Yes' && (
                     <FileUpload label="Upload Invoice" stage={7} field="invoice_submission_upload" value={stageData.stage7.invoice_submission_upload} />
                  )}
               </div>
               
               <YesNoSelect label="Payment Success" stage={7} field="payment_success" value={stageData.stage7.payment_success} />
               <YesNoSelect label="Finance Confirmation" stage={7} field="finance_confirmation" value={stageData.stage7.finance_confirmation} />
               <YesNoSelect label="Submit Project Document to IT/Finance" stage={7} field="submit_project_doc_finance" value={stageData.stage7.submit_project_doc_finance} />
               <YesNoSelect label="Project Sign-Off Approval" stage={7} field="project_signoff_approval" value={stageData.stage7.project_signoff_approval} />
               
               <div>
                 <label className="block text-sm font-medium mb-1">Invoice Submission Follow-up (Date)</label>
                 <input type="date" className="w-full border p-2 rounded" value={stageData.stage7.invoice_submission_followup} onChange={(e) => handleStageDataChange(7, 'invoice_submission_followup', e.target.value)} />
               </div>

               <YesNoSelect label="Payment Confirmation from Finance" stage={7} field="payment_confirmation_finance" value={stageData.stage7.payment_confirmation_finance} />
               <YesNoSelect label="Thanks Mail Closure (From Customer / OEM)" stage={7} field="thanks_mail_closure" value={stageData.stage7.thanks_mail_closure} />
               <YesNoSelect label="Recognition Internal Mail" stage={7} field="recognition_internal_mail" value={stageData.stage7.recognition_internal_mail} />
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 pb-8 border-t pt-6">
          <button 
            onClick={handleSaveDraft} 
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          
          <button 
            onClick={handleNextStage} 
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-colors"
          >
            Next Stage <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </EngineerLayout>
  );
}
