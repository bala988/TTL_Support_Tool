import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { regularizationAPI } from '../api/regularization';

const statusColors = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/40',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/40',
};

const format12h = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

const AdminRegularizationList = ({ embedded = false }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [adminComments, setAdminComments] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await regularizationAPI.getAllRequests();
      setRequests(response.data.regularizations);
    } catch (error) {
      console.error('Failed to fetch regularizations:', error);
      toast.error('Failed to load regularization requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setProcessingId(id);
    try {
      const response = await regularizationAPI.review(id, {
        status,
        adminComment: adminComments[id] || '',
      });
      toast.success(response.message || `Request ${status.toLowerCase()} successfully`);
      fetchRequests();
      setExpandedId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    } finally {
      setProcessingId(null);
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

  const filteredRequests = filterStatus === 'All'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-servicenow-dark dark:to-servicenow-dark p-6'}>
      <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Attendance Approvals</h1>
              <p className="text-sm text-dark-500 dark:text-slate-400">
                {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'No pending requests'}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-dark-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-servicenow-light'
                }`}
              >
                {status}
                {status === 'Pending' && pendingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRequests.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-servicenow-light rounded-2xl shadow-sm border border-gray-200 dark:border-servicenow-dark">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-dark-600 dark:text-slate-300">No Regularization Requests</h3>
            <p className="text-sm text-dark-400 dark:text-slate-500 mt-1">
              {filterStatus === 'All' ? 'No regularization requests found.' : `No ${filterStatus.toLowerCase()} requests.`}
            </p>
          </div>
        )}

        {/* Request List */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const employee = req.userId;
              const isExpanded = expandedId === req._id;

              return (
                <div
                  key={req._id}
                  className={`bg-white dark:bg-servicenow-light rounded-2xl shadow-sm border transition-all ${
                    req.status === 'Pending'
                      ? 'border-amber-200 dark:border-amber-900/40'
                      : 'border-gray-200 dark:border-servicenow-dark'
                  } ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}`}
                >
                  {/* Main Row */}
                  <div
                    className="p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                        {employee?.profilePicture ? (
                          <img src={employee.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          employee?.fullName?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-dark-900 dark:text-white">
                            {employee?.fullName || 'Unknown'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Regularization
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-dark-500 dark:text-slate-400">
                          <span className="font-medium">{formatDate(req.date)}</span>
                          <span>•</span>
                          <span>{format12h(req.requestedPunchIn)} — {format12h(req.requestedPunchOut)}</span>
                          <span>•</span>
                          <span className="font-semibold">{Math.floor(req.totalMinutes / 60)}h {req.totalMinutes % 60}m</span>
                          {employee?.email && (
                            <>
                              <span>•</span>
                              <span className="text-xs">{employee.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                      <svg
                        className={`w-5 h-5 text-dark-400 dark:text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100 dark:border-servicenow-dark pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Reason</span>
                          <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                            {req.reason || 'No reason provided'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Requested Work Hours</span>
                          <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                            {format12h(req.requestedPunchIn)} — {format12h(req.requestedPunchOut)} ({Math.floor(req.totalMinutes / 60)}h {req.totalMinutes % 60}m)
                          </p>
                        </div>
                        {req.workDescription && (
                          <div className="md:col-span-2">
                            <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Work Done</span>
                            <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                              {req.workDescription}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Applied On</span>
                          <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                            {formatDateTime(req.createdAt)}
                          </p>
                        </div>
                        {req.reviewedAt && (
                          <div>
                            <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Reviewed On</span>
                            <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                              {formatDateTime(req.reviewedAt)}
                            </p>
                          </div>
                        )}
                        {req.adminComment && (
                          <div>
                            <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Admin Comment</span>
                            <p className="text-sm text-dark-700 dark:text-slate-300 mt-1 italic">{req.adminComment}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (for Pending) */}
                      {req.status === 'Pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-servicenow-dark">
                          <div className="mb-3">
                            <label className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Admin Comment (Optional)</label>
                            <input
                              type="text"
                              value={adminComments[req._id] || ''}
                              onChange={(e) => setAdminComments(prev => ({ ...prev, [req._id]: e.target.value }))}
                              placeholder="Add a comment..."
                              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReview(req._id, 'Approved');
                              }}
                              disabled={processingId === req._id}
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReview(req._id, 'Rejected');
                              }}
                              disabled={processingId === req._id}
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-bold shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegularizationList;
