import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineerLayout from "../common/EngineerLayout";
import {
  ArrowLeft,
  Edit2,
  Save,
  Clock,
  User,
  Building,
  AlertCircle,
  CheckCircle2,
  ArrowRightCircle,
} from "lucide-react";

export default function TicketDetailsView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isEditing, setIsEditing] = useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem("userRole") || "engineer";
  const currentUserName = localStorage.getItem("userName");

  const [ticket, setTicket] = useState(null);
  const [newUpdate, setNewUpdate] = useState("");

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/tickets/${id}`);
        const data = await response.json();

        if (response.ok) {
          const t = data.ticket;
          // Map DB fields to component state
          let timelineData = [];
          if (t.timeline) {
            timelineData = typeof t.timeline === 'string' ? JSON.parse(t.timeline) : t.timeline;
          } else {
            // Fallback for old tickets
            timelineData = [
              {
                date: t.open_date ? new Date(t.open_date).toLocaleString() : "",
                event: "Ticket created",
                user: "System",
                type: "create",
              }
            ];
          }

          setTicket({
            id: t.id,
            ticketNumber: t.ticket_number,
            severity: t.severity,
            status: t.status,
            type: t.ticket_type,
            technologyDomain: t.technology_domain,
            customerName: t.customer_name,
            customerId: t.customer_serial_no, // Using serial no as ID for now
            contactName: t.contact_name,
            phone: t.contact_phone,
            email: t.contact_email,
            assignedEngineer: t.assigned_engineer,
            engineerPhone: t.engineer_phone,
            engineerEmail: t.engineer_email,
            issueSubject: t.issue_subject,
            issueDescription: t.issue_description,
            oemTacInvolved: t.oem_tac_involved,
            tacCaseNumber: t.tac_case_number,
            engineerRemarks: t.engineer_remarks || "No remarks yet",
            problemResolution: t.problem_resolution || "Pending resolution",
            openDate: t.open_date ? new Date(t.open_date).toLocaleDateString() : "",
            closeDate: t.close_date,
            timeline: timelineData,
            attachments: data.attachments || []
          });
        } else {
          console.error("Failed to fetch ticket");
        }
      } catch (error) {
        console.error("Error fetching ticket details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "In Progress":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleSave = async () => {
    try {
      const now = new Date().toLocaleString("en-US", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: true,
      });

      const timelineEntry = {
        date: now,
        event: "Ticket details updated",
        user: currentUserName,
        type: "update"
      };

      const updatedTimeline = [...ticket.timeline, timelineEntry];

      const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: ticket.status,
          severity: ticket.severity,
          issue_subject: ticket.issueSubject,
          issue_description: ticket.issueDescription,
          engineer_remarks: ticket.engineerRemarks,
          problem_resolution: ticket.problemResolution,
          timeline: updatedTimeline
        })
      });

      if (response.ok) {
        setTicket(prev => ({ ...prev, timeline: updatedTimeline }));
        setIsEditing(false);
        alert("Ticket updated successfully!");
      } else {
        alert("Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Error updating ticket");
    }
  };

  const handleStatusChange = (newStatus) => {
    setTicket((prev) => ({
      ...prev,
      status: newStatus,
    }));
  };

  const handleQuickResolve = async () => {
    if (!window.confirm("Are you sure you want to mark this ticket as resolved?")) return;
    
    const now = new Date().toLocaleString("en-US", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    const updatedTicket = {
      ...ticket,
      status: "Closed",
      timeline: [
        ...ticket.timeline,
        {
          date: now,
          event: "Status changed to Closed",
          user: currentUserName,
          type: "update",
        },
      ],
    };

    setTicket(updatedTicket);

    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: "Closed",
          severity: ticket.severity,
          issue_subject: ticket.issueSubject,
          issue_description: ticket.issueDescription,
          engineer_remarks: ticket.engineerRemarks,
          problem_resolution: ticket.problemResolution
        })
      });

      if (response.ok) {
        alert("Ticket marked as resolved!");
      } else {
        alert("Failed to update ticket status");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Error updating ticket");
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;

    const now = new Date().toLocaleString("en-US", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    const updateEntry = {
      date: now,
      event: newUpdate,
      user: currentUserName,
      type: "update"
    };

    const updatedTimeline = [...ticket.timeline, updateEntry];

    // Optimistic update
    setTicket(prev => ({ ...prev, timeline: updatedTimeline }));
    setNewUpdate("");

    try {
      // Call update API
      const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             status: ticket.status,
             severity: ticket.severity,
             issue_subject: ticket.issueSubject,
             issue_description: ticket.issueDescription,
             engineer_remarks: ticket.engineerRemarks,
             problem_resolution: ticket.problemResolution,
             timeline: updatedTimeline
          })
      });
      
      if (!response.ok) {
        alert("Failed to save update");
        // Revert? (Not strictly necessary for this demo, but good practice)
      }
    } catch (e) {
       console.error("Error saving update:", e);
       alert("Error saving update");
    }
  };

  const handleTransfer = async (engineer) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}/transfer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_engineer: engineer })
      });

      if (response.ok) {
        setTicket((prev) => ({
          ...prev,
          assignedEngineer: engineer,
          timeline: [
            ...prev.timeline,
            {
              date: new Date().toLocaleString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              event: `Transferred to ${engineer}`,
              user: currentUserName,
              type: "assign",
            },
          ],
        }));
        setShowTransferDropdown(false);
        alert(`Ticket transferred to ${engineer}`);
      } else {
        alert("Failed to transfer ticket");
      }
    } catch (error) {
      console.error("Error transferring ticket:", error);
      alert("Error transferring ticket");
    }
  };

  const availableEngineers = [
    "Sarah Johnson",
    "Mike Chen",
    "Alex Rodriguez",
    "Emily White",
    "David Kim",
  ];

  if (loading) {
    return <div className="p-8 text-center">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-600">Ticket not found</div>;
  }

  const canEdit = userRole === "admin" || (userRole === "engineer" && ticket.assignedEngineer === currentUserName);


  return (
    <EngineerLayout>
      <div className="p-8 w-full" onClick={() => setShowTransferDropdown(false)}>
        <button
          onClick={() => navigate(userRole === 'admin' ? "/admin/dashboard" : "/engineer/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{ticket.ticketNumber || ticket.id}</h1>
          <p className="text-gray-600 mt-2">{ticket.issueSubject}</p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTransferDropdown(!showTransferDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowRightCircle className="w-4 h-4" />
                Transfer
              </button>

              {showTransferDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                  {availableEngineers.map((engineer) => (
                    <button
                      key={engineer}
                      onClick={() => handleTransfer(engineer)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {engineer}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="input"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                    ticket.severity
                  )}`}
                >
                  {ticket.severity}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Opened</span>
                <span className="font-medium text-gray-900">
                  {ticket.openDate}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Ticket Type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {ticket.type}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Technology Domain
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {ticket.technologyDomain}
                </p>
              </div>
            </div>
          </div>

           {/* Issue Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-600" />
              Issue Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={ticket.issueSubject}
                    onChange={(e) => setTicket({ ...ticket, issueSubject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                ) : (
                  <p className="text-gray-900">{ticket.issueSubject}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    value={ticket.issueDescription}
                    onChange={(e) => setTicket({ ...ticket, issueDescription: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  />
                ) : (
                  <p className="text-gray-900">{ticket.issueDescription}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OEM/TAC Involved</label>
                  <p className="text-gray-900">{ticket.oemTacInvolved}</p>
                </div>
                {ticket.oemTacInvolved === 'Yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TAC Case Number</label>
                    <p className="text-gray-900 font-mono">{ticket.tacCaseNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Resolution</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Engineer Remarks
              </p>
              {isEditing ? (
                <textarea
                  value={ticket.engineerRemarks}
                  onChange={(e) => setTicket({ ...ticket, engineerRemarks: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
                  placeholder="Add remarks..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700">
                  {ticket.engineerRemarks}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Problem Resolution
              </p>
              {isEditing ? (
                <textarea
                  value={ticket.problemResolution}
                  onChange={(e) => setTicket({ ...ticket, problemResolution: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
                  placeholder="Describe resolution..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700">
                  {ticket.problemResolution}
                </p>
              )}
            </div>
          </div>

          {/* Updates & Comments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                Updates & Comments
             </h2>
             <div className="space-y-4">
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="Add a new update or comment..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
                <div className="flex justify-end">
                   <button
                     onClick={handleAddUpdate}
                     disabled={!newUpdate.trim()}
                     className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                   >
                     Post Update
                   </button>
                </div>
             </div>
          </div>

         {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Ticket Timeline
            </h2>
            <div className="space-y-4">
              {ticket.timeline.map((entry, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.type === 'create' ? 'bg-blue-500' :
                      entry.type === 'assign' ? 'bg-purple-500' :
                      entry.type === 'update' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />
                    {index !== ticket.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-gray-900">{entry.event}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {entry.date} • {entry.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Customer Info
              </h2>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Company
                </p>
                <p className="mt-1 text-gray-900">{ticket.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Customer ID
                </p>
                <p className="mt-1 text-gray-900">{ticket.customerId}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Contact Person
                </p>
                <p className="mt-1 text-gray-900">{ticket.contactName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Phone
                </p>
                <p className="mt-1 text-gray-900">{ticket.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="mt-1 text-gray-900">{ticket.email}</p>
              </div>
            </div>
          </div>

          {/* Engineer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Assigned Engineer
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-lg">
                    {ticket.assignedEngineer.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{ticket.assignedEngineer}</div>
                    <div className="text-sm text-gray-600">Support Engineer</div>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">Phone</div>
                <div className="text-gray-900">{ticket.engineerPhone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="text-gray-900 text-sm break-all">{ticket.engineerEmail}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Quick Actions
            </h2>
            <button
              onClick={handleQuickResolve}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Mark as Resolved
            </button>
            <button
              onClick={() => alert("Escalation flow not implemented in this demo")}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Escalate Ticket
            </button>
            <button
              onClick={() => window.print()}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Print Details
            </button>
          </div>
        </div>
      </div>
      </div>
    </EngineerLayout>
  );
}
