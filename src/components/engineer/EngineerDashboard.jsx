import { useState, useEffect } from "react";
import EngineerLayout from "../common/EngineerLayout";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { Ticket, Clock, CheckCircle, AlertTriangle } from "lucide-react";
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

export default function EngineerDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myApprovals, setMyApprovals] = useState({});

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tickets/dashboard');
        const data = await response.json();
        // Map API response to UI model
        const mappedTickets = data.map(t => ({
          ...t,
          openDate: t.open_date ? new Date(t.open_date).toISOString().split('T')[0] : '',
          assignedEngineer: t.assigned_engineer
        }));
        setTickets(mappedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchApprovals = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;
      try {
        const response = await fetch(`http://localhost:5000/api/approvals/my/${userId}`);
        const data = await response.json();
        const map = {};
        // backend returns { ticket_id, access } where access is 1 (true) or 0 (false)
        data.forEach(a => map[a.ticket_id] = a.access);
        setMyApprovals(map);
      } catch (error) {
        console.error("Error fetching approvals:", error);
      }
    };

    fetchTickets();
    fetchApprovals();
  }, []);

  const handleRequestAccess = async (ticketId) => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/approvals/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, requesterId: userId })
      });

      if (response.ok) {
        // Set to 0 (false) representing pending access
        setMyApprovals(prev => ({ ...prev, [ticketId]: 0 }));
        toast.success("Access requested successfully!");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to request access");
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      toast.error("Error requesting access");
    }
  };

  const getActionLabel = (ticket) => {
    const access = myApprovals[ticket.id];
    // access is 1 (true) for granted, 0 (false) for pending, undefined for no request
    // Using loose equality to handle potentially string '1' from DB
    if (access == 1 || access === true) return 'View';
    if (access === 0 || access === false) return 'Request Sent';
    return 'Request Access';
  };

  const handleOtherTicketAction = (ticketId) => {
    const access = myApprovals[ticketId];
    if (access == 1 || access === true) {
      navigate(`/tickets/${ticketId}`);
    } else if (access === 0 || access === false) {
      toast.info("Request is pending approval");
    } else {
      handleRequestAccess(ticketId);
    }
  };

  const userName = localStorage.getItem("userName");
  const myTickets = tickets.filter(t => t.assignedEngineer === userName);
  const otherTickets = tickets.filter(t => t.assignedEngineer !== userName);

  // Filter tickets that are either assigned to the user or have access granted
  const accessibleTickets = tickets.filter(t => {
    const isAssigned = t.assignedEngineer === userName;
    const access = myApprovals[t.id];
    const hasAccess = access === 1 || access === true;
    return isAssigned || hasAccess;
  });

  const stats = {
    total: accessibleTickets.length,
    open: accessibleTickets.filter(t => t.status === 'Open').length,
    closed: accessibleTickets.filter(t => t.status === 'Closed').length,
    critical: accessibleTickets.filter(t => t.severity === 'Critical').length,
    high: accessibleTickets.filter(t => t.severity === 'High').length,
    medium: accessibleTickets.filter(t => t.severity === 'Medium').length,
    low: accessibleTickets.filter(t => t.severity === 'Low').length,
  };

  const severityData = [
    { name: "Critical", value: stats.critical, color: "#ef4444" },
    { name: "High", value: stats.high, color: "#f97316" },
    { name: "Medium", value: stats.medium, color: "#eab308" },
    { name: "Low", value: stats.low, color: "#22c55e" },
  ];

  const statusData = [
    { name: "Open", value: stats.open, color: "#3b82f6" },
    { name: "In Progress", value: tickets.filter(t => t.status === 'In Progress').length, color: "#a855f7" },
    { name: "Closed", value: stats.closed, color: "#6b7280" },
  ];

  const chartTextColor = theme === 'dark' ? '#cbd5e1' : '#475569'; // slate-300 : slate-600
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
  const tooltipStyle = theme === 'dark' ? { backgroundColor: '#053c57', borderColor: '#053c57', color: '#fff' } : {};

  return (
    <EngineerLayout>
      <div className="p-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Engineer Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-2">
          Welcome back! Here's your ticket overview
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
          <StatsCard
            icon={Ticket}
            title="Total Tickets Assigned"
            value={stats.total}
            color="blue"
            trend={{ value: "+3 this week", isPositive: true }}
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
            trend={{ value: "+5 this week", isPositive: true }}
          />
          <StatsCard
            icon={AlertTriangle}
            title="Critical Priority"
            value={stats.critical}
            color="red"
            subtitle="Immediate action needed"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-servicenow-light rounded-xl p-6 shadow-sm border border-gray-200 dark:border-servicenow-dark">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Tickets by Severity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Tickets by Status
            </h3>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              My Assigned Tickets
            </h2>
            <button
              onClick={() => navigate("/tickets/create")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition font-medium"
            >
              Create New Ticket
            </button>
          </div>
          <TicketsTable
            tickets={myTickets}
            onTicketClick={(ticketId) => navigate(`/tickets/${ticketId}`)}
            actionLabel="View"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Other Tickets
          </h2>
          <TicketsTable
            tickets={otherTickets}
            onTicketClick={(ticketId) => {
               const access = myApprovals[ticketId];
               if (access === 1 || access === true) navigate(`/tickets/${ticketId}`);
               else toast.error("You need to request access to view this ticket.");
            }}
            actionLabel={getActionLabel}
            onActionClick={handleOtherTicketAction}
          />
        </div>
      </div>
    </EngineerLayout>
  );
}
