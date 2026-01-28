import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../api/employee';
import Card from '../ui/Card';

const AttendanceToggle = ({ onAttendanceMarked }) => {
  const [isPresent, setIsPresent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const response = await employeeAPI.getAttendance(currentMonth);
      const todayAttendance = response.data.attendance.find(
        (att) => att.date === today
      );
      setIsPresent(!!todayAttendance);
    } catch (error) {
      console.error('Failed to check attendance:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggle = async () => {
    if (isPresent) {
      toast.error('Attendance already marked for today');
      return;
    }

    setIsLoading(true);
    try {
      const response = await employeeAPI.markPresent({ date: today }); // Updated formatting to match API expectation if needed
      toast.success(response.message || 'Attendance marked successfully!');
      setIsPresent(true);
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
    <Card className={isPresent ? 'bg-green-50 border-2 border-green-200' : ''}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPresent ? 'bg-green-500' : 'bg-red-100'}`}>
            {isPresent ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark-900">
              {isPresent ? 'Attendance Marked' : 'Mark Attendance'}
            </h3>
            <p className="text-sm text-dark-600">
              {isPresent ? 'You are marked present for today' : 'Current Status: Absent (Mark to change)'}
            </p>
          </div>
        </div>
        
        {!isPresent && (
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className="relative inline-flex h-14 w-28 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-dark-300 hover:bg-dark-400 disabled:opacity-50"
          >
            <span className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${isLoading ? 'translate-x-8' : 'translate-x-2'}`} />
            <span className="absolute left-6 text-xs font-semibold text-dark-700">
              {isLoading ? 'Wait...' : 'Present'}
            </span>
          </button>
        )}
        
        {isPresent && (
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Present Today</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AttendanceToggle;
