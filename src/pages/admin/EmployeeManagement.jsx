import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Laptop, 
  MousePointer2, 
  Monitor, 
  Smartphone,
  CheckCircle2,
  Clock,
  X,
  Shield,
  Briefcase,
  History,
  AlertCircle
} from "lucide-react";
import EngineerLayout from "../../components/common/EngineerLayout";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // Registration Form State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'engineer',
  });

  // Asset Form State
  const [assetData, setAssetData] = useState({
    asset_type: 'Laptop',
    model_no: '',
    serial_no: '',
    given_date: new Date().toISOString().split('T')[0]
  });

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAssets = async (userId) => {
    try {
      setAssetsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/assets/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regData.password !== regData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Phone validation
    const phoneDigits = String(regData.phone).replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: regData.name,
          email: regData.email,
          phone: phoneDigits,
          password: regData.password,
          role: regData.role
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success("Employee registered successfully!");
        setIsRegModalOpen(false);
        setRegData({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'engineer' });
        fetchEmployees();
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Error during registration");
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/assets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedEmployee.id,
          ...assetData
        })
      });

      if (response.ok) {
        toast.success("Asset assigned successfully");
        setAssetData({ asset_type: 'Laptop', model_no: '', serial_no: '', given_date: new Date().toISOString().split('T')[0] });
        fetchUserAssets(selectedEmployee.id);
      } else {
        toast.error("Failed to assign asset");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    }
  };

  const handleReturnAsset = async (assetId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'returned',
          return_date: new Date().toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        toast.success("Asset marked as returned");
        fetchUserAssets(selectedEmployee.id);
      }
    } catch (error) {
      toast.error("Error updating asset");
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssetIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'laptop': return <Laptop className="w-4 h-4 text-primary-400" />;
      case 'mouse': return <MousePointer2 className="w-4 h-4 text-primary-400" />;
      case 'monitor': return <Monitor className="w-4 h-4 text-primary-400" />;
      case 'mobile': return <Smartphone className="w-4 h-4 text-primary-400" />;
      default: return <Briefcase className="w-4 h-4 text-primary-400" />;
    }
  };

  return (
    <EngineerLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Employee Management</h1>
            <p className="text-slate-400">Manage team members and assigned company assets</p>
          </div>
          <button
            onClick={() => setIsRegModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Register New Employee
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search employees by name, role or email..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400">Loading employees...</span>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 font-medium">
              No employees found matching your search.
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/40 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center border border-primary-600/30 text-primary-500 font-bold text-xl uppercase">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">{emp.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Shield className="w-3 h-3 capitalize" />
                        <span className="capitalize">{emp.role}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setSelectedEmployee(emp);
                        setIsAssetModalOpen(true);
                        fetchUserAssets(emp.id);
                    }}
                    className="p-2 bg-slate-800 group-hover:bg-primary-600 text-slate-400 group-hover:text-white rounded-lg transition-all"
                    title="Manage Assets"
                  >
                    <Laptop className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="w-4 h-4 text-slate-600" />
                    <span>{emp.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-primary-600/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-primary-500" />
                  Register Employee
                </h2>
                <button 
                    onClick={() => setIsRegModalOpen(false)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                    <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleRegister} className="p-6 space-y-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                        <input
                            required
                            type="text"
                            placeholder="John Doe"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={regData.name}
                            onChange={(e) => setRegData({...regData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                        <input
                            required
                            type="email"
                            placeholder="john@company.com"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={regData.email}
                            onChange={(e) => setRegData({...regData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Phone Number</label>
                        <input
                            required
                            type="tel"
                            placeholder="10-digit number"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={regData.phone}
                            onChange={(e) => setRegData({...regData, phone: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={regData.password}
                                onChange={(e) => setRegData({...regData, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={regData.confirmPassword}
                                onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">System Role</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer"
                            value={regData.role}
                            onChange={(e) => setRegData({...regData, role: e.target.value})}
                        >
                            <option value="engineer">Engineer</option>
                            <option value="sales">Sales</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-900/20 font-bold mt-6 transition-all"
                >
                    Create Employee Account
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Asset Management Modal */}
      {isAssetModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[800px]">
            {/* Left: Assign Form */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 p-6 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-500 font-bold">
                        {selectedEmployee.name.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">{selectedEmployee.name}</h4>
                        <p className="text-xs text-slate-500">Asset Assignment</p>
                    </div>
                </div>

                <form onSubmit={handleAddAsset} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Asset Type</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            value={assetData.asset_type}
                            onChange={(e) => setAssetData({...assetData, asset_type: e.target.value})}
                        >
                            <option value="Laptop">Laptop</option>
                            <option value="Mouse">Mouse</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Keyboard">Keyboard</option>
                            <option value="Other">Other Asset</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Model / Details</label>
                        <input
                            type="text"
                            placeholder="e.g. Dell Latitude 5420"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            value={assetData.model_no}
                            onChange={(e) => setAssetData({...assetData, model_no: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Serial No</label>
                        <input
                            type="text"
                            placeholder="S/N: ABC-12345"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            value={assetData.serial_no}
                            onChange={(e) => setAssetData({...assetData, serial_no: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Assigned Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            value={assetData.given_date}
                            onChange={(e) => setAssetData({...assetData, given_date: e.target.value})}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 font-bold transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        Assign Asset
                    </button>
                </form>
            </div>

            {/* Right: Asset List */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-primary-500" />
                        Asset History
                    </h3>
                    <button 
                        onClick={() => setIsAssetModalOpen(false)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {assetsLoading ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-50">
                            <Clock className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading asset history...</p>
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center px-10">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-slate-700" />
                            </div>
                            <h4 className="font-bold text-slate-400 mb-1">No assets assigned</h4>
                            <p className="text-sm">This employee doesn't have any hardware records yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assets.map((asset) => (
                                <div key={asset.id} className={`p-4 rounded-xl border transition-all ${asset.status === 'returned' ? 'bg-slate-900 border-slate-800 grayscale' : 'bg-slate-800/40 border-primary-500/20 shadow-lg shadow-primary-500/5'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${asset.status === 'returned' ? 'bg-slate-700 text-slate-500' : 'bg-primary-600/10 text-primary-500'}`}>
                                                {getAssetIcon(asset.asset_type)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white mb-0.5">{asset.asset_type}</h4>
                                                <p className="text-sm text-slate-400 font-medium">{asset.model_no || 'Standard Model'}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs">
                                                    <span className="text-slate-500">SN: <span className="text-slate-300 font-mono">{asset.serial_no || 'N/A'}</span></span>
                                                    <span className="text-slate-500">•</span>
                                                    <span className="text-slate-500">Given: <span className="text-slate-300">{new Date(asset.given_date).toLocaleDateString()}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {asset.status === 'assigned' ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider rounded border border-green-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Currently Assigned
                                                    </span>
                                                    <button 
                                                        onClick={() => handleReturnAsset(asset.id)}
                                                        className="text-xs font-semibold text-primary-400 hover:text-primary-300"
                                                    >
                                                        Mark as Returned
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="px-2 py-1 bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700">
                                                        Returned
                                                    </span>
                                                    {asset.return_date && (
                                                        <span className="text-[10px] text-slate-500 italic">
                                                            on {new Date(asset.return_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </EngineerLayout>
  );
}
