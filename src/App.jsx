import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import EngineerDashboard from "./components/engineer/EngineerDashboard";
import TicketCreationForm from "./components/tickets/TicketCreationForm";
import TicketDetailsView from "./components/tickets/TicketDetailsView";
import AdminDashboard from "./components/admin/AdminDashboard";
import SalesDashboard from "./components/sales/SalesDashboard";
import SalesOpportunityView from "./components/sales/SalesOpportunityView";
import EngineerLayout from "./components/common/EngineerLayout";

// Attendance Module Imports
// Attendance Module Imports
import AttendanceEmployeeDashboard from "./modules/attendance/pages/EmployeeDashboard";
import AttendanceAdminDashboard from "./modules/attendance/pages/AdminDashboard";
import Profile from "./components/profile/Profile"; // Updated import
import AdminEmployeeDetail from "./modules/attendance/pages/AdminEmployeeDetail";
import EmployeeClaimPage from "./modules/reimbursement/pages/EmployeeClaimPage";
import AdminReimbursementPage from "./modules/reimbursement/pages/AdminReimbursementPage";


const SalesRoute = ({ children }) => {
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  // Check: role is sales OR specific email (allowing admin with this email to access)
  if (role === 'sales' || email?.toLowerCase() === 'rambalaji@tutelartechlabs.com') {
    return children;
  }
  // Redirect others to home/login
  return <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const role = localStorage.getItem("userRole");
  if (role === 'admin') {
    return children;
  }
  return <Navigate to="/" />;
};

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Admin Registration Route */}
        <Route path="/admin/register" element={
          <AdminRoute>
            <EngineerLayout>
              <SignupPage isInternal={true} />
            </EngineerLayout>
          </AdminRoute>
        } />

        <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
        <Route path="/engineer/dashboard/profile" element={
          <EngineerLayout>
            <Profile />
          </EngineerLayout>
        } />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/tickets/create" element={<TicketCreationForm />} />
        <Route path="/tickets/:id" element={<TicketDetailsView />} />

        <Route path="/sales/dashboard" element={
          <SalesRoute>
            <SalesDashboard />
          </SalesRoute>
        } />
        <Route path="/sales/create" element={
          <SalesRoute>
            <SalesOpportunityView />
          </SalesRoute>
        } />
        <Route path="/sales/:id" element={
          <SalesRoute>
            <SalesOpportunityView />
          </SalesRoute>
        } />

        {/* Attendance Routes */}
        <Route path="/attendance" element={<Navigate to="/attendance/dashboard" />} />
        <Route path="/attendance/dashboard" element={
          <EngineerLayout>
            <AttendanceEmployeeDashboard />
          </EngineerLayout>
        } />
        <Route path="/attendance/admin" element={
          <EngineerLayout>
            <AttendanceAdminDashboard />
          </EngineerLayout>
        } />
        {/* Profile removed from attendance routes */}
        <Route path="/attendance/admin/employees/:id" element={
          <EngineerLayout>
            <AdminEmployeeDetail />
          </EngineerLayout>
        } />

        {/* Reimbursement Routes */}
        <Route path="/employee/reimbursement" element={
          <EngineerLayout>
            <EmployeeClaimPage />
          </EngineerLayout>
        } />
        <Route path="/admin/reimbursement-approval" element={
          <EngineerLayout>
            <AdminReimbursementPage />
          </EngineerLayout>
        } />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
