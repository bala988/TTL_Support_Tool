import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { regularizationAPI } from '../../api/regularization';
import { punchAPI } from '../../api/punch';
import Card from '../ui/Card';

const statusColors = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
};

// --- Custom AM/PM Time Picker Component ---
const TimePicker = ({ value, onChange, label, required }) => {
  // Parse the 24h value (HH:mm) back into 12h components
  const parse24h = (val) => {
    if (!val) return { hour: '', minute: '', period: 'AM' };
    const [h, m] = val.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour: String(hour12), minute: String(m).padStart(2, '0'), period };
  };

  const { hour, minute, period } = parse24h(value);

  const buildTime = (h, m, p) => {
    // Default hour to 12, minute to 00 if not yet selected
    const hour = h || '12';
    const min = (m === '' || m === undefined) ? '00' : m;
    let hour24 = parseInt(hour);
    if (p === 'AM' && hour24 === 12) hour24 = 0;
    if (p === 'PM' && hour24 !== 12) hour24 += 12;
    return `${String(hour24).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const handleChange = (field, val) => {
    const curr = parse24h(value);
    const updated = { ...curr, [field]: val };
    const newTime = buildTime(updated.hour, updated.minute, updated.period);
    onChange(newTime);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">
        {/* Hour */}
        <select
          value={hour}
          onChange={(e) => handleChange('hour', e.target.value)}
          className="flex-1 px-3 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer text-center font-semibold"
        >
          <option value="">HH</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span className="text-xl font-bold text-dark-400 dark:text-slate-500">:</span>

        {/* Minute */}
        <select
          value={minute}
          onChange={(e) => handleChange('minute', e.target.value)}
          className="flex-1 px-3 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer text-center font-semibold"
        >
          <option value="">MM</option>
          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* AM/PM */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleChange('period', 'AM')}
            className={`px-4 py-3 text-sm font-bold transition-all ${
              period === 'AM'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-servicenow-light text-dark-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-servicenow'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleChange('period', 'PM')}
            className={`px-4 py-3 text-sm font-bold transition-all border-l border-gray-200 dark:border-slate-700 ${
              period === 'PM'
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-servicenow-light text-dark-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-servicenow'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Format 24h time to 12h display ---
const format12h = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

// --- Main Component ---
const RegularizationForm = ({ refreshTrigger, onSuccess }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [missedDays, setMissedDays] = useState([]);
  const [loadingMissedDays, setLoadingMissedDays] = useState(true);

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [punchInTime, setPunchInTime] = useState('');
  const [punchOutTime, setPunchOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [workDescription, setWorkDescription] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchMissedDays();
  }, [refreshTrigger]);

  const fetchRequests = async () => {
    try {
      const response = await regularizationAPI.getMyRequests();
      setRequests(response.data.regularizations);
    } catch (error) {
      console.error('Failed to fetch regularization requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMissedDays = async () => {
    setLoadingMissedDays(true);
    try {
      // Fetch last 4 weeks of data to find missed punch-out days
      const missed = [];
      for (let w = 0; w <= 3; w++) {
        const response = await punchAPI.getWeeklySummary(w);
        const days = response.data.days;
        for (const day of days) {
          if (day.status === 'Not Punched Out') {
            missed.push(day);
          }
        }
      }
      setMissedDays(missed);
    } catch (error) {
      console.error('Failed to fetch missed days:', error);
    } finally {
      setLoadingMissedDays(false);
    }
  };

  // Filter out days that already have pending/approved requests
  const availableMissedDays = missedDays.filter(day => {
    return !requests.some(
      r => r.date === day.date && (r.status === 'Pending' || r.status === 'Approved')
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !punchInTime || !punchOutTime || !reason || !workDescription) {
      toast.error('Please fill all fields');
      return;
    }

    if (reason.trim().length < 5) {
      toast.error('Reason must be at least 5 characters');
      return;
    }

    if (workDescription.trim().length < 10) {
      toast.error('Work description must be at least 10 characters');
      return;
    }

    // Validate punch out > punch in
    const [inH, inM] = punchInTime.split(':').map(Number);
    const [outH, outM] = punchOutTime.split(':').map(Number);
    if ((outH * 60 + outM) <= (inH * 60 + inM)) {
      toast.error('Punch out time must be after punch in time');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await regularizationAPI.apply({
        date: selectedDate,
        requestedPunchIn: punchInTime,
        requestedPunchOut: punchOutTime,
        reason: reason.trim(),
        workDescription: workDescription.trim(),
      });
      toast.success(response.message || 'Regularization request submitted!');
      // Reset form
      setSelectedDate('');
      setPunchInTime('');
      setPunchOutTime('');
      setReason('');
      setWorkDescription('');
      fetchRequests();
      fetchMissedDays();
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '-';
    return new Date(dtStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const calculateHours = () => {
    if (!punchInTime || !punchOutTime) return null;
    const [inH, inM] = punchInTime.split(':').map(Number);
    const [outH, outM] = punchOutTime.split(':').map(Number);
    const totalMin = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMin <= 0) return null;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Apply Form */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Attendance Regularization</h3>
            <p className="text-sm text-dark-500 dark:text-slate-400">Request to correct your work hours for missed punch-out days</p>
          </div>
        </div>

        {availableMissedDays.length === 0 && !loadingMissedDays ? (
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
            <svg className="w-12 h-12 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 dark:text-green-400 font-semibold">All Clear!</p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">No missed punch-outs found in the last 4 weeks.</p>
          </div>
        ) : loadingMissedDays ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-sm text-dark-500 dark:text-slate-400">Checking for missed punch-outs...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Select Date */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-1.5">
                Select Date <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Choose a missed punch-out date</option>
                {availableMissedDays.map((day) => (
                  <option key={day.date} value={day.date}>
                    {formatDate(day.date)} — Not Punched Out
                  </option>
                ))}
              </select>
            </div>

            {/* Time Inputs — AM/PM Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimePicker
                label="Punch In Time"
                required
                value={punchInTime}
                onChange={setPunchInTime}
              />
              <TimePicker
                label="Punch Out Time"
                required
                value={punchOutTime}
                onChange={setPunchOutTime}
              />
            </div>

            {/* Calculated Hours Preview */}
            {calculateHours() && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                  Total working hours: <strong>{calculateHours()}</strong>
                </span>
              </div>
            )}

            {/* Reason for missing punch out */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-1.5">
                Reason for Missing Punch Out <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g., Forgot to punch out, system was down, left in a hurry..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Worklog — What did you work on */}
            <div>
              <label className="block text-sm font-semibold text-dark-700 dark:text-slate-300 mb-1.5">
                Work Done on That Day <span className="text-red-500">*</span>
              </label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows={3}
                placeholder="Describe the tasks and work you completed on that day..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
              />
              <p className="text-xs text-dark-400 dark:text-slate-500 mt-1">Minimum 10 characters. Be specific about tickets, tasks, and activities you worked on.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedDate || !punchInTime || !punchOutTime || !reason || !workDescription}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Regularization Request
                </>
              )}
            </button>
          </form>
        )}
      </Card>

      {/* Previous Requests */}
      <Card>
        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Regularization Requests
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-dark-400 dark:text-slate-500">
            <p className="text-sm">No regularization requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-servicenow hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-dark-900 dark:text-white">
                    {formatDate(req.date)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-dark-500 dark:text-slate-400">
                  <div>
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">In</span>
                    <p className="font-medium">{format12h(req.requestedPunchIn)}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">Out</span>
                    <p className="font-medium">{format12h(req.requestedPunchOut)}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">Hours</span>
                    <p className="font-medium">{Math.floor(req.totalMinutes / 60)}h {req.totalMinutes % 60}m</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">Applied</span>
                    <p className="font-medium">{formatDateTime(req.createdAt)}</p>
                  </div>
                </div>
                {req.reason && (
                  <div className="mt-2 text-sm">
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">Reason: </span>
                    <span className="text-dark-600 dark:text-slate-300">{req.reason}</span>
                  </div>
                )}
                {req.workDescription && (
                  <div className="mt-1 text-sm">
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">Work Done: </span>
                    <span className="text-dark-600 dark:text-slate-300">{req.workDescription}</span>
                  </div>
                )}
                {req.adminComment && (
                  <div className="mt-1 text-sm">
                    <span className="text-xs font-semibold uppercase text-dark-400 dark:text-slate-500">Admin: </span>
                    <span className="text-dark-600 dark:text-slate-300 italic">{req.adminComment}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default RegularizationForm;
