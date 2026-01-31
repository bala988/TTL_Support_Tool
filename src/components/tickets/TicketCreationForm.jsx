import { useState } from "react";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import EngineerLayout from "../common/EngineerLayout";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function TicketCreationForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    severity: "Medium",
    ticketType: "Incident",
    technologyDomain: "Network Security",
    customerName: "",
    customerId: "",
    tsgId: "",
    cspId: "",
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
    referenceUrl: "",
    openDate: new Date().toISOString().split("T")[0],
    closeDate: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      data.append('severity', formData.severity);
      data.append('ticket_type', formData.ticketType);
      data.append('technology_domain', formData.technologyDomain);
      data.append('customer_name', formData.customerName);
      data.append('customer_serial_no', formData.customerId);
      data.append('tsg_id', formData.tsgId);
      data.append('csp_id', formData.cspId);
      data.append('contact_name', formData.contactName);
      data.append('contact_phone', formData.phone);
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
      data.append('reference_url', formData.referenceUrl);
      data.append('open_date', formData.openDate);
      data.append('close_date', formData.closeDate);
      
      const userId = localStorage.getItem("userId");
      if (userId) {
        data.append('created_by', userId);
      }

      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/create`, {
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
              ticket_id: result.ticketId || "Pending",
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
        navigate("/engineer/dashboard");
      } else {
        toast.error("Error creating ticket: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error creating ticket");
    }
  };

  return (
    <EngineerLayout>
      <div className="p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/engineer/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Create New Ticket
          </h1>
          <p className="text-gray-600 mt-2">
            Fill in the details to create a support ticket
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
              Ticket Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <select
                  className="input mb-2"
                  value={['Hexaware', 'Collabera', 'Swiggy', 'Groww', 'Freshworks', 'Mpl', 'vishwa samudra', 'flipkart', 'forcepoint', 'f5'].includes(formData.customerName) ? formData.customerName : (formData.customerName ? 'Others' : '')}
                  onChange={(e) => {
                    if (e.target.value === 'Others') {
                      setFormData({ ...formData, customerName: 'Others' });
                    } else {
                      setFormData({ ...formData, customerName: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="">Select Customer</option>
                  <option value="Hexaware">Hexaware</option>
                  <option value="Collabera">Collabera</option>
                  <option value="Swiggy">Swiggy</option>
                  <option value="Groww">Groww</option>
                  <option value="Freshworks">Freshworks</option>
                  <option value="MPL">MPL</option>
                  <option value="Vishwa Samudra">Vishwa Samudra</option>
                  <option value="flipkart">flipkart</option>
                  {/* <option value="forcepoint">forcepoint</option>
                  <option value="f5">f5</option> */}
                  <option value="Others">Others</option>
                </select>
                {(!['Hexaware', 'Collabera', 'Swiggy', 'Groww', 'Freshworks', 'Mpl', 'vishwa samudra', 'flipkart', ''].includes(formData.customerName) || formData.customerName === 'Others') && (
                  <input
                    type="text"
                    className="input"
                    value={formData.customerName === 'Others' ? '' : formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder="Enter customer name"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  placeholder="CUS-1XXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TSG ID
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.tsgId}
                  onChange={(e) =>
                    setFormData({ ...formData, tsgId: e.target.value })
                  }
                  placeholder="Enter TSG ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSP ID
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.cspId}
                  onChange={(e) =>
                    setFormData({ ...formData, cspId: e.target.value })
                  }
                  placeholder="Enter CSP ID"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="Enter contact person"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+ (555) 030-0200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contact@tutelartechlabs.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Engineer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Engineer
                </label>
                <input
                  type="text"
                  className="input bg-gray-100 cursor-not-allowed"
                  value={formData.assignedEngineer}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engineer Phone
                </label>
                <input
                  type="tel"
                  className="input bg-gray-100 cursor-not-allowed"
                  value={formData.engineerPhone}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engineer Email
                </label>
                <input
                  type="email"
                  className="input bg-gray-100 cursor-not-allowed"
                  value={formData.engineerEmail}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Issue Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resolution</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachment
                  </label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Choose File
                    </label>
                    <span className="text-sm text-gray-500">
                      {formData.attachment
                        ? formData.attachment.name
                        : "No file chosen"}
                    </span>
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
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference URL
                  </label>
                  <input
                    type="url"
                    className="input"
                    value={formData.referenceUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referenceUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com/reference"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Ticket Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg"
            >
              <Save className="w-4 h-4" />
              Create Ticket
            </button>

            <button
              type="button"
              onClick={() => navigate("/engineer/dashboard")}
              className="px-6 py-3 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </EngineerLayout>
  );
}
