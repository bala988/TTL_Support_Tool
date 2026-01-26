import { LayoutDashboard, TicketPlus, Shield, LogOut, Users, BookOpen, FileText, Briefcase, PieChart, UserPlus } from 'lucide-react';

export default function Sidebar({ userRole = 'engineer', currentPage, onNavigate, onLogout }) {
  const userEmail = localStorage.getItem("userEmail");
  // Check specifically for the allowed sales email (regardless of role)
  const isSalesAllowed = userEmail === 'rambalaji@tutelartechlabs.com';

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      page: userRole === 'admin' ? 'admin-dashboard' : 'engineer-dashboard',
      roles: ['engineer', 'admin']
    },
    {
      icon: PieChart,
      label: 'Sales Dashboard',
      page: 'sales-dashboard',
      roles: ['sales'],
      restricted: true
    },
    {
      icon: Briefcase,
      label: 'New Opportunity',
      page: 'create-opportunity',
      roles: ['sales'],
      restricted: true
    },
    {
      icon: TicketPlus,
      label: 'Create Ticket',
      page: 'create-ticket',
      roles: ['engineer', 'admin']
    },
    {
      icon: FileText,
      label: 'Process Overview',
      page: 'process-overview',
      roles: ['engineer', 'admin']
    },
    {
      icon: BookOpen,
      label: 'References',
      page: 'references',
      roles: ['engineer', 'admin']
    },
    {
      icon: Users,
      label: 'Team Management',
      page: 'admin-dashboard',
      roles: ['admin']
    },
    {
      icon: UserPlus,
      label: 'Register User',
      page: 'register-user',
      roles: ['admin']
    }
  ];

  const visibleMenuItems = menuItems.filter(item => {
    // Special override for allowed sales user to see sales items regardless of role
    if (item.restricted && isSalesAllowed) return true;
    
    if (!item.roles.includes(userRole)) return false;
    
    return true;
  });
  
  const userName = localStorage.getItem("userName");

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold">IT Support</div>
            <div className="text-xs text-gray-400 capitalize">{userRole} Portal</div>
            {userName && <div className="text-xs text-green-500 mt-2 font-medium">Hello, {userName}</div>}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
