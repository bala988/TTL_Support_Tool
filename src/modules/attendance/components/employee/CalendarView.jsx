import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../api/employee';
import Card from '../ui/Card';

const CalendarView = ({ refreshTrigger }) => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [allMonthlyLogs, setAllMonthlyLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, [refreshTrigger]);

  const loadCalendarData = async () => {
    try {
      // Fetch a wider range (3 months back, 2 months forward) to ensure visibility
      const today = new Date();
      const start = format(new Date(today.getFullYear(), today.getMonth() - 3, 1), 'yyyy-MM-dd');
      const end = format(new Date(today.getFullYear(), today.getMonth() + 3, 0), 'yyyy-MM-dd');
      const currentMonth = format(today, 'yyyy-MM');

      const [attendanceRes, worklogsRes] = await Promise.all([
        employeeAPI.getAttendance(currentMonth),
        employeeAPI.getWorklogsByRange(start, end),
      ]);

      const attendanceEvents = attendanceRes.data.attendance.map((att) => ({
        id: `att-${att._id}`,
        title: '✓ Present',
        date: att.date,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        textColor: '#ffffff',
        display: 'block'
      }));

      const monthlyLogs = worklogsRes.data.worklogs;
      setAllMonthlyLogs(monthlyLogs);
      
      // If a date was already selected, refresh displayed logs for that date
      if (selectedDate) {
        setDisplayedLogs(monthlyLogs.filter(log => log.date === selectedDate));
      } else {
        setDisplayedLogs(monthlyLogs);
      }

      const worklogDates = [...new Set(monthlyLogs.map((log) => log.date))];
      const worklogEvents = worklogDates.map((date) => {
        const count = monthlyLogs.filter(l => l.date === date).length;
        return {
          id: `work-${date}`,
          title: `📝 ${count} Log${count > 1 ? 's' : ''}`,
          date: date,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          textColor: '#ffffff',
          display: 'block',
          extendedProps: { type: 'worklog', date }
        };
      });

      setEvents([...attendanceEvents, ...worklogEvents]);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    selectDate(clickedDate);
  };

  const handleEventClick = (info) => {
    const date = info.event.startStr;
    selectDate(date);
  };

  const selectDate = (date) => {
    if (selectedDate === date) {
      setSelectedDate(null);
      setDisplayedLogs(allMonthlyLogs);
    } else {
      setSelectedDate(date);
      const dayLogs = allMonthlyLogs.filter(log => log.date === date);
      setDisplayedLogs(dayLogs);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Calendar View</h2>
        <div className="calendar-container">
          <style>{`
            .fc-day-selected {
              background-color: rgba(59, 130, 246, 0.15) !important;
              transition: all 0.2s ease;
            }
            .dark .fc-day-selected {
              background-color: rgba(99, 102, 241, 0.2) !important;
            }
          `}</style>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            dayCellClassNames={(arg) => {
              const dateStr = format(arg.date, 'yyyy-MM-dd');
              return dateStr === selectedDate ? 'fc-day-selected' : '';
            }}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventDisplay="block"
          />
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-dark-600 dark:text-slate-300">Attendance Marked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-dark-600 dark:text-slate-300">Worklogs Added</span>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-dark-900 dark:text-white">
            {selectedDate 
              ? `Worklogs for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`
              : `All Worklogs (${format(new Date(), 'MMMM yyyy')})`
            }
          </h3>
          {selectedDate && (
             <button 
               onClick={() => {
                 setSelectedDate(null);
                 setDisplayedLogs(allMonthlyLogs);
               }}
               className="text-sm text-primary-600 hover:text-primary-700 font-medium"
             >
               Show All
             </button>
          )}
        </div>

        {displayedLogs.length === 0 ? (
          <p className="text-dark-600 dark:text-slate-300 text-center py-4">No worklogs found</p>
        ) : (
          <div className="space-y-3">
            {displayedLogs.map((log) => (
              <div
                key={log._id}
                className="p-4 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-servicenow-dark dark:to-servicenow-light rounded-xl border-2 border-blue-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
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
                <p className="text-dark-700 dark:text-slate-300">{log.activity}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CalendarView;
