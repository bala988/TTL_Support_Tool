import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Shield, Lock, Mail, User, Phone } from 'lucide-react'

export default function SignupPage({ onSignup, isInternal = false }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'engineer',
  })

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        if (isInternal) {
          toast.success("User registered successfully! ✅");
          setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            role: 'engineer',
          });
        } else {
          toast.success("Signup successful! Please login. 🎉");
          navigate("/");
        }
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An error occurred during signup");
    }
  };

  return (
    <div className={`${isInternal ? 'w-full py-12' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-servicenow dark:to-servicenow-dark flex items-center justify-center'} p-4`}>
      <div className={`bg-white dark:bg-servicenow-light rounded-2xl shadow-xl w-full max-w-md p-8 ${isInternal ? 'mx-auto shadow-sm border border-gray-200 dark:border-servicenow-dark' : ''}`}>
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{isInternal ? "Register New User" : "Create Account"}</h1>
          <p className="text-gray-600 dark:text-slate-300 mt-2">{isInternal ? "Add a new member to the team" : "Join the IT support team"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-servicenow-dark dark:text-white dark:placeholder:text-slate-500"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-servicenow-dark dark:text-white dark:placeholder:text-slate-500"
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-servicenow-dark dark:text-white dark:placeholder:text-slate-500"
                placeholder="you@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-servicenow-dark dark:text-white dark:placeholder:text-slate-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition dark:bg-servicenow-dark dark:text-white dark:placeholder:text-slate-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Role
            </span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  value="engineer"
                  checked={formData.role === 'engineer'}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2">Engineer</span>
              </label>
              <label className="flex items-center text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  value="sales"
                  checked={formData.role === 'sales'}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2">Sales</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {isInternal ? "Register User" : "Sign Up"}
          </button>
        </form>

        {!isInternal && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
