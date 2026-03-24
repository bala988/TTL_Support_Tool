import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from 'react-hot-toast';
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
  StickyNote,
  Paperclip,
} from "lucide-react";

export default function TicketDetailsView() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Dynamic API URL handling for local network access
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  const [isEditing, setIsEditing] = useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const userRole = localStorage.getItem("userRole") || "engineer";
  const currentUserName = localStorage.getItem("userName");
  const currentUserId = localStorage.getItem("userId");

  const [ticket, setTicket] = useState(null);
  const [newUpdate, setNewUpdate] = useState("");
  const [isRoughNotesEditing, setIsRoughNotesEditing] = useState(false);
  const [hasSharedAccess, setHasSharedAccess] = useState(false);
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [feedbackPreviewUrl, setFeedbackPreviewUrl] = useState(null);
  const [isUploadingFeedback, setIsUploadingFeedback] = useState(false);

  const [initialStatus, setInitialStatus] = useState("");
  const [openDuration, setOpenDuration] = useState("");
  const [customerPendingDuration, setCustomerPendingDuration] = useState("");

  const fetchTicketDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${id}`);
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
          roughNotes: t.rough_notes || "",
          openDate: t.open_date,
          closeDate: t.close_date,
          timeline: timelineData,
          attachments: data.attachments || []
        });
        setInitialStatus(t.status);
      } else {
        console.error("Failed to fetch ticket");
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  // Check shared access
  useEffect(() => {
    const checkSharedAccess = async () => {
        if (!currentUserId || !id) return;
        try {
            const response = await fetch(`${API_URL}/api/approvals/my/${currentUserId}`);
            if (response.ok) {
                const approvals = await response.json();
                // Check if current ticket ID exists in approvals with access=true (1)
                // Note: database might return 1/0 for boolean, or true/false
                const hasAccess = approvals.some(a => 
                    String(a.ticket_id) === String(id) && (a.access === 1 || a.access === true)
                );
                setHasSharedAccess(hasAccess);
            }
        } catch (error) {
            console.error("Error checking shared access:", error);
        }
    };
    checkSharedAccess();
  }, [id, currentUserId]);

  // Timer Logic
  useEffect(() => {
    if (!ticket) return;

    const calculateTimers = () => {
      const now = new Date();
      
      const getTimestamp = (dateStr) => {
        if (!dateStr) return 0;
        if (dateStr instanceof Date) {
          const t = dateStr.getTime();
          return isNaN(t) ? 0 : t;
        }
        if (typeof dateStr === 'number') {
          return dateStr;
        }
        const s = String(dateStr).trim();
        if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
          const d = new Date(s);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
          // Assume UTC if coming from backend MySQL DATETIME
          const d = new Date(s.replace(' ', 'T') + 'Z');
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        const localeMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
        if (localeMatch) {
          const mm = parseInt(localeMatch[1], 10) - 1;
          const dd = parseInt(localeMatch[2], 10);
          const yyyy = parseInt(localeMatch[3], 10);
          let hh = parseInt(localeMatch[4], 10);
          const min = parseInt(localeMatch[5], 10);
          const sec = localeMatch[6] ? parseInt(localeMatch[6], 10) : 0;
          const ampm = localeMatch[7].toUpperCase();
          if (ampm === 'PM' && hh < 12) hh += 12;
          if (ampm === 'AM' && hh === 12) hh = 0;
          const d = new Date(yyyy, mm, dd, hh, min, sec);
          const t = d.getTime();
          return isNaN(t) ? 0 : t;
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };

      // 1. Ticket Open Duration
      if (ticket.openDate) {
        const openTime = getTimestamp(ticket.openDate);
        if (openTime > 0) {
            let endTime = now.getTime();
            // If ticket is closed, prefer closeDate; fall back to timeline "Closed" event if available
            if (ticket.status === 'Closed') {
              if (ticket.closeDate) {
                const closeTime = getTimestamp(ticket.closeDate);
                if (closeTime > 0) {
                  endTime = closeTime;
                }
              } else if (Array.isArray(ticket.timeline)) {
                const closedEvent = [...ticket.timeline]
                  .reverse()
                  .find(e => String(e.event || '').includes('Status changed to Closed'));
                if (closedEvent) {
                  const closedTs = getTimestamp(closedEvent.date);
                  if (closedTs > 0) endTime = closedTs;
                }
              }
            }

            let diff = endTime - openTime;
            // Handle case where openTime is in the future (e.g. server/client time mismatch)
            if (diff < 0) {
                // If the difference is small (e.g. < 1 min), treat as 0. 
                // If it's large, it might be a timezone issue. 
                // We'll clamp to 0 to avoid negative durations.
                diff = 0;
            }
            setOpenDuration(formatDuration(diff));
        }
      }

      // 2. Pending from Customer Duration
      let pendingTime = 0;
      let lastPendingStart = null;
      
      // Sort timeline by date
      const sortedTimeline = [...ticket.timeline].sort((a, b) => getTimestamp(a.date) - getTimestamp(b.date));
      
      sortedTimeline.forEach((entry) => {
        const entryTime = getTimestamp(entry.date);
        if (entryTime === 0) return;

        if (entry.event.includes("Status changed to Pending from Customer")) {
          lastPendingStart = entryTime;
        } else if (lastPendingStart && entry.event.includes("Status changed to")) {
          // Status changed FROM Pending from Customer to something else
          pendingTime += entryTime - lastPendingStart;
          lastPendingStart = null;
        }
      });

      // Finalize any pending segment robustly:
      // - If still pending, add until now
      // - If closed and we have closeDate, add until closeDate
      // - Otherwise, add until now as a safe fallback
      if (lastPendingStart) {
        let endTs = now.getTime();
        if (ticket.status === 'Closed' && ticket.closeDate) {
          const c = getTimestamp(ticket.closeDate);
          if (c > 0) endTs = c;
        }
        pendingTime += Math.max(0, endTs - lastPendingStart);
      }

      setCustomerPendingDuration(formatDuration(pendingTime));
    };

    const interval = setInterval(calculateTimers, 1000); // Update every second
    calculateTimers(); // Initial call

    return () => clearInterval(interval);
  }, [ticket]);

  const formatDuration = (ms) => {
    if (ms <= 0) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "In Progress":
        return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case "Pending from Customer":
        return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const handleSave = async () => {
    try {
      const now = new Date();
      const nowStr = now.toISOString();

      let eventMsg = "Ticket details updated";
      if (ticket.status !== initialStatus) {
        eventMsg = `Status changed to ${ticket.status}`;
      }
      if (selectedFile) {
        eventMsg += " (Attachment added)";
      }

      const timelineEntry = {
        date: nowStr,
        event: eventMsg,
        user: currentUserName,
        type: "update"
      };

      const updatedTimeline = [...ticket.timeline, timelineEntry];

      const formData = new FormData();
      formData.append('status', ticket.status);
      formData.append('severity', ticket.severity);
      formData.append('issue_subject', ticket.issueSubject);
      formData.append('issue_description', ticket.issueDescription);
      formData.append('engineer_remarks', ticket.engineerRemarks);
      formData.append('problem_resolution', ticket.problemResolution);
      formData.append('rough_notes', ticket.roughNotes);
      formData.append('timeline', JSON.stringify(updatedTimeline));
      
      // Ensure close_date is sent if status is Closed
      if (ticket.status === 'Closed') {
          // If local ticket already has closeDate (from immediate status change or existing), use it.
          // Otherwise use nowStr.
          const closeDateToSend = ticket.closeDate || nowStr;
          formData.append('close_date', closeDateToSend);
      }

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      // Exact logic from handleQuickResolve:
      // If closing, we want to ensure the frontend reflects the close time immediately and permanently.
      // Although the backend handles close_date, setting it here ensures consistency with the optimistic update approach.
      let finalTicketState = { ...ticket, timeline: updatedTimeline };
      if (ticket.status === 'Closed' && !ticket.closeDate) {
          finalTicketState.closeDate = nowStr;
      }

      const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        toast.success("Ticket updated successfully!");
        setIsEditing(false);
        setSelectedFile(null);
        
        // Update local state immediately like handleQuickResolve
        setTicket(finalTicketState);
        setInitialStatus(ticket.status);

        // DO NOT refresh from backend immediately to avoid flickering/timezone issues.
        // The local state is authoritative for the user who made the change.
        // await fetchTicketDetails();
      } else {
        toast.error("Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Error updating ticket");
    }
  };

  const handleStatusChange = (newStatus) => {
    const now = new Date().toISOString();
    // Optimistically update status and closeDate
    setTicket((prev) => {
      const updated = {
        ...prev,
        status: newStatus
      };
      
      if (newStatus === 'Closed') {
         // If closing, set closeDate if not already set
         if (!updated.closeDate) {
             updated.closeDate = now;
         }
      } else {
         // If re-opening (not Closed), clear closeDate
         updated.closeDate = null;
      }
      return updated;
    });
  };

  // Auto-refresh logic for shared tickets
  useEffect(() => {
    if (isEditing) return; // Don't refresh while editing to avoid losing changes

    const pollInterval = setInterval(() => {
        fetchTicketDetails();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [id, isEditing]); // Re-create interval if id or isEditing changes

  const handleQuickResolve = async () => {
    if (!window.confirm("Are you sure you want to mark this ticket as resolved?")) return;
    
    const now = new Date().toISOString();

    const updatedTicket = {
      ...ticket,
      status: "Closed",
      closeDate: now,
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
      const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: "Closed",
          severity: ticket.severity,
          issue_subject: ticket.issueSubject,
          issue_description: ticket.issueDescription,
          engineer_remarks: ticket.engineerRemarks,
          problem_resolution: ticket.problemResolution,
          rough_notes: ticket.roughNotes,
          close_date: now,
          timeline: updatedTicket.timeline
        })
      });

      if (response.ok) {
        toast.success("Ticket marked as resolved! ✅");
      } else {
        toast.error("Failed to update ticket status");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Error updating ticket");
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;

    const now = new Date().toISOString();

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
      const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             status: ticket.status,
             severity: ticket.severity,
             issue_subject: ticket.issueSubject,
             issue_description: ticket.issueDescription,
             engineer_remarks: ticket.engineerRemarks,
             problem_resolution: ticket.problemResolution,
             rough_notes: ticket.roughNotes,
             timeline: updatedTimeline
          })
      });
      
      if (!response.ok) {
        toast.error("Failed to save update");
        // Revert? (Not strictly necessary for this demo, but good practice)
      }
    } catch (e) {
       console.error("Error saving update:", e);
       toast.error("Error saving update");
    }
  };

  const handleSaveRoughNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: ticket.status,
          severity: ticket.severity,
          issue_subject: ticket.issueSubject,
          issue_description: ticket.issueDescription,
          engineer_remarks: ticket.engineerRemarks,
          problem_resolution: ticket.problemResolution,
          rough_notes: ticket.roughNotes
        })
      });

      if (response.ok) {
        setIsRoughNotesEditing(false);
        toast.success("Rough notes saved as draft");
      } else {
        toast.error("Failed to save rough notes");
      }
    } catch (error) {
       console.error("Error saving rough notes:", error);
       toast.error("Error saving rough notes");
    }
  };

  const [engineers, setEngineers] = useState([]);
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/users`);
        const users = await res.json();
        const engs = Array.isArray(users) ? users.filter(u => (u.role || '').toLowerCase() === 'engineer') : [];
        setEngineers(engs);
      } catch (e) {
        console.error("Failed to load engineers:", e);
      }
    };
    fetchEngineers();
  }, []);

  const handleShare = async (engineer) => {
    try {
      const target = engineers.find(e => e.name === engineer);
      if (!target) {
        toast.error("Engineer not found");
        return;
      }
      const response = await fetch(`${API_URL}/api/approvals/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, requesterId: target.id })
      });

      if (response.ok) {
        setTicket((prev) => ({
          ...prev,
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
              event: `Shared with ${engineer}`,
              user: currentUserName,
              type: "assign",
            },
          ],
        }));
        setShowTransferDropdown(false);
        toast.success(`Access shared with ${engineer}`);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to share access");
      }
    } catch (error) {
      console.error("Error sharing access:", error);
      toast.error("Error sharing access");
    }
  };

  const availableEngineers = engineers.map(e => e.name);

  if (loading) {
    return <div className="p-8 text-center">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-600">Ticket not found</div>;
  }

  const canEdit = userRole === "admin" || (userRole === "engineer" && ticket.assignedEngineer === currentUserName) || hasSharedAccess;
  const canShare = userRole === "admin" || (userRole === "engineer" && ticket.assignedEngineer === currentUserName);


  return (
    <EngineerLayout>
      <div className="p-8 w-full" onClick={() => setShowTransferDropdown(false)}>
        <button
          onClick={() => navigate(userRole === 'admin' ? "/admin/dashboard" : "/engineer/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{ticket.ticketNumber || ticket.id}</h1>
          <p className="text-gray-600 mt-2 dark:text-slate-400">{ticket.issueSubject}</p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            {canShare && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTransferDropdown(!showTransferDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-servicenow-dark text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-servicenow"
              >
                <ArrowRightCircle className="w-4 h-4" />
                Share
              </button>

              {showTransferDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-servicenow-light rounded-lg shadow-lg border border-gray-100 dark:border-servicenow-dark z-10 py-1">
                  {availableEngineers.map((engineer) => (
                    <button
                      key={engineer}
                      onClick={() => handleShare(engineer)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-servicenow-dark"
                    >
                      {engineer}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-servicenow-dark text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-servicenow"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
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
          {/* Timers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Ticket Open Duration</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{openDuration}</p>
                </div>
             </div>

             <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-4 rounded-lg flex items-center gap-3">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">Pending from Customer</p>
                  <p className="text-xl font-bold text-orange-900 dark:text-orange-100">{customerPendingDuration}</p>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                <option value="Pending from Customer">Pending from Customer</option>
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

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <span>Opened</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {ticket.openDate}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Ticket Type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {ticket.type}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Technology Domain
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {ticket.technologyDomain}
                </p>
              </div>
            </div>
          </div>

           {/* Issue Details */}
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Issue Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Subject</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={ticket.issueSubject}
                    onChange={(e) => setTicket({ ...ticket, issueSubject: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{ticket.issueSubject}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    value={ticket.issueDescription}
                    onChange={(e) => setTicket({ ...ticket, issueDescription: e.target.value })}
                    rows={4}
                    className="input resize-none"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{ticket.issueDescription}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">OEM/TAC Involved</label>
                  <p className="text-gray-900 dark:text-white">{ticket.oemTacInvolved}</p>
                </div>
                {ticket.oemTacInvolved === 'Yes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">TAC Case Number</label>
                    <p className="text-gray-900 dark:text-white font-mono">{ticket.tacCaseNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Attachments
            </h2>
            <div className="space-y-4">
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="space-y-2">
                  {ticket.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {(file.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={file.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                          View
                        </a>
                        {canEdit && (
                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this attachment?")) return;
                              try {
                                const resp = await fetch(`${API_URL}/api/tickets/${ticket.id}/attachments/${file.id}`, {
                                  method: 'DELETE'
                                });
                                if (resp.ok) {
                                  setTicket(prev => ({
                                    ...prev,
                                    attachments: prev.attachments.filter(a => a.id !== file.id)
                                  }));
                                  toast.success("Attachment deleted");
                                } else {
                                  const data = await resp.json().catch(() => ({}));
                                  toast.error(data.message || "Failed to delete attachment");
                                }
                              } catch (e) {
                                console.error("Delete attachment error:", e);
                                toast.error("Error deleting attachment");
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400 italic">No attachments</p>
              )}

              {isEditing && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Add New Attachment
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 dark:text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      dark:file:bg-indigo-900/30 dark:file:text-indigo-300
                    "
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

        {ticket.status === 'Closed' && (
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Customer Feedback Proof
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Attach Proof (PDF/Image)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setFeedbackFile(f || null);
                    if (feedbackPreviewUrl) {
                      try { URL.revokeObjectURL(feedbackPreviewUrl); } catch (_) {}
                    }
                    setFeedbackPreviewUrl(f ? URL.createObjectURL(f) : null);
                  }}
                  className="block w-full text-sm text-gray-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    dark:file:bg-indigo-900/30 dark:file:text-indigo-300
                  "
                />
              </div>
              {feedbackFile && feedbackPreviewUrl && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Preview</p>
                  {feedbackFile.type?.startsWith('image/') ? (
                    <img src={feedbackPreviewUrl} alt="Feedback Preview" className="max-h-64 rounded border" />
                  ) : feedbackFile.type === 'application/pdf' ? (
                    <embed src={feedbackPreviewUrl} type="application/pdf" className="w-full h-64 border rounded" />
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-slate-400">Preview not available for this file type.</p>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!feedbackFile) {
                      toast.error('Please choose a file first');
                      return;
                    }
                    try {
                      setIsUploadingFeedback(true);
                      const nowStr = new Date().toISOString();
                      const timelineEntry = {
                        date: nowStr,
                        event: "Feedback proof attached",
                        user: currentUserName,
                        type: "update"
                      };
                      const updatedTimeline = [...ticket.timeline, timelineEntry];
                      const fd = new FormData();
                      fd.append('status', ticket.status);
                      fd.append('severity', ticket.severity);
                      fd.append('issue_subject', ticket.issueSubject);
                      fd.append('issue_description', ticket.issueDescription);
                      fd.append('engineer_remarks', ticket.engineerRemarks);
                      fd.append('problem_resolution', ticket.problemResolution);
                      fd.append('rough_notes', ticket.roughNotes);
                      fd.append('timeline', JSON.stringify(updatedTimeline));
                      fd.append('attachment', feedbackFile);
                      const resp = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
                        method: 'PUT',
                        body: fd
                      });
                      if (resp.ok) {
                        toast.success('Proof uploaded');
                        setFeedbackFile(null);
                        if (feedbackPreviewUrl) {
                          try { URL.revokeObjectURL(feedbackPreviewUrl); } catch (_) {}
                          setFeedbackPreviewUrl(null);
                        }
                        await fetchTicketDetails();
                      } else {
                        const data = await resp.json().catch(() => ({}));
                        toast.error(data.message || 'Failed to upload');
                      }
                    } catch (e) {
                      console.error(e);
                      toast.error('Error uploading proof');
                    } finally {
                      setIsUploadingFeedback(false);
                    }
                  }}
                  disabled={isUploadingFeedback || !feedbackFile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUploadingFeedback ? 'Uploading...' : 'Upload Proof'}
                </button>
              </div>
            </div>
          </div>
        )}

          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Resolution</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Engineer Remarks
              </p>
              {isEditing ? (
                <textarea
                  value={ticket.engineerRemarks}
                  onChange={(e) => setTicket({ ...ticket, engineerRemarks: e.target.value })}
                  rows={3}
                  className="input resize-none text-sm mt-1"
                  placeholder="Add remarks..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.engineerRemarks}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Problem Resolution
              </p>
              {isEditing ? (
                <textarea
                  value={ticket.problemResolution}
                  onChange={(e) => setTicket({ ...ticket, problemResolution: e.target.value })}
                  rows={3}
                  className="input resize-none text-sm mt-1"
                  placeholder="Describe resolution..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                  {ticket.problemResolution}
                </p>
              )}
            </div>
          </div>

          {/* Updates & Comments */}
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Updates & Comments
             </h2>
             <div className="space-y-4">
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  placeholder="Add a new update or comment..."
                  rows={3}
                  className="input resize-none"
                />
                <div className="flex justify-end">
                   <button
                     onClick={handleAddUpdate}
                     disabled={!newUpdate.trim()}
                     className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                   >
                     Post Update
                   </button>
                </div>
             </div>
          </div>

         {/* Timeline */}
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-700 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.event}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      {entry.date} • {entry.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Customer Info
              </h2>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Company
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Customer ID
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.customerId}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Contact Person
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.contactName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Phone
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Email
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">{ticket.email}</p>
              </div>
            </div>
          </div>

          {/* Engineer Info */}
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Assigned Engineer
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-lg">
                    {ticket.assignedEngineer.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {ticket.assignedEngineer}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Technical Support Engineer
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 mt-3">
                <div className="grid grid-cols-1 gap-3">
                   <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{ticket.engineerEmail}</p>
                   </div>
                   <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{ticket.engineerPhone}</p>
                   </div>
                </div>
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
              onClick={() => toast.info("Escalation flow not implemented in this demo")}
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

          {/* Rough Sheet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-indigo-600" />
              Rough Sheet
            </h2>
            
            {isRoughNotesEditing ? (
              <textarea
                value={ticket.roughNotes}
                onChange={(e) => setTicket({ ...ticket, roughNotes: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm"
                placeholder="Type your notes here..."
              />
            ) : (
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[150px] text-sm text-gray-700 whitespace-pre-wrap break-words">
                {ticket.roughNotes || "No notes yet..."}
              </div>
            )}

            <div className="flex gap-2">
               {isRoughNotesEditing ? (
                 <button
                   onClick={handleSaveRoughNotes}
                   className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                 >
                   Save Draft
                 </button>
               ) : (
                 <button
                   onClick={() => setIsRoughNotesEditing(true)}
                   className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                 >
                   Edit
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </EngineerLayout>
  );
}
