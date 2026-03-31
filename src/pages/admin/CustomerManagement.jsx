import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Hash, 
  X,
  Building,
  Shield,
  Minus
} from "lucide-react";
import EngineerLayout from "../../components/common/EngineerLayout";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    serials: [{ serial_no: "", unique_id: "" }],
    contacts: [{ contact_name: "", phone: "", email: "" }]
  });

  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.error("Failed to fetch customers");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addSerial = () => {
    setFormData(prev => ({
      ...prev,
      serials: [...prev.serials, { serial_no: "", unique_id: "" }]
    }));
  };

  const removeSerial = (index) => {
    setFormData(prev => ({
      ...prev,
      serials: prev.serials.filter((_, i) => i !== index)
    }));
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { contact_name: "", phone: "", email: "" }]
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateSerial = (index, field, value) => {
    const newSerials = [...formData.serials];
    newSerials[index][field] = value;
    setFormData({ ...formData, serials: newSerials });
  };

  const updateContact = (index, field, value) => {
    const newContacts = [...formData.contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate all phone numbers
      for (const contact of formData.contacts) {
        if (contact.phone) {
          const phoneDigits = String(contact.phone).replace(/\D/g, '');
          if (phoneDigits.length !== 10) {
            toast.error(`Invalid phone for ${contact.contact_name || 'contact'}. Must be 10 digits.`);
            return;
          }
        }
      }

      const url = editingCustomer 
        ? `${API_URL}/api/customers/${editingCustomer.id}`
        : `${API_URL}/api/customers`;
      
      const method = editingCustomer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingCustomer ? "Customer updated" : "Customer created");
        setIsModalOpen(false);
        setEditingCustomer(null);
        setFormData({
          name: "",
          serials: [{ serial_no: "", unique_id: "" }],
          contacts: [{ contact_name: "", phone: "", email: "" }]
        });
        fetchCustomers();
      } else {
        const data = await response.json();
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Error saving customer");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const response = await fetch(`${API_URL}/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        toast.success("Customer deleted");
        fetchCustomers();
      } else {
        toast.error("Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Error deleting customer");
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      serials: customer.serials && customer.serials.length > 0 
        ? customer.serials.map(s => ({ serial_no: s.serial_no, unique_id: s.unique_id || "" }))
        : [{ serial_no: "", unique_id: "" }],
      contacts: customer.contacts && customer.contacts.length > 0
        ? customer.contacts.map(c => ({ contact_name: c.contact_name, phone: c.phone || "", email: c.email || "" }))
        : [{ contact_name: "", phone: "", email: "" }]
    });
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contacts || []).some(con => con.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <EngineerLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Customer Management</h1>
            <p className="text-slate-400">Manage your client register, multiple serials, and contact points</p>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ 
                name: "", 
                serials: [{ serial_no: "", unique_id: "" }], 
                contacts: [{ contact_name: "", phone: "", email: "" }] 
              });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search customers by name or contact..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Customers Table */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Name</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Serials & Unique IDs</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Persons</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400">Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                          <Building className="w-5 h-5 text-primary-500" />
                        </div>
                        <span className="font-semibold text-white group-hover:text-primary-400 transition-colors uppercase">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-3">
                        {customer.serials && customer.serials.map((s, idx) => (
                          <div key={idx} className="flex flex-col gap-1 boder-l border-slate-800 pl-3">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <Hash className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-mono text-primary-400">{s.serial_no}</span>
                            </div>
                            {s.unique_id && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <Shield className="w-3 h-3" />
                                <span>UID: {s.unique_id}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-4">
                        {customer.contacts && customer.contacts.map((contact, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5 boder-l border-slate-800 pl-3">
                            <div className="flex items-center gap-2 text-sm text-white font-medium">
                              <User className="w-3.5 h-3.5 text-primary-500/70" />
                              <span>{contact.contact_name}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {contact.phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <Phone className="w-3 h-3" />
                                  <span>{contact.phone}</span>
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <Mail className="w-3 h-3" />
                                  <span>{contact.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right align-top">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 hover:bg-primary-500/10 text-slate-400 hover:text-primary-400 rounded-lg transition-all"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingCustomer ? <Edit2 className="w-5 h-5 text-primary-500" /> : <Plus className="w-5 h-5 text-primary-500" />}
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              {/* Customer Name Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Customer Name *</label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  placeholder="e.g. Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Dynamic Serials Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-l-2 border-primary-500 pl-3">
                  <h3 className="text-sm font-bold text-primary-400 uppercase tracking-widest">Serial Numbers & Unique IDs</h3>
                  <button
                    type="button"
                    onClick={addSerial}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 rounded-lg text-xs font-bold transition-all border border-primary-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ADD SERIAL
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.serials.map((serial, index) => (
                    <div key={index} className="flex gap-3 items-end bg-slate-800/30 p-4 rounded-xl border border-slate-800 group relative">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Serial No *</label>
                            <input
                              required
                              type="text"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none"
                              placeholder="CUS-1XXXX"
                              value={serial.serial_no}
                              onChange={(e) => updateSerial(index, 'serial_no', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Unique ID</label>
                            <input
                              type="text"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none"
                              placeholder="Enter Unique ID"
                              value={serial.unique_id}
                              onChange={(e) => updateSerial(index, 'unique_id', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      {formData.serials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSerial(index)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/10"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Contacts Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-l-2 border-primary-500 pl-3">
                  <h3 className="text-sm font-bold text-primary-400 uppercase tracking-widest">Points of Contact</h3>
                  <button
                    type="button"
                    onClick={addContact}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 rounded-lg text-xs font-bold transition-all border border-primary-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ADD CONTACT
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.contacts.map((contact, index) => (
                    <div key={index} className="bg-slate-800/30 p-5 rounded-xl border border-slate-800 relative group">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3 flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-primary-500/50 uppercase tracking-tighter">Contact #{index + 1}</span>
                          {formData.contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContact(index)}
                              className="p-1 px-2 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-all font-bold"
                            >
                              REMOVE
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Full Name *</label>
                          <input
                            required
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none"
                            placeholder="Contact person name"
                            value={contact.contact_name}
                            onChange={(e) => updateContact(index, 'contact_name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">10-Digit Phone</label>
                          <input
                            type="tel"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none"
                            placeholder="e.g. 9876543210"
                            value={contact.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Official Email</label>
                          <input
                            type="email"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none"
                            placeholder="customer@domain.com"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 p-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-900/20 font-bold transition-all min-w-[160px]"
                >
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </EngineerLayout>
  );
}

