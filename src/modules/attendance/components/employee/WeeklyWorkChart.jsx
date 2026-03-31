import { useState, useEffect } from 'react';
import { punchAPI } from '../../api/punch';
import Card from '../ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../../../../context/ThemeContext';

const WeeklyWorkChart = ({ refreshTrigger }) => {
  const { theme } = useTheme();
  const [weekData, setWeekData] = useState([]);
  const [weekRange, setWeekRange] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchWeekly();
  }, [refreshTrigger, weekOffset]);

  const fetchWeekly = async () => {
    setIsLoading(true);
    try {
      const response = await punchAPI.getWeeklySummary(weekOffset);
      const data = response.data;
      setWeekData(data.days);
      setTotalHours(data.totalHours);

      // Format range like "Mar 23 - Mar 29"
      const start = new Date(data.weekStart + 'T00:00:00');
      const end = new Date(data.weekEnd + 'T00:00:00');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setWeekRange(`${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`);
    } catch (error) {
      console.error('Failed to fetch weekly summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Last Week";
    return `${weekOffset} Weeks Ago`;
  };

  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#fff';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';

  const getBarColor = (hours) => {
    if (hours >= 8) return '#22c55e';
    if (hours >= 5) return '#f59e0b';
    if (hours > 0) return '#f97316';
    return theme === 'dark' ? '#334155' : '#e2e8f0';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const hours = payload[0].value;
      return (
        <div
          className="px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
          style={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}
        >
          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {label}: <strong>{hours}h</strong>
          </span>
        </div>
      );
    }
    return null;
  };

  const isAllZero = weekData.every(d => d.hours === 0);

  // Ensure bars show at least a tiny amount for visual consistency
  const chartData = weekData.map(d => ({
    ...d,
    displayHours: d.hours || 0,
  }));

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-dark-500 dark:text-slate-400 uppercase tracking-wide">
            {getWeekLabel()}
          </h4>
          <p className="text-xs text-dark-400 dark:text-slate-500">{weekRange}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-servicenow rounded-lg p-0.5">
            <button 
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-1 hover:bg-white dark:hover:bg-servicenow-light rounded transition-all text-gray-500 dark:text-gray-400"
              title="Previous Week"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
              disabled={weekOffset === 0}
              className="p-1 hover:bg-white dark:hover:bg-servicenow-light rounded transition-all text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Week"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-dark-500 dark:text-slate-200 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg border border-primary-100 dark:border-primary-900/30">
            <svg className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold">{totalHours}h</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="relative">
          {isAllZero && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/10 dark:bg-slate-900/10 pointer-events-none">
              <span className="text-xs font-medium text-gray-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-gray-100 dark:border-slate-800 shadow-sm">
                No activity recorded
              </span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
              <XAxis
                dataKey="day"
                stroke={chartTextColor}
                tick={{ fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={chartTextColor}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc', radius: 4 }} />
              <Bar dataKey="displayHours" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.hours)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default WeeklyWorkChart;
