
import { useState, useEffect } from "react";
import EngineerLayout from "../common/EngineerLayout";
import { useNavigate } from "react-router-dom";
import { Plus, BarChart2, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function SalesDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales`);
      const data = await response.json();
      setOpportunities(data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  // Analytics Logic
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];
  
  const stageData = Array.from({ length: 7 }, (_, i) => ({
    name: `Stage ${i + 1}`,
    value: safeOpportunities.filter(o => o.current_stage === i + 1).length
  }));

  // Won vs Lost based on Stage 4 commercial_closure
  const wonCount = safeOpportunities.filter(o => o.commercial_closure === 'Yes').length;
  const lostCount = safeOpportunities.filter(o => o.commercial_closure === 'No').length;
  const wonLostData = [
    { name: 'Won', value: wonCount },
    { name: 'Lost', value: lostCount }
  ];

  const productData = Object.entries(
    safeOpportunities.reduce((acc, curr) => {
      const prod = curr.product || 'Unknown';
      acc[prod] = (acc[prod] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const oemData = Object.entries(
    safeOpportunities.reduce((acc, curr) => {
      const oem = curr.oem || 'Unknown';
      acc[oem] = (acc[oem] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const chartTextColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipStyle = theme === 'dark' ? { backgroundColor: '#053c57', borderColor: '#053c57', color: '#fff' } : {};

  return (
    <EngineerLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Dashboard</h1>
          <button
            onClick={() => navigate('/sales/create')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stages Bar Chart */}
          <div className="bg-white dark:bg-servicenow-light p-4 rounded-xl shadow-sm border border-gray-100 dark:border-servicenow-dark col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Opportunity Stages
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                  <XAxis dataKey="name" fontSize={12} stroke={chartTextColor} />
                  <YAxis stroke={chartTextColor} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? '#021e2e' : '#f8fafc' }} />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Pie Chart */}
          <div className="bg-white dark:bg-servicenow-light p-4 rounded-xl shadow-sm border border-gray-100 dark:border-servicenow-dark">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
              <PieChartIcon className="w-5 h-5 text-green-500" />
              By Product
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: chartTextColor }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OEM Pie Chart */}
          <div className="bg-white dark:bg-servicenow-light p-4 rounded-xl shadow-sm border border-gray-100 dark:border-servicenow-dark">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              By OEM
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={oemData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {oemData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: chartTextColor }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Won vs Lost Pie Chart */}
          <div className="bg-white dark:bg-servicenow-light p-4 rounded-xl shadow-sm border border-gray-100 dark:border-servicenow-dark">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
              <PieChartIcon className="w-5 h-5 text-red-500" />
              Won vs Lost
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wonLostData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    <Cell fill="#10B981" /> {/* Green for Won */}
                    <Cell fill="#EF4444" /> {/* Red for Lost */}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: chartTextColor }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Opportunities List */}
        <div className="bg-white dark:bg-servicenow-light rounded-xl shadow-sm border border-gray-100 dark:border-servicenow-dark overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-100 dark:border-servicenow-dark">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Opportunities</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-servicenow-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-servicenow-light divide-y divide-gray-200 dark:divide-slate-700">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50 dark:hover:bg-servicenow-dark transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{opp.opportunity_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-slate-300">{opp.customer_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-slate-300">{opp.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Stage {opp.current_stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        opp.stage_status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                        opp.stage_status === 'Completed' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {opp.stage_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      <button 
                        onClick={() => navigate(`/sales/${opp.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-slate-400">
                      No opportunities found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EngineerLayout>
  );
}
