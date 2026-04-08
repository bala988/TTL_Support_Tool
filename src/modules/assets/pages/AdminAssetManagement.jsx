import React, { useState, useEffect } from 'react';
import EngineerLayout from '../../../components/common/EngineerLayout';
import { 
  Server, Monitor, HardDrive, Headphones, Cpu, 
  Search, Plus, Filter, Database, Edit, Trash2, 
  UserCheck, Building2, Package, Tag, Hash, Calendar, Notebook
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const ASSET_TYPES = [
  'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 
  'Headphone', 'Server', 'Firewall', 'Switch', 'Router', 
  'Hard Drive', 'Other'
];

export default function AdminAssetManagement() {
  const { theme } = useTheme();
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, employees, customers
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    asset_type: '',
    custom_type: '',
    model_no: '',
    serial_no: '',
    specs: '',
    status: 'available',
    user_id: '',
    customer_id: '',
    given_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, usersRes, customersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/assets`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/auth/users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load asset data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (asset = null) => {
    if (asset) {
      const isCustomType = !ASSET_TYPES.includes(asset.asset_type);
      setFormData({
        asset_type: isCustomType ? 'Other' : asset.asset_type,
        custom_type: isCustomType ? asset.asset_type : '',
        model_no: asset.model_no || '',
        serial_no: asset.serial_no || '',
        specs: asset.specs || '',
        status: asset.status || 'available',
        user_id: asset.user_id || '',
        customer_id: asset.customer_id || '',
        given_date: asset.given_date ? new Date(asset.given_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setEditingAsset(asset);
    } else {
      setFormData({
        asset_type: '',
        custom_type: '',
        model_no: '',
        serial_no: '',
        specs: '',
        status: 'available',
        user_id: '',
        customer_id: '',
        given_date: new Date().toISOString().split('T')[0]
      });
      setEditingAsset(null);
    }
    setShowModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      const finalType = formData.asset_type === 'Other' ? formData.custom_type : formData.asset_type;
      
      const payload = {
        asset_type: finalType,
        model_no: formData.model_no,
        serial_no: formData.serial_no,
        specs: formData.specs,
        status: formData.status,
        given_date: formData.given_date,
        user_id: formData.status === 'assigned' ? formData.user_id : null,
        customer_id: formData.status === 'assigned_customer' ? formData.customer_id : null
      };

      const url = editingAsset 
        ? `${import.meta.env.VITE_API_URL}/api/assets/${editingAsset.id}`
        : `${import.meta.env.VITE_API_URL}/api/assets`;
      
      const method = editingAsset ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save asset');

      toast.success(`Asset ${editingAsset ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save asset');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete asset');
      
      toast.success('Asset deleted successfully');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete asset');
    }
  };

  const getAssetIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('server')) return Server;
    if (t.includes('monitor')) return Monitor;
    if (t.includes('hard drive') || t.includes('hdd') || t.includes('ssd')) return HardDrive;
    if (t.includes('headphone')) return Headphones;
    if (t.includes('desktop') || t.includes('cpu')) return Cpu;
    return Database;
  };

  const filteredAssets = assets.filter(asset => {
    // Filter by Tab
    if (activeTab === 'inventory' && asset.status !== 'available') return false;
    if (activeTab === 'employees' && asset.status !== 'assigned') return false;
    if (activeTab === 'customers' && asset.status !== 'assigned_customer') return false;

    // Filter by Type
    if (typeFilter !== 'All' && asset.asset_type !== typeFilter) return false;

    // Filter by Search (Model, Serial, Specs, User, Customer)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = [
        asset.model_no, 
        asset.serial_no, 
        asset.specs, 
        asset.user_name, 
        asset.customer_name
      ].filter(Boolean).join(' ').toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      assigned_customer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      returned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    const labels = {
      available: 'Available Config',
      assigned: 'Assigned to Employee',
      assigned_customer: 'Deployed to Customer',
      returned: 'Returned',
      damaged: 'Damaged'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <EngineerLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </EngineerLayout>
    );
  }

  return (
    <EngineerLayout>
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-primary-500" />
              Asset Management
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              Track company inventory, specifications, and assignments
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2 font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Asset
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100/50 dark:bg-servicenow-dark/50 p-1 rounded-xl mb-6 max-w-fit">
          {[
            { id: 'inventory', label: 'Company Inventory', icon: Package, count: assets.filter(a => a.status === 'available').length },
            { id: 'employees', label: 'Employee Assets', icon: UserCheck, count: assets.filter(a => a.status === 'assigned').length },
            { id: 'customers', label: 'Customer Deployments', icon: Building2, count: assets.filter(a => a.status === 'assigned_customer').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-servicenow-light text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-slate-700'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-servicenow-light p-4 rounded-xl shadow-sm border border-gray-200 dark:border-servicenow-dark mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96 text-gray-900 dark:text-white">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search specs, model, serial, or assigned to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-servicenow-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-servicenow-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-auto"
            >
              <option value="All">All Asset Types</option>
              {[...new Set(assets.map(a => a.asset_type))].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Asset List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-servicenow-light rounded-xl p-12 text-center border border-gray-200 dark:border-servicenow-dark shadow-sm">
              <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Assets Found</h3>
              <p className="text-gray-500 dark:text-slate-400">
                {searchQuery || typeFilter !== 'All' 
                  ? 'Try adjusting your filters or search query.' 
                  : `There are currently no assets in the '${activeTab}' category.`}
              </p>
            </div>
          ) : (
            filteredAssets.map(asset => {
              const Icon = getAssetIcon(asset.asset_type);
              
              return (
                <div key={asset.id} className="bg-white dark:bg-servicenow-light rounded-xl p-6 border border-gray-200 dark:border-servicenow-dark shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors group relative">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(asset)}
                      className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{asset.asset_type}</h3>
                      <div className="flex gap-2 mt-1">
                        {getStatusBadge(asset.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    {asset.model_no && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Model:</span> {asset.model_no}
                      </div>
                    )}
                    {asset.serial_no && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">S/N:</span> {asset.serial_no}
                      </div>
                    )}
                  </div>

                  {asset.specs && (
                    <div className="mb-4 bg-gray-50 dark:bg-servicenow-dark p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                        <Notebook className="w-4 h-4 text-primary-500" />
                        Specifications / Details
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 whitespace-pre-wrap font-mono">
                        {asset.specs}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-700/50 flex justify-between items-center text-sm">
                    {activeTab === 'employees' && asset.user_name && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-slate-200">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {asset.user_name.charAt(0)}
                        </div>
                        Assigned to <span className="font-medium">{asset.user_name}</span>
                      </div>
                    )}
                    {activeTab === 'customers' && asset.customer_name && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-slate-200">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-xs">
                          {asset.customer_name.charAt(0)}
                        </div>
                        Deployed at <span className="font-medium">{asset.customer_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 ml-auto text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(asset.given_date || asset.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white dark:bg-servicenow-light rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-servicenow-dark">
            <div className="p-6 border-b border-gray-200 dark:border-servicenow-dark sticky top-0 bg-white dark:bg-servicenow-light z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAsset ? 'Edit Asset Details' : 'Add New Asset to Inventory'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveAsset} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Asset Type *</label>
                  <select
                    required
                    value={formData.asset_type}
                    onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                  >
                    <option value="">Select Type</option>
                    {ASSET_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {formData.asset_type === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Custom Type *</label>
                    <input
                      required
                      type="text"
                      value={formData.custom_type}
                      onChange={(e) => setFormData({...formData, custom_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                      placeholder="e.g. Projector"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Model Number</label>
                  <input
                    type="text"
                    value={formData.model_no}
                    onChange={(e) => setFormData({...formData, model_no: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                    placeholder="e.g. Dell Latitude 5420"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serial_no}
                    onChange={(e) => setFormData({...formData, serial_no: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                    placeholder="S/N or Asset Tag"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Specifications / Details</label>
                <textarea
                  rows="3"
                  value={formData.specs}
                  onChange={(e) => setFormData({...formData, specs: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                  placeholder="e.g. 16GB RAM, 512GB SSD, Intel i7..."
                ></textarea>
              </div>

              <div className="border-t border-gray-200 dark:border-servicenow-dark pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Assignment & Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Current Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({
                        ...formData, 
                        status: e.target.value,
                        user_id: e.target.value !== 'assigned' ? '' : formData.user_id,
                        customer_id: e.target.value !== 'assigned_customer' ? '' : formData.customer_id
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                    >
                      <option value="available">Available (In Inventory)</option>
                      <option value="assigned">Assigned to Employee</option>
                      <option value="assigned_customer">Deployed to Customer</option>
                      <option value="returned">Returned / Pending Inspection</option>
                      <option value="damaged">Damaged / Non-operational</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.given_date}
                      onChange={(e) => setFormData({...formData, given_date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {formData.status === 'assigned' && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Select Employee *</label>
                    <select
                      required
                      value={formData.user_id}
                      onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select an employee...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.status === 'assigned_customer' && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                    <label className="block text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Select Customer *</label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-servicenow-dark text-gray-900 dark:text-white"
                    >
                      <option value="">Select a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-servicenow-dark">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-servicenow-dark rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium"
                >
                  {editingAsset ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EngineerLayout>
  );
}
