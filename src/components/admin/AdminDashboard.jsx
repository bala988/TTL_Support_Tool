import { useState, useEffect } from "react";
import EngineerLayout from "../common/EngineerLayout";
import { useNavigate } from "react-router-dom";
import { Ticket, Clock, CheckCircle, AlertTriangle, UserCheck } from "lucide-react";
import toast from 'react-hot-toast';
import { StatsCard } from "../common/StatsCard";
import { TicketsTable } from "../tickets/TicketsTable";
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
  const [tickets, setTickets] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [salesApprovals, setSalesApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userEmail, setUserEmail] = useState('');

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
          fetch('http://localhost:5000/api/tickets/dashboard'),
          fetch('http://localhost:5000/api/approvals')
        ]);

        const ticketsData = await ticketsRes.json();
        const approvalsData = await approvalsRes.json();

        // Fetch Sales Approvals if Ram
        if (localStorage.getItem("userEmail") === 'rambalaji@tutelartechlabs.com') {
           try {
             const salesRes = await fetch('http://localhost:5000/api/sales-approvals');
             const salesData = await salesRes.json();
             setSalesApprovals(salesData);
           } catch (e) {
             console.error("Sales approval fetch error:", e);
           }
        }

        const mappedTickets = ticketsData.map(t => ({
          ...t,
          openDate: t.open_date ? new Date(t.open_date).toISOString().split('T')[0] : '',
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
      let url = `http://localhost:5000/api/approvals/${id}`;
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
      const response = await fetch(`http://localhost:5000/api/sales-approvals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSalesApprovals(salesApprovals.map(a => a.id === id ? { ...a, status } : a));
        // Use a simple alert or console log if toast is not available, or assume toast is available since it's used elsewhere
        // Checking imports... toast seems not imported in this file. I need to check imports.
      } else {
        const data = await response.json();
        console.error("Failed to update sales approval:", data.message);
      }
    } catch (error) {
      console.error("Error updating sales approval:", error);
    }
  };

  const ticketApprovalsCount = approvals.filter(a => !a.access).length;
  const salesApprovalsCount = salesApprovals.filter(a => a.status === 'Pending').length;

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    critical: tickets.filter(t => t.severity === 'Critical').length,
    pendingApprovals: ticketApprovalsCount + salesApprovalsCount, // Combined for Overview Card
    pendingTicketApprovals: ticketApprovalsCount, // Separate for Approvals Tab
    pendingSalesApprovals: salesApprovalsCount, // Separate for Sales Tab
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

  return (
    <EngineerLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Overview of all support tickets and system status
            </p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'overview' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'approvals' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approvals
              {stats.pendingTicketApprovals > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingTicketApprovals}
                </span>
              )}
            </button>
            
            {userEmail === 'rambalaji@tutelartechlabs.com' && (
              <button
                onClick={() => setActiveTab('sales_approvals')}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  activeTab === 'sales_approvals' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
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
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tickets by Severity</h3>
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
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tickets by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
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
              <TicketsTable
                tickets={tickets}
                onTicketClick={(ticketId) => navigate(`/tickets/${ticketId}`)}
                actionLabel="View"
              />
            </div>
          </>
        )}

        {activeTab === 'approvals' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Access Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            approval.access ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Sales Opportunity Approvals</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesApprovals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No sales approval requests found
                      </td>
                    </tr>
                  ) : (
                    salesApprovals.map((approval) => (
                      <tr key={approval.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{approval.opportunity_name}</div>
                          <div className="text-sm text-gray-500">{approval.customer_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{approval.requester_name}</div>
                          <div className="text-sm text-gray-500">{approval.requester_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(approval.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                             approval.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                             approval.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {approval.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {approval.status === 'Pending' && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSalesApprovalAction(approval.id, 'Approved')}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                              >
                                Grant
                              </button>
                              <button
                                onClick={() => handleSalesApprovalAction(approval.id, 'Rejected')}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {approval.status === 'Approved' && (
                              <span className="text-gray-400">Approved</span>
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
