import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { adminAPI } from '../api/admin';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import 'react-datepicker/dist/react-datepicker.css';

const AdminEmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [worklogs, setWorklogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  const [exportFrom, setExportFrom] = useState(startOfMonth(new Date()));
  const [exportTo, setExportTo] = useState(endOfMonth(new Date()));
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadEmployeeData();
  }, [id, selectedMonth]);

  const loadEmployeeData = async () => {
    setIsLoading(true);
    try {
      const monthStr = format(selectedMonth, 'yyyy-MM');
      
      const [empRes, worklogsRes, attendanceRes] = await Promise.all([
        adminAPI.getEmployeeById(id),
        adminAPI.getEmployeeWorklogs(id, monthStr),
        adminAPI.getEmployeeAttendance(id, monthStr),
      ]);

      setEmployee(empRes.data.employee);
      setWorklogs(worklogsRes.data.worklogs);
      setAttendance(attendanceRes.data.attendance);

      // Prepare calendar events
      const attendanceEvents = attendanceRes.data.attendance.map((att) => ({
        id: `att-${att._id}`,
        title: '✓ Present',
        date: att.date,
        backgroundColor: '#10b981',
        borderColor: '#059669',
      }));

      const worklogDates = [...new Set(worklogsRes.data.worklogs.map((log) => log.date))];
      const worklogEvents = worklogDates.map((date) => ({
        id: `work-${date}`,
        title: '📝 Worklogs',
        date: date,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
      }));

      setCalendarEvents([...attendanceEvents, ...worklogEvents]);
    } catch (error) {
      console.error('Failed to load employee data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const fromStr = format(exportFrom, 'yyyy-MM-dd');
      const toStr = format(exportTo, 'yyyy-MM-dd');
      
      const csvBlob = await adminAPI.exportEmployeeCSV(id, fromStr, toStr);
      
      // Create download link
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${employee.employeeId}_worklogs_${fromStr}_to_${toStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully! 📥\nFile downloaded locally & uploaded to Google Drive.', {
        duration: 4000,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to export CSV';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const totalHours = worklogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p className="text-dark-600">Employee not found</p>
          <Button onClick={() => navigate('/attendance/admin')} className="mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-servicenow-dark dark:to-servicenow-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/attendance/admin')}
          className="mb-6"
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Button>

        {/* Employee Profile */}
        <Card className="mb-6 bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-700 dark:to-purple-700 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 dark:border-white/20 overflow-hidden flex items-center justify-center">
              {employee.profilePicture ? (
                <img src={employee.profilePicture} alt={employee.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold">{employee.fullName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{employee.fullName}</h1>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-primary-100">
                <div>
                  <span className="text-sm opacity-80 block uppercase tracking-wider text-[10px]">Employee ID</span>
                  <p className="font-semibold text-white">{employee.employeeId}</p>
                </div>
                <div>
                  <span className="text-sm opacity-80 block uppercase tracking-wider text-[10px]">Email</span>
                  <p className="font-semibold text-white truncate" title={employee.email}>{employee.email}</p>
                </div>
                <div>
                  <span className="text-sm opacity-80 block uppercase tracking-wider text-[10px]">Phone</span>
                  <p className="font-semibold text-white">{employee.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm opacity-80 block uppercase tracking-wider text-[10px]">Joined</span>
                  <p className="font-semibold text-white">
                    {format(new Date(employee.joinedDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
            <h3 className="text-sm text-blue-900 dark:text-blue-100 mb-1">Total Worklogs</h3>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{worklogs.length}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
            <h3 className="text-sm text-green-900 dark:text-green-100 mb-1">Days Present</h3>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{attendance.length}</p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30">
            <h3 className="text-sm text-purple-900 dark:text-purple-100 mb-1">Total Hours</h3>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{totalHours.toFixed(1)}h</p>
          </Card>
        </div>

        {/* Month Filter */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="label-premium">View Month</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => setSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  className="input-premium pl-10 w-full"
                />
              </div>
            </div>
            <Button onClick={loadEmployeeData} variant="secondary">
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Calendar View</h2>
          <div className="dark:text-slate-200 [&_.fc-theme-standard_td]:dark:border-slate-700 [&_.fc-theme-standard_th]:dark:border-slate-700 [&_.fc-daygrid-day-number]:dark:text-slate-300">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: 'dayGridMonth',
            }}
            height="auto"
          />
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-dark-600 dark:text-slate-400">Attendance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-dark-600 dark:text-slate-400">Worklogs</span>
            </div>
          </div>
          </div>
        </Card>

        {/* Worklogs Table */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Worklog Details</h2>
          {worklogs.length === 0 ? (
            <p className="text-center text-dark-600 dark:text-slate-400 py-8">No worklogs for selected month</p>
          ) : (
            <div className="space-y-4">
              {worklogs.map((log) => (
                <div
                  key={log._id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                        {format(new Date(log.date), 'MMM d')}
                      </span>
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {log.fromTime} - {log.toTime}
                      </span>
                    </div>
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                    </span>
                  </div>
                  
                  {(log.customerName || log.ticketId) && (
                    <div className="flex gap-4 mb-2 text-xs text-dark-500 dark:text-slate-400 font-medium">
                      {log.customerName && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {log.customerName}
                        </span>
                      )}
                      {log.ticketId && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          {log.ticketId}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-dark-700 dark:text-slate-300">{log.activity}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CSV Export */}
        <Card>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Export Worklogs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label-premium">From Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <DatePicker
                  selected={exportFrom}
                  onChange={(date) => setExportFrom(date)}
                  dateFormat="yyyy-MM-dd"
                  className="input-premium pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="label-premium">To Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <DatePicker
                  selected={exportTo}
                  onChange={(date) => setExportTo(date)}
                  dateFormat="yyyy-MM-dd"
                  className="input-premium pl-10 w-full"
                />
              </div>
            </div>
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminEmployeeDetail;
