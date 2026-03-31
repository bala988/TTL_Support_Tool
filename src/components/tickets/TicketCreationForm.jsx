import { useState, useEffect } from "react";
import { ArrowLeft, Save, AlertCircle, Upload, CheckCircle, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import EngineerLayout from "../common/EngineerLayout";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function TicketCreationForm() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");
  const dashboardPath = userRole === "admin" ? "/admin/dashboard" : "/engineer/dashboard";

  // Dynamic API URL handling for local network access
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  const [formData, setFormData] = useState({
    severity: "Medium",
    ticketType: "Incident",
    technologyDomain: "Network Security",
    customerName: "",
    customerId: "", // This will hold the selected serial_no
    uniqueId: "",
    contactName: "",
    phone: "",
    email: "",
    assignedEngineer: localStorage.getItem("userName") || "",
    engineerPhone: localStorage.getItem("userPhone") || "",
    engineerEmail: localStorage.getItem("userEmail") || "",
    issueSubject: "",
    issueDescription: "",
    oemTacInvolved: "No",
    tacCaseNumber: "",
    engineerRemarks: "",
    problemResolution: "",
    attachment: null,
    referenceUrls: [""],
    openDate: new Date().toISOString().split("T")[0],
    closeDate: "",
  });

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch customers from DB
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  const handleCustomerChange = (e) => {
    const customerName = e.target.value;
    const selected = customers.find(c => c.name === customerName);
    
    if (selected) {
      setIsOtherSelected(false);
      setSelectedCustomer(selected);
      setFormData(prev => ({
        ...prev,
        customerName: selected.name,
        customerId: "", // Reset to force selection from dropdown
        uniqueId: "",
        contactName: "",
        phone: "",
        email: ""
      }));
    } else if (customerName === "Others") {
      setIsOtherSelected(true);
      setSelectedCustomer(null);
      setFormData(prev => ({ 
        ...prev, 
        customerName: "",
        customerId: "",
        uniqueId: "",
        contactName: "",
        phone: "",
        email: ""
      }));
    } else {
      setIsOtherSelected(false);
      setSelectedCustomer(null);
      setFormData(prev => ({ ...prev, customerName }));
    }
  };

  const handleSerialChange = (e) => {
    const serialNo = e.target.value;
    if (isOtherSelected) {
      setFormData(prev => ({ ...prev, customerId: serialNo }));
      return;
    }

    const serialObj = selectedCustomer?.serials?.find(s => s.serial_no === serialNo);
    setFormData(prev => ({
      ...prev,
      customerId: serialNo,
      uniqueId: serialObj?.unique_id || ""
    }));
  };

  const handleContactChange = (e) => {
    const contactName = e.target.value;
    if (isOtherSelected) {
      setFormData(prev => ({ ...prev, contactName }));
      return;
    }

    const contactObj = selectedCustomer?.contacts?.find(c => c.contact_name === contactName);
    setFormData(prev => ({
      ...prev,
      contactName: contactName,
      phone: contactObj?.phone || "",
      email: contactObj?.email || ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Frontend validation for 10-digit phone number
      const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number for the contact");
        setIsSubmitting(false);
        return;
      }

      const data = new FormData();
      data.append('severity', formData.severity);
      data.append('ticket_type', formData.ticketType);
      data.append('technology_domain', formData.technologyDomain);
      data.append('customer_name', formData.customerName);
      data.append('customer_serial_no', formData.customerId);
      // Merge CSP ID and TSG ID into a single Unique ID by sending to both fields for compatibility
      data.append('tsg_id', formData.uniqueId);
      data.append('csp_id', formData.uniqueId);
      data.append('contact_name', formData.contactName);
      data.append('contact_phone', phoneDigits);
      data.append('contact_email', formData.email);

      // Ensure assigned_engineer is set to the current user (creator)
      const currentUserName = localStorage.getItem("userName");
      data.append('assigned_engineer', currentUserName || formData.assignedEngineer);

      data.append('engineer_phone', formData.engineerPhone);
      data.append('engineer_email', formData.engineerEmail);
      data.append('issue_subject', formData.issueSubject);
      data.append('issue_description', formData.issueDescription);
      data.append('oem_tac_involved', formData.oemTacInvolved);
      data.append('tac_case_number', formData.tacCaseNumber);
      data.append('engineer_remarks', formData.engineerRemarks);
      data.append('problem_resolution', formData.problemResolution);
      // Multiple reference URLs support: join as pipe-separated string
      const cleanedUrls = (formData.referenceUrls || []).map(u => (u || '').trim()).filter(Boolean);
      data.append('reference_url', cleanedUrls.join(' | '));

      // Fix: If openDate matches today's date (YYYY-MM-DD), send the current full timestamp in LOCAL time
      // to avoid UTC conversion issues (e.g. appearing as yesterday).
      // We want to map it exactly to the system date/time as the user sees it.
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      if (formData.openDate === todayStr) {
        // Send current UTC timestamp. 
        // The backend and frontend should handle UTC conversion correctly.
        data.append('open_date', new Date().toISOString());
      } else {
        // If user selected a past date, send it as is (YYYY-MM-DD).
        // MySQL DATETIME will interpret this as YYYY-MM-DD 00:00:00 (Midnight Local)
        data.append('open_date', formData.openDate);
      }

      data.append('close_date', formData.closeDate);

      const userId = localStorage.getItem("userId");
      if (userId) {
        data.append('created_by', userId);
      }

      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      const response = await fetch(`${API_URL}/api/tickets/create`, {
        method: 'POST',
        body: data
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Send Email Notification
        // Only attempt to send email if EmailJS is configured
        if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID) {
          try {
            const templateParams = {
              customer_name: formData.customerName,
              customer_email: formData.email,
              issue_description: formData.issueDescription,
              ticket_id: result.ticketNumber || result.ticketId || "Pending",
              assigned_engineer: formData.assignedEngineer,
              engineer_phone: formData.engineerPhone,
              reply_to: "support@tutelartechlabs.com"
            };

            await emailjs.send(
              EMAILJS_SERVICE_ID,
              EMAILJS_TEMPLATE_ID,
              templateParams,
              EMAILJS_PUBLIC_KEY
            );
            console.log("✅ Email sent successfully to:", formData.email);
          } catch (emailError) {
            console.error("❌ Failed to send email:", emailError);
            console.error("Email error details:", emailError.text || emailError.message);
            // Don't block the UI for email failure
            toast.success("Ticket created successfully!", { duration: 3000 });
            toast.error("Email notification could not be sent", { duration: 4000 });
          }
        } else {
          console.warn("⚠️ EmailJS not configured. Skipping email notification.");
          console.warn("Please configure VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env file");
        }

        toast.success("Ticket created successfully! 🎉", { duration: 3000 });
        navigate(dashboardPath);
      } else {
        toast.error("Error creating ticket: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error creating ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EngineerLayout>
      <div className="p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(dashboardPath)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Ticket
          </h1>
          <p className="text-gray-600 mt-2 dark:text-slate-400">
            Fill in the details to create a support ticket
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="flex items-center gap-2 font-semibold mb-4 text-gray-900 dark:text-white">
              <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Ticket Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Ticket Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ticketType}
                  onChange={(e) =>
                    setFormData({ ...formData, ticketType: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="Incident">Incident</option>
                  <option value="Service Request">Service Request</option>
                  <option value="Feature Implementation">
                    Feature Implementation
                  </option>
                  <option value="UAT">UAT</option>
                  <option value="Testing">Testing</option>
                  <option value="BCP">BCP</option>
                  <option value="Upgrade">Upgrade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Technology Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.technologyDomain}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      technologyDomain: e.target.value,
                    })
                  }
                  className="input"
                  required
                >
                  <optgroup label="Network Security">
                    <option value="NGFW">NGFW</option>
                    <option value="SASE">SASE</option>
                    <option value="CASB">CASB</option>
                    <option value="PRISMA ACCESS">PRISMA ACCESS</option>
                    <option value="PRISMA BROWSER">PRISMA BROWSER</option>

                  </optgroup>
                  <optgroup label="SOC">
                    <option value="EDR">EDR</option>
                    <option value="XDR">XDR</option>
                    <option value="SIEM">SIEM</option>
                    <option value="SOAR">SOAR</option>
                    <option value="ASM">ASM</option>
                    <option value="TIM">TIM</option>
                  </optgroup>
                  <optgroup label="Cloud Security">
                    <option value="CSPM">CSPM</option>
                    <option value="CWP">CWP</option>
                    <option value="CIEM">CIEM</option>
                    <option value="IAC">IAC</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <select
                  className="input"
                  value={isOtherSelected ? "Others" : formData.customerName}
                  onChange={handleCustomerChange}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {isOtherSelected && (
                  <input
                    type="text"
                    className="input mt-2"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Serial No <span className="text-red-500">*</span>
                </label>
                {!isOtherSelected && selectedCustomer ? (
                  <select
                    className="input"
                    value={formData.customerId}
                    onChange={handleSerialChange}
                    required
                  >
                    <option value="">Select Serial No</option>
                    {selectedCustomer.serials?.map((s, idx) => (
                      <option key={idx} value={s.serial_no}>{s.serial_no}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="input"
                    placeholder="CUS-1XXXX"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Unique ID
                </label>
                <input
                  type="text"
                  value={formData.uniqueId}
                  onChange={(e) =>
                    setFormData({ ...formData, uniqueId: e.target.value })
                  }
                  className="input"
                  placeholder="Enter Unique ID"
                  readOnly={!isOtherSelected && !!selectedCustomer}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                {!isOtherSelected && selectedCustomer ? (
                  <select
                    className="input"
                    value={formData.contactName}
                    onChange={handleContactChange}
                    required
                  >
                    <option value="">Select Contact Person</option>
                    {selectedCustomer.contacts?.map((c, idx) => (
                      <option key={idx} value={c.contact_name}>{c.contact_name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="input"
                    placeholder="Enter contact person"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="input"
                  placeholder="10-digit mobile number"
                  required
                  readOnly={!isOtherSelected && !!selectedCustomer && formData.contactName !== ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input"
                  placeholder="customer@company.com"
                  required
                  readOnly={!isOtherSelected && !!selectedCustomer && formData.contactName !== ""}
                />
              </div>
            </div>
          </div>


          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Engineer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Assigned Engineer
                </label>
                <input
                  type="text"
                  className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400"
                  value={formData.assignedEngineer}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Engineer Phone
                </label>
                <input
                  type="tel"
                  className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400"
                  value={formData.engineerPhone}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Engineer Email
                </label>
                <input
                  type="email"
                  className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400"
                  value={formData.engineerEmail}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Issue Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Issue Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.issueSubject}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      issueSubject: e.target.value,
                    })
                  }
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  className="input"
                  value={formData.issueDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      issueDescription: e.target.value,
                    })
                  }
                  placeholder="Detailed description of the issue, steps to reproduce, and any relevant information..."
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    OEM / TAC Involved
                  </label>
                  <select
                    value={formData.oemTacInvolved}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oemTacInvolved: e.target.value,
                      })
                    }
                    className="input"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    TAC Case Number
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.tacCaseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tacCaseNumber: e.target.value,
                      })
                    }
                    placeholder="TAC case reference (if any)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resolution</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Engineer Remarks
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.engineerRemarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      engineerRemarks: e.target.value,
                    })
                  }
                  placeholder="Engineer’s comments and observations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Problem Resolution
                </label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.problemResolution}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      problemResolution: e.target.value,
                    })
                  }
                  placeholder="How the issue was resolved..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Attachment
                  </label>
                  <div className="flex items-center gap-2">
                    <label className={`cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Uploading...' : 'Choose File'}
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            attachment: e.target.files[0],
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </label>

                    {formData.attachment && !isSubmitting ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {formData.attachment.name}
                      </span>
                    ) : !isSubmitting ? (
                      <span className="text-xs text-gray-400">No file chosen</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Reference URL(s)
                  </label>
                  <div className="space-y-2">
                    {(formData.referenceUrls || []).map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="url"
                          className="input flex-1"
                          value={url}
                          onChange={(e) => {
                            const next = [...formData.referenceUrls];
                            next[idx] = e.target.value;
                            setFormData({ ...formData, referenceUrls: next });
                          }}
                          placeholder="https://example.com/reference"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...formData.referenceUrls];
                            next.splice(idx, 1);
                            setFormData({ ...formData, referenceUrls: next.length ? next : [""] });
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-red-300 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 transition-colors"
                          aria-label="Remove URL"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...(formData.referenceUrls || [])];
                            next.splice(idx + 1, 0, "");
                            setFormData({ ...formData, referenceUrls: next });
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-primary-300 text-primary-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-900/20 transition-colors"
                          aria-label="Add URL"
                          title="Add URL"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-servicenow-light rounded-xl border dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Ticket Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Open Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.openDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      openDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Close Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.closeDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      closeDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg"
            >
              <Save className="w-4 h-4" />
              Create Ticket
            </button>

            <button
              type="button"
              onClick={() => navigate("/engineer/dashboard")}
              className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </EngineerLayout>
  );
}
