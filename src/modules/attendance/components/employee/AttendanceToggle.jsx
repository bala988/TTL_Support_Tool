import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { employeeAPI } from '../../api/employee';
import Card from '../ui/Card';

const AttendanceToggle = ({ onAttendanceMarked, refreshTrigger }) => {
  const [isPresent, setIsPresent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [workLocation, setWorkLocation] = useState(''); // New state for location

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    checkTodayAttendance();
    // Auto-refresh every 30 seconds to keep "active today bar" updated
    const interval = setInterval(checkTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, [onAttendanceMarked, refreshTrigger]); // Re-check if parent triggers update via prop change (if applicable) or just on mount/interval

  const triggerCelebration = () => {
    const duration = 1000;
    const end = Date.now() + duration;

    // Launch confetti from both sides
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#818cf8', '#4f46e5', '#c7d2fe', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#818cf8', '#4f46e5', '#c7d2fe', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Big central burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b']
      });
    }, 250);
  };

  const checkTodayAttendance = async () => {
    try {
      const response = await employeeAPI.getAttendance(currentMonth);
      const todayAttendance = response.data.attendance.find(
        (att) => att.date === today
      );
      setIsPresent(!!todayAttendance);
      if (todayAttendance?.workLocation) {
        setWorkLocation(todayAttendance.workLocation);
      }
    } catch (error) {
      console.error('Failed to check attendance:', error);
      // Optional: toast.error('Failed to sync attendance status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggle = async () => {
    if (isPresent) {
      toast.error('Attendance already marked for today');
      return;
    }

    if (!workLocation) {
      toast.error('Please select a work location first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await employeeAPI.markPresent({ date: today, workLocation }); // Updated formatting to match API expectation if needed
      toast.success(response.message || 'Attendance marked successfully!');
      setIsPresent(true);
      triggerCelebration(); // Trigger confetti celebration
      if (onAttendanceMarked) {
        onAttendanceMarked();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-500 ${isPresent ? 'bg-green-50/50 border-green-200' : 'hover:shadow-md'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${isPresent ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
            {isPresent ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-dark-900">
              {isPresent ? 'Attendance Marked' : 'Today\'s Attendance'}
            </h3>
            <p className="text-sm text-dark-500 font-medium">
              {isPresent ? 'Great job! You are marked present.' : 'You haven\'t marked your attendance yet.'}
            </p>
          </div>
        </div>
        
        {!isPresent && (
          <div className="flex items-center gap-3">
            <select
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm cursor-pointer hover:border-primary-300 dark:hover:border-primary-500"
            >
              <option value="" disabled className="bg-white dark:bg-servicenow-light text-dark-900 dark:text-white">Select Location</option>
              <option value="Work from Home" className="bg-white dark:bg-servicenow-light text-dark-900 dark:text-white">Work from Home</option>
              <option value="Office" className="bg-white dark:bg-servicenow-light text-dark-900 dark:text-white">Office</option>
              <option value="Client" className="bg-white dark:bg-servicenow-light text-dark-900 dark:text-white">Client</option>
            </select>

            <button
              onClick={handleToggle}
              disabled={isLoading || !workLocation}
              title={!workLocation ? "Please select a work location first" : "Mark attendance"}
              className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl shadow-lg hover:shadow-primary-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
              
              <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex flex-col items-start pr-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary-100">Ready?</span>
                <span className="text-base font-bold leading-none">{isLoading ? 'Marking...' : 'Mark Present'}</span>
              </div>
            </button>
          </div>
        )}
        
        {isPresent && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100/50 text-green-700 rounded-xl font-bold text-sm border border-green-200/50">
            <span className="text-xl">✨</span>
            <span>Enjoy your work!</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AttendanceToggle;
