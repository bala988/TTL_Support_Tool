import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { leaveAPI } from '../api/leave';

const ApplyLeave = () => {
  const navigate = useNavigate();
  const [leaveType, setLeaveType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate min date for planned leave (14 days from today)
  const today = new Date();
  const minPlannedDate = new Date(today);
  minPlannedDate.setDate(minPlannedDate.getDate() + 14);
  const minPlannedStr = minPlannedDate.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const getMinFromDate = () => {
    if (leaveType === 'Planned') return minPlannedStr;
    return todayStr;
  };

  // Calculate total days
  const getTotalDays = () => {
    if (!fromDate || !toDate) return 0;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) return 0;
    return Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leaveType) {
      toast.error('Please select a leave type');
      return;
    }
    if (!fromDate || !toDate) {
      toast.error('Please select from and to dates');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      toast.error('To date must be after from date');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await leaveAPI.applyLeave({ leaveType, fromDate, toDate, reason });
      toast.success(response.message || 'Leave applied successfully!');
      navigate('/leave/my');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-servicenow-dark dark:to-servicenow-dark p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Apply Leave</h1>
              <p className="text-sm text-dark-500 dark:text-slate-400">Submit your leave application</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-servicenow-light rounded-2xl shadow-lg border border-gray-200 dark:border-servicenow-dark p-8">
          {/* Leave Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-2">
              Leave Type<span className="text-red-500">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => {
                setLeaveType(e.target.value);
                setFromDate('');
                setToDate('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">-- Select --</option>
              <option value="Planned">Planned Leave</option>
              <option value="Sick">Sick Leave</option>
            </select>
            {leaveType === 'Planned' && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Planned leave must be applied at least 2 weeks in advance
              </p>
            )}
          </div>

          {/* Leave Balance Display */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Days</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{getTotalDays()} Day(s)</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-2">
                From Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                min={getMinFromDate()}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={!leaveType}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-2">
                To Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate || getMinFromDate()}
                onChange={(e) => setToDate(e.target.value)}
                disabled={!leaveType || !fromDate}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-2">
              Comments
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Reason for leave..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-400 dark:text-slate-500">* Required</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/leave/my')}
                className="px-6 py-3 rounded-xl text-dark-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-servicenow font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !leaveType || !fromDate || !toDate}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
