import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Eye, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminReimbursementPage = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null); // For detail modal
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [claimDetails, setClaimDetails] = useState([]);

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
        fetchPendingClaims();
    }, []);

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

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900 dark:text-white">
            <h1 className="text-3xl font-bold mb-8">Reimbursement Approval</h1>

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

            {/* Details Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Claim Details</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClaim.report_name} - {selectedClaim.employee_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClaim(null)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {detailsLoading ? (
                                <div className="text-center py-8 text-gray-500">Loading details...</div>
                            ) : (
                                <div className="space-y-4">
                                    {claimDetails.map((item, idx) => (
                                        <div key={item.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-indigo-600 dark:text-indigo-400">{item.expense_type}</h3>
                                                <span className="font-bold text-green-600 dark:text-green-400">₹{item.amount}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-sm text-gray-700 dark:text-gray-300">
                                                <div><span className="text-gray-500">Date:</span> {new Date(item.transaction_date).toLocaleDateString()}</div>
                                                <div><span className="text-gray-500">Vendor:</span> {item.vendor_name}</div>
                                                <div><span className="text-gray-500">City:</span> {item.city || '-'}</div>
                                                <div><span className="text-gray-500">Purpose:</span> {item.business_purpose || '-'}</div>
                                                <div><span className="text-gray-500">Payment:</span> {item.payment_type}</div>
                                                <div><span className="text-gray-500">Billable:</span> {item.billable ? 'Yes' : 'No'}</div>
                                            </div>

                                            {item.receipt_path ? (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                    <a
                                                        href={`${API_URL}/${item.receipt_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline text-sm"
                                                    >
                                                        <FileText className="w-4 h-4" /> View Receipt
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-xs text-gray-500 italic">No receipt attached</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={() => handleAction(selectedClaim.id, 'Rejected')}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 rounded-lg border border-red-200 dark:border-red-900/50 transition"
                            >
                                Reject Claim
                            </button>
                            <button
                                onClick={() => handleAction(selectedClaim.id, 'Approved')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition"
                            >
                                Approve Claim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReimbursementPage;
