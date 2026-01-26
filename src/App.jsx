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

const SalesRoute = ({ children }) => {
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  // Check: role is sales OR specific email (allowing admin with this email to access)
  if (role === 'sales' || email === 'rambalaji@tutelartechlabs.com') {
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

export default function App() {
  return (
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
    </Routes>
  );
}
