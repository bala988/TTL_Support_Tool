import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import DatePicker from 'react-datepicker';
import { employeeAPI } from '../../api/employee';
import Card from '../ui/Card';
import 'react-datepicker/dist/react-datepicker.css';

const WorklogHistory = ({ refreshTrigger }) => {
  const [worklogs, setWorklogs] = useState([]);
  const [filteredWorklogs, setFilteredWorklogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadWorklogs();
  }, [selectedMonth, refreshTrigger]);

  useEffect(() => {
    filterWorklogs();
  }, [worklogs, searchQuery]);

  const loadWorklogs = async () => {
    setIsLoading(true);
    try {
      const monthStr = format(selectedMonth, 'yyyy-MM');
      const fromDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      const response = await employeeAPI.getWorklogsByRange(fromDate, toDate);
      setWorklogs(response.data.worklogs);
    } catch (error) {
      console.error('Failed to load worklogs:', error);
      setWorklogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterWorklogs = () => {
    if (!searchQuery.trim()) {
      setFilteredWorklogs(worklogs);
      return;
    }

    const filtered = worklogs.filter((log) =>
      log.activity.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorklogs(filtered);
  };

  const totalHours = filteredWorklogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark-900">Worklog History</h2>
        <div className="text-right">
          <p className="text-sm text-dark-600">Total Hours</p>
          <p className="text-2xl font-bold text-primary-600">{totalHours.toFixed(1)}h</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="label-premium">Filter by Month</label>
          <DatePicker
            selected={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            className="input-premium"
          />
        </div>
        <div>
          <label className="label-premium">Search Activity</label>
          <input
            type="text"
            placeholder="Search in activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredWorklogs.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-dark-600">No worklogs found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-dark-200">
                <th className="text-left p-3 text-sm font-semibold text-dark-700">Date</th>
                <th className="text-left p-3 text-sm font-semibold text-dark-700">Time</th>
                <th className="text-left p-3 text-sm font-semibold text-dark-700">Duration</th>
                <th className="text-left p-3 text-sm font-semibold text-dark-700">Customer</th>
                <th className="text-left p-3 text-sm font-semibold text-dark-700">Ticket</th>
                <th className="text-left p-3 text-sm font-semibold text-dark-700">Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorklogs.map((log, index) => (
                <tr
                  key={log._id}
                  className={`border-b border-dark-100 hover:bg-blue-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-dark-50'
                  }`}
                >
                  <td className="p-3 text-sm text-dark-900">
                    {format(new Date(log.date), 'MMM d, yyyy')}
                  </td>
                  <td className="p-3 text-sm text-dark-700">
                    {log.fromTime} - {log.toTime}
                  </td>
                  <td className="p-3 text-sm font-semibold text-primary-600">
                    {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                  </td>
                  <td className="p-3 text-sm text-dark-700">
                    {log.customerName || '-'}
                  </td>
                  <td className="p-3 text-sm text-dark-700 font-mono">
                    {log.ticketId || '-'}
                  </td>
                  <td className="p-3 text-sm text-dark-700 max-w-md">
                    {log.activity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default WorklogHistory;
