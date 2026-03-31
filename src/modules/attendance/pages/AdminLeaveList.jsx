import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { leaveAPI } from '../api/leave';

const statusColors = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/40',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/40',
};

const typeColors = {
  Planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Sick: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const AdminLeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [adminComments, setAdminComments] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await leaveAPI.getAllLeaves();
      setLeaves(response.data.leaves);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to load leave applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (leaveId, status) => {
    setProcessingId(leaveId);
    try {
      const response = await leaveAPI.reviewLeave(leaveId, {
        status,
        adminComment: adminComments[leaveId] || '',
      });
      toast.success(response.message || `Leave ${status.toLowerCase()} successfully`);
      fetchLeaves();
      setExpandedId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review leave');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredLeaves = filterStatus === 'All'
    ? leaves
    : leaves.filter(l => l.status === filterStatus);

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-servicenow-dark dark:to-servicenow-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Leave Approvals</h1>
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
        {!isLoading && filteredLeaves.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-servicenow-light rounded-2xl shadow-sm border border-gray-200 dark:border-servicenow-dark">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-dark-600 dark:text-slate-300">No Leave Applications</h3>
            <p className="text-sm text-dark-400 dark:text-slate-500 mt-1">
              {filterStatus === 'All' ? 'No leave applications found.' : `No ${filterStatus.toLowerCase()} applications.`}
            </p>
          </div>
        )}

        {/* Leave List */}
        {!isLoading && filteredLeaves.length > 0 && (
          <div className="space-y-4">
            {filteredLeaves.map((leave) => {
              const employee = leave.userId;
              const isExpanded = expandedId === leave._id;

              return (
                <div
                  key={leave._id}
                  className={`bg-white dark:bg-servicenow-light rounded-2xl shadow-sm border transition-all ${
                    leave.status === 'Pending'
                      ? 'border-amber-200 dark:border-amber-900/40'
                      : 'border-gray-200 dark:border-servicenow-dark'
                  } ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}`}
                >
                  {/* Main Row */}
                  <div
                    className="p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : leave._id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeColors[leave.leaveType]}`}>
                            {leave.leaveType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-dark-500 dark:text-slate-400">
                          <span>{formatDate(leave.fromDate)} — {formatDate(leave.toDate)}</span>
                          <span>•</span>
                          <span>{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[leave.status]}`}>
                        {leave.status}
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
                            {leave.reason || 'No reason provided'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Applied On</span>
                          <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                            {formatDateTime(leave.createdAt)}
                          </p>
                        </div>
                        {leave.reviewedAt && (
                          <div>
                            <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Reviewed On</span>
                            <p className="text-sm text-dark-700 dark:text-slate-300 mt-1">
                              {formatDateTime(leave.reviewedAt)}
                            </p>
                          </div>
                        )}
                        {leave.adminComment && (
                          <div>
                            <span className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Admin Comment</span>
                            <p className="text-sm text-dark-700 dark:text-slate-300 mt-1 italic">{leave.adminComment}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (for Pending) */}
                      {leave.status === 'Pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-servicenow-dark">
                          <div className="mb-3">
                            <label className="text-xs font-semibold text-dark-400 dark:text-slate-500 uppercase">Admin Comment (Optional)</label>
                            <input
                              type="text"
                              value={adminComments[leave._id] || ''}
                              onChange={(e) => setAdminComments(prev => ({ ...prev, [leave._id]: e.target.value }))}
                              placeholder="Add a comment..."
                              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-servicenow text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReview(leave._id, 'Approved');
                              }}
                              disabled={processingId === leave._id}
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
                                handleReview(leave._id, 'Rejected');
                              }}
                              disabled={processingId === leave._id}
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

export default AdminLeaveList;
