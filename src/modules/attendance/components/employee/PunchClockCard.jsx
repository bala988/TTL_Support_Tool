import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { punchAPI } from '../../api/punch';
import Card from '../ui/Card';

const PunchClockCard = ({ onPunchUpdate, refreshTrigger }) => {
  const [punch, setPunch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [workLocation, setWorkLocation] = useState('');
  const [elapsed, setElapsed] = useState('0h 0m');
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchTodayPunch();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshTrigger]);

  useEffect(() => {
    if (punch?.punchIn && !punch?.punchOut && !punch?.missedPunchOut) {
      // Check if the punch is from today (IST)
      const punchDate = punch.date;
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(now.getTime() + istOffset).toISOString().split('T')[0];

      if (punchDate === todayIST) {
        startTimer(new Date(punch.punchIn));
      } else {
        // Stale punch from a previous day — stop timer, show 0h
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsed('0h 0m');
      }
    } else if (punch?.punchOut) {
      if (timerRef.current) clearInterval(timerRef.current);
      const mins = punch.totalMinutes || 0;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(`${h}h ${m}m`);
    } else if (punch?.missedPunchOut) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed('0h 0m');
    }
  }, [punch]);

  const startTimer = (punchInTime) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const update = () => {
      const now = Date.now();
      const diff = Math.floor((now - punchInTime.getTime()) / 1000);

      // Check if we've crossed midnight IST
      const istOffset = 5.5 * 60 * 60 * 1000;
      const todayIST = new Date(now + istOffset).toISOString().split('T')[0];
      const punchDateIST = punch?.date;

      if (punchDateIST && todayIST !== punchDateIST) {
        // Midnight has passed! Stop the timer
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsed('0h 0m');
        // Refresh to get updated status from backend
        fetchTodayPunch();
        return;
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(`${h}h ${m}m ${s}s`);
    };
    update();
    timerRef.current = setInterval(update, 1000);
  };

  const fetchTodayPunch = async () => {
    try {
      const response = await punchAPI.getTodayPunch();
      setPunch(response.data.punch);
      if (response.data.punch?.workLocation) {
        setWorkLocation(response.data.punch.workLocation);
      }
    } catch (error) {
      console.error('Failed to fetch punch status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const triggerCelebration = () => {
    const duration = 1000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366f1', '#818cf8', '#4f46e5', '#c7d2fe'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366f1', '#818cf8', '#4f46e5', '#c7d2fe'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'] });
    }, 250);
  };

  const handlePunchIn = async () => {
    if (!workLocation) {
      toast.error('Please select a work location first');
      return;
    }
    setIsLoading(true);
    try {
      const response = await punchAPI.punchIn({ workLocation });
      toast.success(response.message || 'Punched in successfully!');
      setPunch(response.data.punch);
      triggerCelebration();
      onPunchUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to punch in');
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation modal before punching out
  const handlePunchOutClick = () => {
    setShowPunchOutModal(true);
  };

  const handlePunchOutConfirm = async () => {
    setShowPunchOutModal(false);
    setIsLoading(true);
    try {
      const response = await punchAPI.punchOut();
      toast.success(response.message || 'Punched out successfully!');
      setPunch(response.data.punch);
      if (timerRef.current) clearInterval(timerRef.current);
      onPunchUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to punch out');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunchOutCancel = () => {
    setShowPunchOutModal(false);
  };

  if (isChecking) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  const isPunchedIn = punch?.punchIn && !punch?.punchOut && !punch?.missedPunchOut;
  const isPunchedOut = punch?.punchIn && punch?.punchOut;
  const isMissedPunchOut = punch?.missedPunchOut === true;

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-dark-900 dark:text-white">Time at Work</h3>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
            isPunchedIn ? 'bg-green-500' : isPunchedOut ? 'bg-gray-400' : isMissedPunchOut ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            {isPunchedIn && (
              <>
                <span className="text-green-600 dark:text-green-400 font-bold text-base">Punched In</span>
                <p className="text-sm text-dark-500 dark:text-slate-400">
                  Punched In, Today at {format(new Date(punch.punchIn), 'hh:mm a')} (IST)
                </p>
              </>
            )}
            {isPunchedOut && (
              <>
                <span className="text-gray-600 dark:text-gray-300 font-bold text-base">Punched Out</span>
                <p className="text-sm text-dark-500 dark:text-slate-400">
                  Out at {format(new Date(punch.punchOut), 'hh:mm a')} • In at {format(new Date(punch.punchIn), 'hh:mm a')}
                </p>
              </>
            )}
            {isMissedPunchOut && (
              <>
                <span className="text-red-500 dark:text-red-400 font-bold text-base">Not Punched Out</span>
                <p className="text-sm text-dark-500 dark:text-slate-400">
                  You forgot to punch out. Work hours recorded as 0h.
                </p>
              </>
            )}
            {!punch && (
              <>
                <span className="text-gray-500 dark:text-gray-400 font-bold text-base">Not Punched In</span>
                <p className="text-sm text-dark-500 dark:text-slate-400">Ready to start your day?</p>
              </>
            )}
          </div>
        </div>

        {/* Timer Bar */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-5 ${
          isPunchedIn 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : isPunchedOut
              ? 'bg-gray-100 dark:bg-servicenow text-gray-800 dark:text-gray-200'
              : isMissedPunchOut
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'bg-gray-100 dark:bg-servicenow text-gray-500 dark:text-gray-400'
        }`}>
          <span className="font-bold text-lg">
            {isMissedPunchOut ? '0h 0m' : elapsed} {!punch ? '' : isPunchedIn ? '' : isMissedPunchOut ? '' : 'Total'}
          </span>
          {isPunchedIn ? (
            <button
              onClick={handlePunchOutClick}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Punch Out'}
            </button>
          ) : isPunchedOut ? (
            <span className="text-sm font-medium opacity-70">Day Complete ✓</span>
          ) : isMissedPunchOut ? (
            <span className="text-sm font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Not Punched Out
            </span>
          ) : (
            <span className="text-sm">0h 0m</span>
          )}
        </div>

        {/* Punch In Controls */}
        {!punch && (
          <div className="flex items-center gap-3">
            <select
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow-light text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm cursor-pointer hover:border-primary-300 dark:hover:border-primary-500"
            >
              <option value="" disabled>Select Location</option>
              <option value="Work from Home">Work from Home</option>
              <option value="Office">Office</option>
              <option value="Client">Client</option>
            </select>

            <button
              onClick={handlePunchIn}
              disabled={isLoading || !workLocation}
              className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white rounded-xl shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
              <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wider font-bold text-orange-100">Ready?</span>
                <span className="text-base font-bold leading-none">{isLoading ? 'Punching...' : 'Punch In'}</span>
              </div>
            </button>
          </div>
        )}
      </Card>

      {/* Punch Out Confirmation Modal */}
      {showPunchOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handlePunchOutCancel}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-servicenow-dark rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[modalSlideIn_0.3s_ease-out]">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-9 h-9 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-dark-900 dark:text-white mb-3">
              Ready to Punch Out?
            </h3>

            {/* Checklist */}
            <div className="bg-gray-50 dark:bg-servicenow rounded-xl p-4 mb-5 space-y-3">
              <p className="text-sm font-semibold text-dark-700 dark:text-slate-300 mb-2">
                Before you leave, please make sure:
              </p>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-dark-600 dark:text-slate-400">
                  All your <strong>tickets are closed</strong> or assigned properly
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-dark-600 dark:text-slate-400">
                  All <strong>pending work is documented</strong> or handed off
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-dark-600 dark:text-slate-400">
                  You have <strong>entered your worklog</strong> for the day
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePunchOutCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-dark-600 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-servicenow transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handlePunchOutConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Confirm Punch Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal animation styles */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default PunchClockCard;
