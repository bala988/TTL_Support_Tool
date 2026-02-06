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
          localStorage.setItem("user", JSON.stringify(data.user));

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
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-slate-100 overflow-hidden">
          <img src="data:image/jpeg;base64,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" alt="Tutelar Tech Labs" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-center">
         Welcome to Tutelar Tech Labs
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
