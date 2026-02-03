import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Eye, FileText, Download, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminReimbursementPage = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null); // For detail modal
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [claimDetails, setClaimDetails] = useState([]);

    // Tabs State
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved'

    // Approved Grouping State
    const [approvedData, setApprovedData] = useState([]);
    const [approvedLoading, setApprovedLoading] = useState(false);
    const [groupBy, setGroupBy] = useState('date'); // 'date', 'vendor'

    // Grouping State
    const [viewMode, setViewMode] = useState('detailed'); // 'detailed', 'date', 'vendor'
    const [groupedData, setGroupedData] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    const userEmail = localStorage.getItem("userEmail");

    // Double check email protection on frontend (backend handles it too logically, but good for UX)
    if (userEmail !== 'rambalaji@tutelartechlabs.com') {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 shadow-lg">
                    <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400">You are not authorized to view this page.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingClaims();
        } else {
            fetchApprovedExpenses();
        }
    }, [activeTab, groupBy]);

    const fetchPendingClaims = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/pending`);
            setClaims(res.data);
        } catch (error) {
            console.error("Error fetching claims:", error);
            toast.error("Failed to load pending claims");
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedExpenses = async () => {
        try {
            setApprovedLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/approved-expenses?groupBy=${groupBy}`);
            setApprovedData(res.data);
        } catch (error) {
            console.error("Error fetching approved expenses:", error);
            toast.error("Failed to load approved data");
        } finally {
            setApprovedLoading(false);
        }
    };

    const handleViewDetails = async (claim) => {
        setSelectedClaim(claim);
        try {
            setDetailsLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/details/${claim.id}`);
            setClaimDetails(res.data);
        } catch (error) {
            toast.error("Failed to load details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const fetchGroupedData = async (claimId, mode) => {
        if (mode === 'detailed') return;
        try {
            setDetailsLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/details/${claimId}/grouped?by=${mode}`);
            setGroupedData(res.data);
            setExpandedGroups(new Set()); // Reset expansions
        } catch (error) {
            console.error("Grouping error:", error);
            toast.error("Failed to load grouped data");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        if (selectedClaim) {
            fetchGroupedData(selectedClaim.id, mode);
        }
    };

    const toggleGroup = (key) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedGroups(newExpanded);
    };

    const getGroupItems = (group) => {
        if (viewMode === 'date') {
            // Normalize dates to YYYY-MM-DD
            const groupDate = new Date(group.transaction_date).toLocaleDateString('en-CA');
            return claimDetails.filter(item =>
                new Date(item.transaction_date).toLocaleDateString('en-CA') === groupDate
            );
        } else if (viewMode === 'vendor') {
            return claimDetails.filter(item => item.vendor_name === group.vendor_name);
        }
        return [];
    };

    const handleAction = async (claimId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this claim?`)) return;

        try {
            await axios.put(`${API_URL}/api/reimbursement/${claimId}/status`, { status });
            toast.success(`Claim ${status} successfully`);
            fetchPendingClaims(); // Refresh list
            setSelectedClaim(null); // Close modal
        } catch (error) {
            console.error("Action error:", error);
            toast.error("Failed to update status");
        }
    };

    const handleExport = (type) => {
        if (!selectedClaim) return;
        let url = "";
        switch (type) {
            case 'excel': url = `${API_URL}/api/reimbursement/export/excel/${selectedClaim.id}`; break;
            case 'pdf': url = `${API_URL}/api/reimbursement/export/pdf/${selectedClaim.id}`; break;
            case 'zip': url = `${API_URL}/api/reimbursement/export/zip/${selectedClaim.id}`; break;
            default: return;
        }
        window.open(url, '_blank');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Reimbursement Approval</h1>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'pending' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Pending Claims
                    </button>
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'approved' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Approved Analysis
                    </button>
                </div>
            </div>

            {activeTab === 'pending' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Employee</th>
                                    <th className="p-4">Report Name</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading pending claims...</td></tr>
                                ) : claims.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending claims found.</td></tr>
                                ) : (
                                    claims.map(claim => (
                                        <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                            <td className="p-4 text-gray-700 dark:text-gray-300">{new Date(claim.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{claim.employee_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500">{claim.employee_email}</div>
                                            </td>
                                            <td className="p-4 text-indigo-600 dark:text-indigo-300 font-medium">{claim.report_name}</td>
                                            <td className="p-4 font-bold text-green-600 dark:text-green-400">₹{claim.total_amount}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(claim)}
                                                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-blue-600 dark:text-blue-400 transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(claim.id, 'Approved')}
                                                        className="p-2 bg-green-900/30 hover:bg-green-900/50 rounded-lg text-green-400 transition"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(claim.id, 'Rejected')}
                                                        className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400 transition"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Approved Analysis View */
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">Group By:</span>
                            <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                                <button
                                    onClick={() => setGroupBy('date')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition ${groupBy === 'date' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 font-medium' : 'text-gray-500'}`}
                                >
                                    Date
                                </button>
                                <button
                                    onClick={() => setGroupBy('vendor')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition ${groupBy === 'vendor' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 font-medium' : 'text-gray-500'}`}
                                >
                                    Vendor
                                </button>
                            </div>
                        </div>
                    </div>

                    {approvedLoading ? (
                        <div className="text-center py-12 text-gray-500">Loading approved data...</div>
                    ) : (
                        <div className="space-y-4">
                            {approvedData.map((group, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {groupBy === 'date' ? new Date(group.group_key).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : group.group_key}
                                            </h3>
                                            <p className="text-sm text-gray-500">{group.count} expense(s)</p>
                                        </div>
                                        <div className="text-xl font-bold text-green-600">₹{group.total_amount}</div>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{item.expense_type}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {item.employee_name} • {item.report_name}
                                                        {groupBy === 'vendor' && ` • ${new Date(item.transaction_date).toLocaleDateString()}`}
                                                        {groupBy === 'date' && ` • ${item.vendor_name}`}
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-gray-700 dark:text-gray-300">₹{item.amount}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {approvedData.length === 0 && (
                                <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
                                    No approved expenses found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Details Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    {/* Modal Container */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Claim Details</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClaim.report_name} - {selectedClaim.employee_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClaim(null)}
                                className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800 custom-scrollbar">
                            {detailsLoading ? (
                                <div className="text-center py-12 text-gray-500">Loading details...</div>
                            ) : (
                                <div className="space-y-4">
                                    {claimDetails.map((item) => (
                                        <div key={item.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 text-lg">{item.expense_type}</h3>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <span>{new Date(item.transaction_date).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{item.vendor_name}</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-green-600 dark:text-green-400 text-lg">₹{item.amount}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700/50">
                                                <div><span className="text-gray-500 block text-xs uppercase tracking-wide">City</span> {item.city || '-'}</div>
                                                <div><span className="text-gray-500 block text-xs uppercase tracking-wide">Purpose</span> {item.business_purpose || '-'}</div>
                                                <div><span className="text-gray-500 block text-xs uppercase tracking-wide">Payment</span> {item.payment_type}</div>
                                                <div><span className="text-gray-500 block text-xs uppercase tracking-wide">Billable</span> {item.billable ? 'Yes' : 'No'}</div>
                                            </div>

                                            {item.receipt_path ? (
                                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                                    <a
                                                        href={`${API_URL}/${item.receipt_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition text-sm font-medium"
                                                    >
                                                        <FileText className="w-4 h-4" /> View Receipt
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="mt-4 text-xs text-gray-400 italic text-right">No receipt attached</div>
                                            )}
                                        </div>
                                    ))}
                                    {claimDetails.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">No expenses found in this report.</div>}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center gap-4 flex-wrap">
                            <div className="flex gap-2">
                                <button onClick={() => handleExport('excel')} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center gap-2 shadow-sm">
                                    <FileText className="w-4 h-4" /> Excel
                                </button>
                                <button onClick={() => handleExport('pdf')} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2 shadow-sm">
                                    <FileText className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={() => handleExport('zip')} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-2 shadow-sm">
                                    <Download className="w-4 h-4" /> Receipts ZIP
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction(selectedClaim.id, 'Rejected')}
                                    className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAction(selectedClaim.id, 'Approved')}
                                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition"
                                >
                                    Approve Claim
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReimbursementPage;
