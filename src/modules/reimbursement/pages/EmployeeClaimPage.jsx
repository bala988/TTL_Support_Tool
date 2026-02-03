import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Upload, Plus, Trash2, Calendar, FileText, DollarSign, Clock, CheckCircle, XCircle, Eye, X, Save, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EmployeeClaimPage = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(false);
    const employeeId = localStorage.getItem("userId");
    const dateInputRef = useRef(null);
    const [selectedClaim, setSelectedClaim] = useState(null); // For detail modal
    const [editingClaimId, setEditingClaimId] = useState(null); // For editing drafts
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [claimDetails, setClaimDetails] = useState([]);

    // Form State
    const [reportName, setReportName] = useState('');
    const [expenseItems, setExpenseItems] = useState([]);

    // Current Item State
    const initialItemState = {
        expense_type: '',
        transaction_date: '',
        business_purpose: '',
        vendor_name: '',
        city: '',
        payment_type: '',
        amount: '',
        currency: 'INR',
        billable: false,
        project_no: '',
        event: '',
        domestic_intl: 'Domestic',
        receipt: null
    };
    const [currentItem, setCurrentItem] = useState(initialItemState);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchMyClaims();
        }
    }, [activeTab]);

    const fetchMyClaims = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/my-claims/${employeeId}`);
            setClaims(res.data);
        } catch (error) {
            console.error("Error fetching claims:", error);
            toast.error("Failed to load claims history");
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

    const handleEditDraft = async (claim) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/reimbursement/details/${claim.id}`);

            // Populate form
            setReportName(claim.report_name);
            const items = res.data.map(item => ({
                ...item,
                billable: item.billable === 1 || item.billable === true, // Ensure boolean
                id: item.id // Keep ID for key
            }));
            setExpenseItems(items);

            // Smart Auto-fill: Populate form with data from the last added item in this draft
            if (items.length > 0) {
                const lastItem = items[items.length - 1];
                setCurrentItem({
                    ...initialItemState,
                    project_no: lastItem.project_no || '',
                    event: lastItem.event || '',
                    city: lastItem.city || '',
                    domestic_intl: lastItem.domestic_intl || 'Domestic',
                    business_purpose: lastItem.business_purpose || '',
                    payment_type: lastItem.payment_type || '', // Auto-select dropdown
                    expense_type: lastItem.expense_type || '', // Auto-select dropdown
                    billable: lastItem.billable || false,      // Auto-check box
                    // We don't copy amount/date/receipt as those usually change
                });
            } else {
                setCurrentItem(initialItemState);
            }

            setEditingClaimId(claim.id);
            setActiveTab('new');

        } catch (error) {
            console.error("Edit error:", error);
            toast.error("Failed to load draft for editing");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Drag & Drop Receipt
    const onDrop = (acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            setCurrentItem(prev => ({ ...prev, receipt: acceptedFiles[0] }));
            toast.success("Receipt attached!");
        }
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1
    });

    const addExpenseItem = () => {
        // Basic validation
        if (!currentItem.expense_type || !currentItem.amount || !currentItem.transaction_date || !currentItem.vendor_name) {
            toast.error("Please fill required fields (*)");
            return;
        }

        setExpenseItems([...expenseItems, { ...currentItem, id: Date.now() }]);

        // Auto-fill for next item (Smart Reset)
        setCurrentItem({
            ...initialItemState,
            // Persist common fields
            project_no: currentItem.project_no,
            event: currentItem.event,
            city: currentItem.city,
            domestic_intl: currentItem.domestic_intl,
            business_purpose: currentItem.business_purpose,
            payment_type: currentItem.payment_type, // Persist Payment Method
            expense_type: currentItem.expense_type, // Persist Expense Type
            billable: currentItem.billable          // Persist Billable Status
        });
        toast.success("Expense added to report");
    };

    const removeExpenseItem = (id) => {
        setExpenseItems(expenseItems.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return expenseItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    const handleSubmitClaim = async (status = 'Submitted') => {
        if (expenseItems.length === 0) {
            toast.error("Please add at least one expense item");
            return;
        }
        if (!reportName) {
            toast.error("Please enter a Report Name");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('employee_id', employeeId);
            formData.append('report_name', reportName);
            formData.append('total_amount', calculateTotal());
            formData.append('status', status);

            // Clean undefined/null values for JSON
            const itemsForJson = expenseItems.map(({ receipt, id, ...rest }) => rest);
            formData.append('expense_items', JSON.stringify(itemsForJson));

            // Append files.
            expenseItems.forEach((item, index) => {
                // If it's a new file (File object), append it
                if (item.receipt instanceof File) {
                    formData.append(`receipt_${index}`, item.receipt);
                } else if (item.receipt_path) {
                    // If existing file from DB, we might want to pass it back or backend handles it.
                    // For now, backend handles preserving if not replaced.
                    // But we need to make sure itemsForJson contains receipt_path which it does.
                }
            });

            let response;
            if (editingClaimId) {
                response = await axios.put(`${API_URL}/api/reimbursement/draft/${editingClaimId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(status === 'Submitted' ? "Draft submitted successfully!" : "Draft updated successfully!");
            } else {
                response = await axios.post(`${API_URL}/api/reimbursement/submit`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(status === 'Submitted' ? "Claim submitted successfully!" : "Draft saved successfully!");
            }

            // Important: Logic to handle state after Save vs Submit
            if (status === 'Submitted') {
                // If submitted, clear everything and go to history
                setExpenseItems([]);
                setReportName('');
                setEditingClaimId(null);
                setActiveTab('history');
            } else {
                // If saved as draft, KEEP the form open but switch to "Edit Mode" using the new ID
                if (!editingClaimId && response.data.claimId) {
                    setEditingClaimId(response.data.claimId);
                }
                // Optional: Fetch fresh data to ensure syncing? 
                // For now, keeping local state is fine, but editingClaimId MUST be set.
            }

        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Failed to submit claim");
        } finally {
            setLoading(false);
        }
    };

    // Helper for date max
    const today = new Date().toISOString().split('T')[0];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'text-green-500 bg-green-500/10';
            case 'Rejected': return 'text-red-500 bg-red-500/10';
            case 'Draft': return 'text-gray-500 bg-gray-500/10 border border-gray-200 dark:border-gray-600';
            case 'Submitted': return 'text-blue-500 bg-blue-500/10';
            case 'Pending': return 'text-yellow-500 bg-yellow-500/10';
            default: return 'text-gray-500 bg-gray-100';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900 dark:text-white">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-indigo-500" /> Reimbursement / Expense Claim
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    className={`pb-2 px-4 font-medium transition ${activeTab === 'new' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                    onClick={() => setActiveTab('new')}
                >
                    {editingClaimId ? 'Edit Draft' : 'Create New Claim'}
                </button>
                <button
                    className={`pb-2 px-4 font-medium transition ${activeTab === 'history' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                    onClick={() => setActiveTab('history')}
                >
                    My Claims History
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Expense Entry Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">1. Expense Details</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Expense Type *</label>
                                    <select
                                        name="expense_type"
                                        value={currentItem.expense_type}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Stay">Stay</option>
                                        <option value="Travel">Travel</option>
                                        <option value="Meal">Meal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction Date *</label>
                                    <div className="relative">
                                        <input
                                            ref={dateInputRef}
                                            type="date"
                                            name="transaction_date"
                                            value={currentItem.transaction_date}
                                            onChange={handleInputChange}
                                            max={today}
                                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500 [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                        <Calendar
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-indigo-500"
                                            size={20}
                                            onClick={() => dateInputRef.current?.showPicker()}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Business Purpose</label>
                                    <input
                                        type="text"
                                        name="business_purpose"
                                        value={currentItem.business_purpose}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                        placeholder="e.g. Client Meeting"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Vendor Name *</label>
                                    <input
                                        type="text"
                                        name="vendor_name"
                                        value={currentItem.vendor_name}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={currentItem.city}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Type</label>
                                    <select
                                        name="payment_type"
                                        value={currentItem.payment_type}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Corporate Card">Corporate Card</option>
                                        <option value="Personal Card">Personal Card</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Amount ({currentItem.currency}) *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={currentItem.amount}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Project Number (Optional)</label>
                                    <input
                                        type="text"
                                        name="project_no"
                                        value={currentItem.project_no}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Event</label>
                                    <input
                                        type="text"
                                        name="event"
                                        value={currentItem.event}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Domestic / International</label>
                                    <select
                                        name="domestic_intl"
                                        value={currentItem.domestic_intl}
                                        onChange={handleInputChange}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                    >
                                        <option value="Domestic">Domestic</option>
                                        <option value="International">International</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="billable"
                                        checked={currentItem.billable}
                                        onChange={handleInputChange}
                                        id="billable"
                                        className="w-4 h-4 accent-indigo-500"
                                    />
                                    <label htmlFor="billable" className="text-sm text-gray-600 dark:text-gray-400">Billable to Project/Client?</label>
                                </div>

                                {/* Receipt Upload */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Receipt Upload (Drag & Drop)</label>
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        {currentItem.receipt ? (
                                            <div className="flex items-center gap-2 text-green-400">
                                                <FileText className="w-6 h-6" />
                                                <span className="text-sm">{currentItem.receipt.name}</span>
                                            </div>
                                        ) : currentItem.receipt_path ? (
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <FileText className="w-6 h-6" />
                                                <span className="text-sm">Existing Receipt</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Drag & drop receipt here, or click to select</p>
                                                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <button
                                onClick={addExpenseItem}
                                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                            >
                                <Plus className="w-4 h-4" /> Add Expense
                            </button>
                        </div>
                    </div>

                    {/* Current Report Summary */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 sticky top-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Current Report</h2>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Report Name *</label>
                                <input
                                    type="text"
                                    value={reportName}
                                    onChange={(e) => setReportName(e.target.value)}
                                    placeholder="e.g. Dec 2025 Travel"
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                />
                            </div>

                            {expenseItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 italic border border-dashed border-gray-700 rounded-lg">
                                    No expenses added yet
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {expenseItems.map((item, idx) => (
                                        <div key={item.id} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-start group">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{item.expense_type}</div>
                                                <div className="text-xs text-gray-400">{item.transaction_date}</div>
                                                <div className="text-xs text-gray-500 truncate w-32">{item.vendor_name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-indigo-600 dark:text-indigo-400">₹{item.amount}</div>
                                                <button
                                                    onClick={() => removeExpenseItem(item.id)}
                                                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600 dark:text-gray-400">Total Bill Amount:</span>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{calculateTotal().toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={() => handleSubmitClaim('Submitted')}
                                    disabled={expenseItems.length === 0 || loading}
                                    className={`w-full py-3 rounded-lg font-bold text-white transition ${expenseItems.length === 0 || loading
                                        ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                        : 'bg-green-600 hover:bg-green-700 shadow-lg'
                                        }`}
                                >
                                    {loading ? 'Submitting...' : (editingClaimId ? 'Update & Submit' : 'Submit Claim')}
                                </button>

                                <button
                                    onClick={() => handleSubmitClaim('Save Draft')}
                                    disabled={loading || !reportName}
                                    className="w-full mt-3 py-3 rounded-lg font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save as Draft
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            ) : (
                /* History Tab */
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Report Name</th>
                                <th className="p-4">Total Amount</th>
                                <th className="p-4">Currency</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Receipts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading claims...</td></tr>
                            ) : claims.length === 0 ? (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No claims found.</td></tr>
                            ) : (
                                claims.map(claim => (
                                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="p-4 text-gray-700 dark:text-gray-300">{new Date(claim.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">{claim.report_name}</td>
                                        <td className="p-4 text-gray-900 dark:text-white">₹{claim.total_amount}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">{claim.currency}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(claim.status)}`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(claim)}
                                                    className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-blue-600 dark:text-blue-400 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {claim.status === 'Draft' && (
                                                    <button
                                                        onClick={() => handleEditDraft(claim)}
                                                        className="p-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 rounded-lg text-yellow-600 dark:text-yellow-400 transition"
                                                        title="Edit Draft"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div >
            )
            }


            {/* Details Modal */}
            {
                selectedClaim && (
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Claim Details</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClaim.report_name}</p>
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

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end">
                                <button
                                    onClick={() => setSelectedClaim(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};


export default EmployeeClaimPage;
