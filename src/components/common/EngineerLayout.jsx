import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function EngineerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/engineer/dashboard') return 'engineer-dashboard';
    if (path === '/sales/dashboard') return 'sales-dashboard';
    if (path === '/sales/create') return 'create-opportunity';
    if (path.startsWith('/sales/')) return 'create-opportunity'; // For editing too
    if (path === '/tickets/create') return 'create-ticket';
    if (path.startsWith('/tickets/')) return 'ticket-details';
    if (path === '/admin/register') return 'register-user';
    if (path.startsWith('/attendance')) return 'attendance';
    if (path.startsWith('/employee/reimbursement')) return 'employee/reimbursement';
    if (path === '/engineer/dashboard/profile') return 'profile';
    if (path.startsWith('/admin/reimbursement-approval')) return 'admin/reimbursement-approval';
    if (path === '/admin/activity') return 'admin/activity';
    if (path === '/leave/apply') return 'leave/apply';
    if (path === '/leave/my') return 'leave/my';
    if (path === '/admin/leave-approval') return 'admin/leave-approval';
    if (path === '/admin/customers') return 'admin/customers';
    if (path === '/admin/employees') return 'admin/employees';
    return 'engineer-dashboard';
  };

  const handleNavigate = (page) => {
    switch (page) {
      case 'engineer-dashboard':
        navigate('/engineer/dashboard');
        break;
      case 'profile':
        navigate('/engineer/dashboard/profile');
        break;
      case 'sales-dashboard':
        navigate('/sales/dashboard');
        break;
      case 'create-opportunity':
        navigate('/sales/create');
        break;
      case 'create-ticket':
        navigate('/tickets/create');
        break;
      case 'admin-dashboard':
        navigate('/admin/dashboard'); // Placeholder
        break;
      case 'register-user':
        navigate('/admin/register');
        break;
      case 'attendance':
        if (userRole === 'admin') {
          navigate('/attendance/admin');
        } else {
          navigate('/attendance/dashboard');
        }
        break;
      case 'team-management':
        navigate('/admin/dashboard');
        break;
      case 'employee/reimbursement':
        navigate('/employee/reimbursement');
        break;
      case 'admin/reimbursement-approval':
        navigate('/admin/reimbursement-approval');
        break;
      case 'admin/activity':
        navigate('/admin/activity');
        break;
      case 'leave/my':
      case 'leave/apply':
      case 'admin/leave-approval':
      case 'admin/customers':
      case 'admin/employees':
        navigate(`/${page}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-servicenow">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden bg-gradient-to-br from-[#91C4A4]/10 via-slate-50 to-[#94BBE9]/10 dark:from-servicenow dark:via-servicenow dark:to-servicenow">
        {children}
      </main>
    </div>
  );
}
