import { useState, useEffect } from "react";
import EngineerLayout from "../common/EngineerLayout";
import { useNavigate } from "react-router-dom";
import { Ticket, Clock, CheckCircle, AlertTriangle, UserCheck, Download, Filter } from "lucide-react";
import toast from 'react-hot-toast';
import { StatsCard } from "../common/StatsCard";
import { TicketsTable } from "../tickets/TicketsTable";
import { useTheme } from "../../context/ThemeContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [salesApprovals, setSalesApprovals] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userEmail, setUserEmail] = useState('');

  // Filters State
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterProduct, setFilterProduct] = useState('All');
  const [filterEngineer, setFilterEngineer] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);

    if (role !== "admin") {
      navigate("/engineer/dashboard");
    }

    const fetchData = async () => {
      try {
        const [ticketsRes, approvalsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/tickets/dashboard`),
          fetch(`${import.meta.env.VITE_API_URL}/api/approvals`)
        ]);

        const ticketsData = await ticketsRes.json();
        const approvalsData = await approvalsRes.json();

        // Fetch Sales Approvals if Ram
        if (localStorage.getItem("userEmail")?.toLowerCase() === 'rambalaji@tutelartechlabs.com') {
          try {
            const salesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-approvals`);
            const salesData = await salesRes.json();
            setSalesApprovals(salesData);
          } catch (e) {
            console.error("Sales approval fetch error:", e);
          }

          try {
            // Fetch pending reimbursements
            const reimbRes = await fetch(`${import.meta.env.VITE_API_URL}/api/reimbursement/pending`);
            const reimbData = await reimbRes.json();
            setReimbursements(reimbData);
          } catch (e) {
            console.error("Reimbursement fetch error:", e);
          }
        }

        const mappedTickets = ticketsData.map(t => ({
          ...t,
          openDate: t.open_date ? new Date(t.open_date).toISOString().split('T')[0] : '',
          type: t.ticket_type,
        }));

        setTickets(mappedTickets);
        setApprovals(approvalsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleApprovalAction = async (id, action) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/approvals/${id}`;
      let method = 'PUT';
      let body = {};

      if (action === 'grant') {
        body = { access: true };
      } else if (action === 'revoke' || action === 'reject') {
        method = 'DELETE';
      }

      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method !== 'DELETE') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (response.ok) {
        if (method === 'DELETE') {
          setApprovals(approvals.filter(a => a.id !== id));
        } else {
          setApprovals(approvals.map(a => a.id === id ? { ...a, access: 1 } : a));
        }
      }
    } catch (error) {
      console.error("Error updating approval:", error);
    }
  };

  const handleSalesApprovalAction = async (id, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setSalesApprovals(salesApprovals.map(a => a.id === id ? { ...a, status } : a));
      } else {
        const data = await response.json();
        console.error("Failed to update sales approval:", data.message);
      }
    } catch (error) {
      console.error("Error updating sales approval:", error);
    }
  };

  const handleReimbursementAction = async (id, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reimbursement/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Remove from list if processed (since we usually only show pending or we can update status to show history)
        // For dashboard quick view, maybe we just remove them or mark them. 
        // Let's remove them from the pending list for now to keep it clean, or update status.
        // The API might return the updated object, but let's just filter it out or update it.
        // If we want to show history, we update. If we want to show 'Pending' only, filtering is better?
        // But the previous tabs show 'Pending'/'Approved' states?
        // Actually Sales Approvals tab shows all (?) or just Pending?
        // Logic: const salesApprovalsCount = salesApprovals.filter(a => a.status === 'Pending').length;
        // So it likely holds all.
        setReimbursements(reimbursements.map(r => r.id === id ? { ...r, status } : r));
        toast.success(`Claim ${status} successfully`);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update claim");
      }
    } catch (error) {
      console.error("Error updating reimbursement:", error);
      toast.error("Error updating claim");
    }
  };

  // Filter Logic
  const uniqueCustomers = ['All', ...new Set(tickets.map(t => t.customer).filter(Boolean))];
  const uniqueProducts = ['All', ...new Set(tickets.map(t => t.product).filter(Boolean))];
  const uniqueEngineers = ['All', ...new Set(tickets.map(t => t.assigned_engineer).filter(Boolean))];
  const uniqueStatuses = ['All', ...new Set(tickets.map(t => t.status).filter(Boolean))];

  const filteredTickets = tickets.filter(t => {
    const matchCustomer = filterCustomer === 'All' || t.customer === filterCustomer;
    const matchProduct = filterProduct === 'All' || t.product === filterProduct;
    const matchEngineer = filterEngineer === 'All' || t.assigned_engineer === filterEngineer;
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;

    let matchDate = true;
    if (filterStartDate && filterEndDate) {
      // Create dates and reset time part to compare just the dates
      const ticketDate = new Date(t.open_date);
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      matchDate = ticketDate >= start && ticketDate <= end;
    }

    return matchCustomer && matchProduct && matchEngineer && matchStatus && matchDate;
  });

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      toast.error("No tickets to export");
      return;
    }

    const headers = [
      "Ticket ID", "Severity", "Ticket Type", "Status", "Technology", "Customer Name",
      "Serial No", "Engineer Name", "Issue Subject", "Issue Description",
      "OEM TAC Involved", "TAC Case No.", "Engineer Remarks", "Problem Resolution",
      "Open Date", "Close Date"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredTickets.map(t => [
        t.ticket_number,
        t.severity,
        `"${(t.ticket_type || '').replace(/"/g, '""')}"`,
        t.status,
        `"${(t.product || '').replace(/"/g, '""')}"`,
        `"${(t.customer || '').replace(/"/g, '""')}"`,
        `"${(t.customer_serial_no || '').replace(/"/g, '""')}"`,
        `"${(t.assigned_engineer || '').replace(/"/g, '""')}"`,
        `"${(t.issue_subject || '').replace(/"/g, '""')}"`,
        `"${(t.issue_description || '').replace(/"/g, '""')}"`,
        `"${(t.oem_tac_involved || '').replace(/"/g, '""')}"`,
        `"${(t.tac_case_number || '').replace(/"/g, '""')}"`,
        `"${(t.engineer_remarks || '').replace(/"/g, '""')}"`,
        `"${(t.problem_resolution || '').replace(/"/g, '""')}"`,
        t.openDate,
        t.close_date ? new Date(t.close_date).toISOString().split('T')[0] : ''
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported successfully!");
    }
  };

  const ticketApprovalsCount = approvals.filter(a => !a.access).length;
  const salesApprovalsCount = salesApprovals.filter(a => a.status === 'Pending').length;
  const reimbursementApprovalsCount = reimbursements.filter(r => r.status === 'Pending' || r.status === 'Submitted').length;

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    critical: tickets.filter(t => t.severity === 'Critical').length,
    pendingApprovals: ticketApprovalsCount + salesApprovalsCount + reimbursementApprovalsCount,
    pendingTicketApprovals: ticketApprovalsCount,
    pendingSalesApprovals: salesApprovalsCount,
    pendingReimbursements: reimbursementApprovalsCount,
  };

  const severityData = [
    { name: "Critical", value: tickets.filter(t => t.severity === 'Critical').length, color: "#ef4444" },
    { name: "High", value: tickets.filter(t => t.severity === 'High').length, color: "#f97316" },
    { name: "Medium", value: tickets.filter(t => t.severity === 'Medium').length, color: "#eab308" },
    { name: "Low", value: tickets.filter(t => t.severity === 'Low').length, color: "#22c55e" },
  ];

  const statusData = [
    { name: "Open", value: stats.open, color: "#3b82f6" },
    { name: "In Progress", value: tickets.filter(t => t.status === 'In Progress').length, color: "#a855f7" },
    { name: "Closed", value: stats.closed, color: "#6b7280" },
  ];

  const chartTextColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipStyle = theme === 'dark' ? { backgroundColor: '#053c57', borderColor: '#053c57', color: '#fff' } : {};

  return (
    <EngineerLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              Overview of all support tickets and system status
            </p>
          </div>

          <div className="flex bg-gray-100 dark:bg-servicenow-dark p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'overview'
                ? 'bg-white dark:bg-servicenow-light text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'approvals'
                ? 'bg-white dark:bg-servicenow-light text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Approvals
              {stats.pendingTicketApprovals > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingTicketApprovals}
                </span>
              )}
            </button>

            {userEmail?.toLowerCase() === 'rambalaji@tutelartechlabs.com' && (
              <button
                onClick={() => setActiveTab('sales_approvals')}
                className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'sales_approvals'
                  ? 'bg-white dark:bg-servicenow-light text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                Sales Approvals
                {stats.pendingSalesApprovals > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.pendingSalesApprovals}
                  </span>
                )}
              </button>
            )}

            {(userEmail?.toLowerCase() === 'rambalaji@tutelartechlabs.com' || userEmail?.toLowerCase() === 'rambalaji@tutelartechlabs.com') && (
              <button
                onClick={() => setActiveTab('reimbursement_approvals')}
                className={`px-4 py-2 rounded-md font-medium transition ${activeTab === 'reimbursement_approvals'
                  ? 'bg-white dark:bg-servicenow-light text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                Reimbursement
                {stats.pendingReimbursements > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.pendingReimbursements}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                icon={Ticket}
                title="Total Tickets"
                value={stats.total}
                color="blue"
              />
              <StatsCard
                icon={Clock}
                title="Open Tickets"
                value={stats.open}
                color="orange"
                subtitle="Requires attention"
              />
              <StatsCard
                icon={CheckCircle}
                title="Closed Tickets"
                value={stats.closed}
                color="green"
              />
              <StatsCard
                icon={UserCheck}
                title="Pending Approvals"
                value={stats.pendingApprovals}
                color="purple"
                subtitle="Requests waiting"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-servicenow-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-servicenow-dark">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tickets by Severity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend formatter={(value) => <span style={{ color: chartTextColor }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-servicenow-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-servicenow-dark">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tickets by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="name" stroke={chartTextColor} />
                    <YAxis stroke={chartTextColor} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? '#021e2e' : '#f8fafc' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Tickets</h2>

              {/* Filters and Export Section */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">Filter by:</span>
                    </div>

                    {/* Customer Filter */}
                    <select
                      value={filterCustomer}
                      onChange={(e) => setFilterCustomer(e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="All">All Customers</option>
                      {uniqueCustomers.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Product Filter */}
                    <select
                      value={filterProduct}
                      onChange={(e) => setFilterProduct(e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="All">All Products</option>
                      {uniqueProducts.filter(p => p !== 'All').map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    {/* Engineer Filter */}
                    <select
                      value={filterEngineer}
                      onChange={(e) => setFilterEngineer(e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="All">All Engineers</option>
                      {uniqueEngineers.filter(e => e !== 'All').map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="All">All Statuses</option>
                      {uniqueStatuses.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">From:</span>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">To:</span>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-sm text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Tickets</h2>
              <TicketsTable
                tickets={filteredTickets}
                onTicketClick={(ticketId) => navigate(`/tickets/${ticketId}`)}
                actionLabel="View"
              />
            </div>
          </>
        )}

        {activeTab === 'approvals' && (
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-servicenow-dark">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-servicenow-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-servicenow-light divide-y divide-gray-200 dark:divide-slate-700">
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No access requests found
                      </td>
                    </tr>
                  ) : (
                    approvals.map((approval) => (
                      <tr key={approval.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{approval.ticket_id}</div>
                          <div className="text-sm text-gray-500">{approval.issue_subject}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{approval.requester_name}</div>
                          <div className="text-sm text-gray-500">{approval.requester_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(approval.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${approval.access ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {approval.access ? 'Granted' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!approval.access && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApprovalAction(approval.id, 'grant')}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                              >
                                Grant
                              </button>
                              <button
                                onClick={() => handleApprovalAction(approval.id, 'reject')}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {!!approval.access && (
                            <button
                              onClick={() => handleApprovalAction(approval.id, 'revoke')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sales_approvals' && (
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-servicenow-dark">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales Opportunity Approvals</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-servicenow-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Opportunity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-servicenow-light divide-y divide-gray-200 dark:divide-slate-700">
                  {salesApprovals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">
                        No sales approval requests found
                      </td>
                    </tr>
                  ) : (
                    salesApprovals.map((approval) => (
                      <tr key={approval.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{approval.opportunity_name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{approval.customer_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{approval.requester_name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{approval.requester_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          {new Date(approval.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${approval.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            approval.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                            {approval.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {approval.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSalesApprovalAction(approval.id, 'Approved')}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md dark:bg-green-900/20 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Grant
                              </button>
                              <button
                                onClick={() => handleSalesApprovalAction(approval.id, 'Rejected')}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {approval.status === 'Approved' && (
                            <span className="text-gray-400 dark:text-slate-500">Approved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reimbursement_approvals' && (
          <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-servicenow-dark">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reimbursement / Expense Claims</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-servicenow-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Report Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-servicenow-light divide-y divide-gray-200 dark:divide-slate-700">
                  {reimbursements.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">
                        No reimbursement claims found
                      </td>
                    </tr>
                  ) : (
                    reimbursements.map((claim) => (
                      <tr key={claim.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{claim.report_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{claim.employee_name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{claim.employee_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600 dark:text-green-400">
                          ₹{claim.total_amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${claim.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            claim.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {claim.status !== 'Approved' && claim.status !== 'Rejected' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleReimbursementAction(claim.id, 'Approved')}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md dark:bg-green-900/20 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReimbursementAction(claim.id, 'Rejected')}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => navigate('/admin/reimbursement-approval')}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Details
                              </button>
                            </div>
                          )}
                          {claim.status !== 'Pending' && (
                            <span className="text-gray-400 dark:text-slate-500">{claim.status}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </EngineerLayout>
  );
}
