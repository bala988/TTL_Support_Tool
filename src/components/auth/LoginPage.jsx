import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email && password) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
          localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem("token", data.token); // Store JWT
          localStorage.setItem("userRole", data.user.role);
          localStorage.setItem("userId", data.user.id);
          localStorage.setItem("userName", data.user.name);
          localStorage.setItem("userPhone", data.user.phone || "");

          if (data.user.role === "admin") {
            navigate("/admin/dashboard");
          } else if (data.user.role === "sales") {
            navigate("/sales/create");
          } else {
            navigate("/engineer/dashboard");
          }
        } else {
          toast.error(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        toast.error("An error occurred during login");
      }
    } else {
      toast.error("Please enter email and password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-servicenow dark:to-servicenow-dark flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white dark:bg-servicenow-light rounded-2xl shadow-xl px-8 py-10 border border-transparent dark:border-servicenow-dark"
      >
        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
          🛡️
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center">
          IT Support Portal
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300 text-center">
          Sign in to your account
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:bg-servicenow-dark dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:bg-servicenow-dark dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />

          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-slate-300 dark:bg-servicenow-dark dark:border-slate-600" />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
              Forgot password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
