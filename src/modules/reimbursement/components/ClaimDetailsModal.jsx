import React, { useState, useEffect } from 'react';
import { X, FileText, Download } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ClaimDetailsModal = ({ claim, onClose, onAction }) => {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (claim) {
            fetchDetails();
        }
    }, [claim]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/details/${claim.id}`);
            setDetails(res.data);
        } catch (error) {
            console.error("Error fetching details:", error);
            toast.error("Failed to load claim details");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => { // 'excel'
        const url = `${API_URL}/api/reimbursement/export/excel/${claim.id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Claim Details</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{claim.report_name} - {claim.employee_name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-600 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading details...</div>
                    ) : (
                        <div className="space-y-4">
                            {details.map((item) => (
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
                            {details.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">No expenses found in this report.</div>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center gap-4 flex-wrap">
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('excel')} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center gap-2 shadow-sm">
                            <FileText className="w-4 h-4" /> Excel
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => onAction(claim.id, 'Rejected')}
                            className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => onAction(claim.id, 'Approved')}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition"
                        >
                            Approve Claim
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimDetailsModal;
