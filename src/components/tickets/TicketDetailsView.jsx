import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from 'react-hot-toast';
import EngineerLayout from "../common/EngineerLayout";
import { getTimestamp, formatDuration } from "../../utils/time";
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
  const [isPendingAssignment, setIsPendingAssignment] = useState(false);

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
          // Live phone/email from users table JOIN (always up-to-date)
          liveEngineerPhone: t.assigned_engineer_phone || null,
          liveEngineerEmail: t.assigned_engineer_email || null,
          issueSubject: t.issue_subject,
          issueDescription: t.issue_description,
          oemTacInvolved: t.oem_tac_involved,
          tacCaseNumber: t.tac_case_number,
          engineerRemarks: t.engineer_remarks || "No remarks yet",
          problemResolution: t.problem_resolution || "Pending resolution",
          roughNotes: t.rough_notes || "",
          referenceUrl: t.reference_url || "",
          openDate: t.open_date,
          closeDate: t.close_date,
          timeline: timelineData,
          attachments: data.attachments || [],
          createdByName: t.created_by_name
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



  const formatIST = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
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
      formData.append('oem_tac_involved', ticket.oemTacInvolved);
      formData.append('tac_case_number', ticket.tacCaseNumber);
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
    if (isEditing || isPendingAssignment || isRoughNotesEditing) return; // Don't refresh while editing, assigning, or editing rough notes

    const pollInterval = setInterval(() => {
      fetchTicketDetails();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [id, isEditing, isPendingAssignment, isRoughNotesEditing]); // Re-create interval if id, isEditing, isPendingAssignment, or isRoughNotesEditing changes

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
      event: "Comment added",
      user: currentUserName,
      type: "update",
      meta: { text: newUpdate }
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
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        setUsersLoading(true);
        const res = await fetch(`${API_URL}/api/auth/users`);
        const users = await res.json();
        const allUsersList = Array.isArray(users) ? users : [];
        setAllUsers(allUsersList);
        const engs = allUsersList.filter(u => (u.role || '').toLowerCase() === 'engineer');
        setEngineers(engs);
      } catch (e) {
        console.error("Failed to load engineers:", e);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchEngineers();
  }, []);
  const availableEngineers = (engineers || []).map(e => e.name);

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

  const handleAssignEngineer = async () => {
    if (!ticket) {
      toast.error("No ticket loaded");
      return;
    }

    if (!ticket.assignedEngineer) {
      toast.error("Please select an engineer");
      return;
    }

    try {
      const resp = await fetch(`${API_URL}/api/tickets/${ticket.id}/transfer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_engineer: ticket.assignedEngineer,
          userName: currentUserName
        })
      });

      if (resp.ok) {
        toast.success("Assigned engineer updated");
        setIsPendingAssignment(false);
        await fetchTicketDetails();
      } else {
        const data = await resp.json().catch(() => ({}));
        toast.error(data.message || "Failed to assign");
      }
    } catch (e) {
      console.error("Error assigning engineer:", e);
      toast.error("Error assigning engineer");
    }
  };

  if (loading || usersLoading) {
    return <div className="p-8 text-center">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-600">Ticket not found</div>;
  }

  const canEdit = userRole === "admin" || (userRole === "engineer" && ticket.assignedEngineer === currentUserName) || hasSharedAccess;
  const canShare = userRole === "admin" || (userRole === "engineer" && ticket.assignedEngineer === currentUserName);

  // Priority: currentEngineer (allUsers) > ticket live field (guaranteed correct by backend)
  const currentEngineer = allUsers.find(e => e.name === ticket.assignedEngineer) || engineers.find(e => e.name === ticket.assignedEngineer);
  const engineerDisplayEmail = currentEngineer?.email || ticket.liveEngineerEmail || "N/A";
  const engineerDisplayPhone = currentEngineer?.phone || ticket.liveEngineerPhone || "";


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
            {ticket.createdByName && (
              <p className="mt-1 text-xs inline-flex items-center px-2 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                Created by: {ticket.createdByName}
              </p>
            )}
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
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Severity
                  </label>
                  {isEditing ? (
                    <select
                      value={ticket.severity}
                      onChange={(e) => setTicket({ ...ticket, severity: e.target.value })}
                      className="input"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                        ticket.severity
                      )}`}
                    >
                      {ticket.severity}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span>Opened</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatIST(ticket.openDate)}
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
                <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Issue Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Subject</label>
                  <p className="text-gray-900 dark:text-white">{ticket.issueSubject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
                  <p className="text-gray-900 dark:text-white">{ticket.issueDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">OEM/TAC Involved</label>
                    {isEditing ? (
                      <select
                        value={ticket.oemTacInvolved}
                        onChange={(e) => setTicket({ ...ticket, oemTacInvolved: e.target.value })}
                        className="input"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">{ticket.oemTacInvolved}</p>
                    )}
                  </div>
                  {ticket.oemTacInvolved === 'Yes' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">TAC Case Number</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={ticket.tacCaseNumber}
                          onChange={(e) => setTicket({ ...ticket, tacCaseNumber: e.target.value })}
                          className="input"
                          placeholder="TAC case reference (if any)"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white font-mono">{ticket.tacCaseNumber}</p>
                      )}
                    </div>
                  )}
                </div>
                {ticket.referenceUrl && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Reference URL(s)</label>
                    <div className="space-y-1">
                      {ticket.referenceUrl.split('|').map((url, idx) => {
                        const trimmed = url.trim();
                        if (!trimmed) return null;
                        const isLink = trimmed.startsWith('http://') || trimmed.startsWith('https://');
                        return (
                          <div key={idx}>
                            {isLink ? (
                              <a
                                href={trimmed}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-primary-400 hover:underline text-sm break-all"
                              >
                                {trimmed}
                              </a>
                            ) : (
                              <p className="text-gray-900 dark:text-white text-sm break-all">{trimmed}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Attachments
              </h2>
              <div className="space-y-4">
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded text-primary-600 dark:text-primary-400">
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
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
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
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      dark:file:bg-primary-900/30 dark:file:text-primary-300
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
                  <Paperclip className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
                          try { URL.revokeObjectURL(feedbackPreviewUrl); } catch (_) { }
                        }
                        setFeedbackPreviewUrl(f ? URL.createObjectURL(f) : null);
                      }}
                      className="block w-full text-sm text-gray-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900/30 dark:file:text-primary-300
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
                              try { URL.revokeObjectURL(feedbackPreviewUrl); } catch (_) { }
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
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
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
                <Edit2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Post Update
                  </button>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
                  {(ticket.timeline || []).filter(e => e.type === 'update' && e.meta?.text).map((entry, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700/50">
                      <div className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap break-words">
                        {entry.meta?.text || ''}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500 dark:text-slate-400">
                        <span>{entry.user}</span>
                        <span>{formatIST(entry.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Ticket Timeline
              </h2>
              <div className="space-y-4">
                {[...(ticket.timeline || [])].reverse().map((entry, index, arr) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${entry.type === 'create' ? 'bg-blue-500' :
                          entry.type === 'assign' ? 'bg-purple-500' :
                            entry.type === 'update' ? 'bg-orange-500' :
                              'bg-green-500'
                        }`} />
                      {index !== arr.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-700 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(entry.type === 'update' && entry.meta?.text) ? 'Comment added' : entry.event}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                        {formatIST(entry.date)} • {entry.user}
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
                <Building className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Assigned Engineer
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-lg">
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
                      <p className="text-sm text-gray-900 dark:text-white">{engineerDisplayEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{engineerDisplayPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Quick Actions
              </h2>
              {userRole === 'admin' && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const name = e.target.value;
                      const eng = allUsers.find(x => x.name === name) || engineers.find(x => x.name === name);
                      setIsPendingAssignment(true);
                      setTicket({
                        ...ticket,
                        assignedEngineer: name,
                        engineerEmail: eng ? (eng.email || "") : "",
                        engineerPhone: eng ? (eng.phone || "") : "",
                        liveEngineerEmail: eng ? (eng.email || "") : "",
                        liveEngineerPhone: eng ? (eng.phone || "") : ""
                      });
                    }}
                    value={ticket.assignedEngineer}
                    className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value={ticket.assignedEngineer}>{ticket.assignedEngineer}</option>
                    {availableEngineers?.filter(n => n !== ticket.assignedEngineer).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignEngineer}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    Assign
                  </button>
                </div>
              )}
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
            <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary-600" />
                Rough Sheet
              </h2>

              {isRoughNotesEditing ? (
                <textarea
                  value={ticket.roughNotes}
                  onChange={(e) => setTicket({ ...ticket, roughNotes: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm"
                  placeholder="Type your notes here..."
                />
              ) : (
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[150px] text-sm text-gray-700 whitespace-pre-wrap break-all overflow-hidden">
                  {ticket.roughNotes || "No notes yet..."}
                </div>
              )}

              <div className="flex gap-2">
                {isRoughNotesEditing ? (
                  <button
                    onClick={handleSaveRoughNotes}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
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
