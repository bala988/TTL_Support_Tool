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
    return 'engineer-dashboard';
  };

  const handleNavigate = (page) => {
    switch (page) {
      case 'engineer-dashboard':
        navigate('/engineer/dashboard');
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
      default:
        break;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-servicenow">
      {/* Sidebar */}
      <Sidebar 
        userRole={userRole}
        currentPage={getCurrentPage()} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
      />

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
