import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Check, X, Eye, FileText, Download, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

const AdminReimbursementPage = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null); // For detail modal
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [claimDetails, setClaimDetails] = useState([]);
    const location = useLocation();

    // Tabs State
    const [activeTab, setActiveTab] = useState('approved'); // Default to 'approved'

    // Approved Analysis State
    const [approvedData, setApprovedData] = useState([]);
    const [approvedLoading, setApprovedLoading] = useState(false);

    // Approved Analysis Sub-tabs
    const [analysisTab, setAnalysisTab] = useState('detailed'); // 'detailed', 'employees'
    const [selectedEmployee, setSelectedEmployee] = useState(null); // For Employee Detail View
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [allEmployees, setAllEmployees] = useState([]);

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

    const fetchAllEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/users`);
            setAllEmployees(res.data);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingClaims();
        } else {
            fetchApprovedExpenses();
            fetchAllEmployees();
        }
    }, [activeTab]);

    useEffect(() => {
        // Handle deep linking from Dashboard
        if (location.state?.claimId) {
            // If we have a claimId, we should try to load it. 
            // Since we might be on 'approved' tab by default now, but the link might be for a pending claim or vice versa.
            // Usually dashboard links to Pending Claims for approval.
            // Let's assume dashboard sends us to pending.

            const linkClaimId = location.state.claimId;
            // We need to fetch this specific claim details if not in list, OR just fetch details directly.
            // Simplified approach: Set active tab to 'pending' (if that's where we expect it) or just fetch details.
            // If the claim is pending, we probably want to see the pending list AND the modal.

            setActiveTab('pending');
            // We need to wait for claims to load? Or just fetch this single claim context?
            // Ideally we find it in the list. But list loads async.
            // Let's rely on fetchPendingClaims to populate list, then find it? 
            // Or better: Just fetch the single claim metadata for the modal header if needed, or if handleViewDetails only needs the ID?
            // handleViewDetails needs a 'claim' object for header info (report_name, employee_name).

            // Let's try to fetch the single claim first to open the modal.
            fetchSingleClaimAndOpen(linkClaimId);
        }
    }, [location.state]);

    const fetchSingleClaimAndOpen = async (id) => {
        try {
            // We might need a new endpoint or reuse pending/details?
            // Actually, handleViewDetails calls /details/:id for items.
            // But we need the claim metadata (total amount, names) for the modal header.
            // Let's try to find it in the pending list if loaded, else fetch it.

            // For now, let's fetch pending claims first, then find it.
            if (claims.length === 0) await fetchPendingClaims();

            // Wait a bit or chain it? use helper.
            // Better: separate endpoint for claim metadata? 
            // Or just fetch all pending and find() it.
            const res = await axios.get(`${API_URL}/api/reimbursement/pending`); // We are re-fetching here to be sure.
            setClaims(res.data);
            const found = res.data.find(c => c.id === parseInt(id));
            if (found) {
                handleViewDetails(found);
            }
        } catch (e) {
            console.error("Deep link error", e);
        }
    };

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
            // Fetching flat list of approved expenses
            const res = await axios.get(`${API_URL}/api/reimbursement/approved-expenses`);
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
            default: return;
        }
        window.open(url, '_blank');
    };

    // Helper to get distinct employees with stats
    const getEmployeeStats = () => {
        const stats = {};

        // Initialize with all employees
        allEmployees.forEach(emp => {
            if (emp.role !== 'admin') { // Filter out admins if needed, or keep all
                stats[emp.name] = {
                    name: emp.name,
                    email: emp.email,
                    count: 0,
                    total: 0
                };
            }
        });

        // Fill with transaction data
        approvedData.forEach(item => {
            const name = item.employee_name || 'Unknown';
            // If employee not in initial list (e.g. deleted user or data mismatch), create entry
            if (!stats[name]) {
                stats[name] = {
                    name,
                    email: item.employee_email || 'N/A', // Try to get from item if possible
                    count: 0,
                    total: 0
                };
            }
            stats[name].count++;
            stats[name].total += parseFloat(item.amount || 0);
        });
        return Object.values(stats).sort((a, b) => b.total - a.total);
    };

    const getEmployeeTransactions = () => {
        if (!selectedEmployee) return [];
        return approvedData.filter(item => item.employee_name === selectedEmployee);
    };

    const handleEmployeeExport = (name) => {
        const employeeTransactions = approvedData.filter(item => item.employee_name === name);
        if (employeeTransactions.length === 0) return;
        const ids = employeeTransactions.map(item => item.id);
        handleBulkExport('excel', ids);
    };

    const handleBulkExport = async (type, manualIds = null) => { // type: 'excel'
        const idsToExport = manualIds || Array.from(selectedItems);
        if (idsToExport.length === 0) return;

        try {
            const loadingToast = toast.loading(`Generating ${type.toUpperCase()}...`);

            const response = await axios({
                url: `${API_URL}/api/reimbursement/export/items?type=${type}`, // Ensure backend route matches
                method: 'POST',
                data: { itemIds: idsToExport },
                responseType: 'blob', // Important
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses_export.${type === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.dismiss(loadingToast);
            toast.success("Download started");
        } catch (error) {
            console.error("Bulk export error:", error);
            toast.error("Failed to export");
        }
    };


    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = approvedData.map(item => item.id);
            setSelectedItems(new Set(allIds));
        } else {
            setSelectedItems(new Set());
        }
    };



    const handleSingleExport = async (id, type) => {
        try {
            const loadingToast = toast.loading(`Generating ${type.toUpperCase()}...`);

            const response = await axios({
                url: `${API_URL}/api/reimbursement/export/items?type=${type}`,
                method: 'POST',
                data: { itemIds: [id] },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expense_${id}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.dismiss(loadingToast);
            toast.success("Download started");
        } catch (error) {
            console.error("Single export error:", error);
            toast.error("Failed to export");
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto text-gray-900 dark:text-white font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Reimbursement Approval</h1>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('approved')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'approved' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Approved Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'pending' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        Pending Claims
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
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[500px]">
                    {/* Sub-tabs for Analysis */}
                    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
                        <div className="flex">
                            <button
                                onClick={() => { setAnalysisTab('detailed'); setSelectedEmployee(null); }}
                                className={`px-6 py-3 text-sm font-medium transition border-b-2 ${analysisTab === 'detailed' ? 'border-indigo-600 text-indigo-600 bg-gray-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                All Transactions
                            </button>
                            <button
                                onClick={() => setAnalysisTab('employees')}
                                className={`px-6 py-3 text-sm font-medium transition border-b-2 ${analysisTab === 'employees' ? 'border-indigo-600 text-indigo-600 bg-gray-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                By Employee
                            </button>
                        </div>

                        {/* Bulk Action Bar - Show only in Detailed View and when items selected */}
                        {analysisTab === 'detailed' && selectedItems.size > 0 && (
                            <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
                                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                    {selectedItems.size} items selected
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleBulkExport('excel')}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded shadow-sm flex items-center gap-1 transition"
                                    >
                                        <FileText className="w-3 h-3" /> Export Excel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {approvedLoading ? (
                        <div className="text-center py-12 text-gray-500">Loading approved data...</div>
                    ) : (
                        <div className="p-0">
                            {/* VIEW 1: Detailed List (All) */}
                            {analysisTab === 'detailed' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.size === approvedData.length && approvedData.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="p-4 cursor-pointer hover:text-gray-700">Date <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                                                <th className="p-4 font-bold text-gray-800 dark:text-gray-200">Employee</th>
                                                <th className="p-4 text-center">Details</th>
                                                <th className="p-4 cursor-pointer hover:text-gray-700">Expense Type <ChevronDown className="w-3 h-3 inline ml-1" /></th>
                                                <th className="p-4">Vendor Details</th>
                                                <th className="p-4">Payment Type</th>
                                                <th className="p-4 text-right">Requested</th>
                                                <th className="p-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                            {approvedData.length === 0 ? (
                                                <tr><td colSpan="9" className="p-8 text-center text-gray-500">No approved expenses found.</td></tr>
                                            ) : (
                                                approvedData.map((item, idx) => (
                                                    <tr key={idx} className={`hover:bg-blue-50/50 dark:hover:bg-gray-700/30 transition group ${selectedItems.has(item.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                                        <td className="p-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedItems.has(item.id)}
                                                                onChange={() => handleToggleSelect(item.id)}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </td>
                                                        <td className="p-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                            {new Date(item.transaction_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-indigo-600 dark:text-indigo-400 font-medium">
                                                            {item.employee_name}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.receipt_path ? (
                                                                <a href={`${API_URL}/${item.receipt_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 inline-block p-1 border border-blue-200 rounded bg-blue-50">
                                                                    <FileText className="w-4 h-4" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-300"><FileText className="w-4 h-4" /></span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                            {item.expense_type}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]" title={item.vendor_name}>{item.vendor_name || 'N/A'}</div>
                                                            <div className="text-xs text-gray-500 uppercase">{item.city} {item.project_no ? `• ${item.project_no}` : ''}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-600 dark:text-gray-400">
                                                            {item.payment_type || 'Cash'}
                                                        </td>
                                                        <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                                                            INR {item.amount}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="relative group/actions inline-block">
                                                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                                                    <div className="flex gap-0.5">
                                                                        <div className="w-1 h-1 bg-current rounded-full"></div>
                                                                        <div className="w-1 h-1 bg-current rounded-full"></div>
                                                                        <div className="w-1 h-1 bg-current rounded-full"></div>
                                                                    </div>
                                                                </button>
                                                                <div className="hidden group-hover/actions:block absolute right-0 mt-0 py-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 z-10">
                                                                    <button
                                                                        onClick={() => handleSingleExport(item.id, 'excel')}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                    >
                                                                        Export Excel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* VIEW 2: Employee List or Detail */}
                            {analysisTab === 'employees' && (
                                <div className="p-6">
                                    {selectedEmployee ? (
                                        // Employee Detail View
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setSelectedEmployee(null)}
                                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                    >
                                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                                    </button>
                                                    <div>
                                                        <h2 className="text-xl font-bold">{selectedEmployee}</h2>
                                                        <p className="text-sm text-gray-500">Transaction History</p>
                                                    </div>
                                                </div>
                                                {getEmployeeTransactions().length > 0 && (
                                                    <button
                                                        onClick={() => handleEmployeeExport(selectedEmployee)}
                                                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded shadow-sm flex items-center gap-1 transition"
                                                    >
                                                        <FileText className="w-3 h-3" /> Export Excel
                                                    </button>
                                                )}
                                            </div>

                                            {getEmployeeTransactions().length > 0 ? (
                                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                                            <tr>
                                                                <th className="p-4">Date</th>
                                                                <th className="p-4">Expense Type</th>
                                                                <th className="p-4">Vendor</th>
                                                                <th className="p-4">Report</th>
                                                                <th className="p-4 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                            {getEmployeeTransactions().map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                                    <td className="p-4">{new Date(item.transaction_date).toLocaleDateString()}</td>
                                                                    <td className="p-4 font-medium">{item.expense_type}</td>
                                                                    <td className="p-4">{item.vendor_name}</td>
                                                                    <td className="p-4 text-gray-500">{item.report_name}</td>
                                                                    <td className="p-4 text-right font-semibold text-green-600">INR {item.amount}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                                    <p>No transactions found for this employee.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Employee List View - TABLE FORMAT
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                                    <tr>
                                                        <th className="p-4">Employee Name</th>
                                                        <th className="p-4">Email</th>
                                                        <th className="p-4 text-center">Approved Claims</th>
                                                        <th className="p-4 text-right">Total Amount</th>
                                                        <th className="p-4 text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                    {getEmployeeStats().map((emp, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                                                                {emp.name}
                                                            </td>
                                                            <td className="p-4 text-gray-500 dark:text-gray-400">
                                                                {emp.email}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.count > 0 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                                    {emp.count}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">
                                                                {emp.total > 0 ? `₹${emp.total.toLocaleString()}` : '-'}
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <button
                                                                    onClick={() => setSelectedEmployee(emp.name)}
                                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
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
