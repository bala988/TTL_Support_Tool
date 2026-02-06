import { useState } from 'react';
import { LayoutDashboard, TicketPlus, Shield, LogOut, Users, BookOpen, FileText, Briefcase, PieChart, UserPlus, ChevronLeft, ChevronRight, Sun, Moon, ClipboardCheck, UserCog, Pencil } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Sidebar({ userRole = 'engineer', currentPage, onNavigate, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const userEmail = localStorage.getItem("userEmail");
  // Check specifically for the allowed sales email (regardless of role)
  const isSalesAllowed = userEmail?.toLowerCase() === 'rambalaji@tutelartechlabs.com';

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      page: userRole === 'admin' ? 'admin-dashboard' : 'engineer-dashboard',
      roles: ['engineer', 'admin']
    },
    {
      icon: Users,
      label: 'Attendance',
      page: 'attendance', // Matches route in App.jsx (redirects to /attendance/dashboard)
      roles: ['engineer', 'admin', 'sales'],
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
      icon: ClipboardCheck,
      label: 'Expense Approvals',
      page: 'admin/reimbursement-approval',
      roles: ['admin'],
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
      page: 'team-management',
      roles: ['admin']
    },
    {
      icon: UserPlus,
      label: 'Register User',
      page: 'register-user',
      roles: ['admin']
    },
    {
      icon: FileText,
      label: 'Expense Claims',
      page: 'employee/reimbursement', // Matches route in App.jsx
      roles: ['engineer', 'admin', 'sales']
    }
  ];

  const visibleMenuItems = menuItems.filter(item => {
    // Special override for allowed sales user to see sales items regardless of role
    if (item.restricted && isSalesAllowed) return true;

    if (!item.roles.includes(userRole)) return false;

    return true;
  });

  const userName = localStorage.getItem("userName");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const profilePic = storedUser.profilePicture || storedUser.profile_picture;

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'
        } bg-gray-900 border-r border-gray-800 text-white flex flex-col min-h-screen transition-all duration-300 relative dark:bg-servicenow-dark dark:border-servicenow-light`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 bg-indigo-600 text-white p-1 rounded-full shadow-lg hover:bg-indigo-700 transition z-50 border-2 border-slate-50 dark:border-servicenow"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 border-b border-gray-800 dark:border-servicenow-light ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
               <Shield className="w-6 h-6" />
             </div>
             {!isCollapsed && (
               <div className="overflow-hidden">
                 <div className="font-bold truncate">IT Support</div>
                 <div className="text-xs text-gray-400 capitalize truncate">{userRole} Portal</div>
                 {userName && <div className="text-xs text-green-500 mt-1 font-medium truncate">Hello, {userName.split(' ')[0]}</div>}
               </div>
             )}
          </div>
          
          {/* Profile Icon */}
          {!isCollapsed && (
            <div 
              onClick={() => onNavigate('profile')}
              className="group relative w-12 h-12 rounded-full border-2 border-indigo-500 overflow-hidden cursor-pointer hover:border-indigo-400 transition-all shrink-0 flex items-center justify-center bg-gray-800"
              title="Edit Profile"
            >
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-x-hidden">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <button
              key={item.page}
              onClick={() => {
                if (item.external) {
                  window.location.href = item.url(userEmail);
                } else {
                  onNavigate(item.page);
                }
              }}
              title={isCollapsed ? item.label : ""}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
                } py-3 rounded-lg transition ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white dark:hover:bg-servicenow-light'
                }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 dark:border-servicenow-light space-y-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isCollapsed ? (theme === 'dark' ? "Light Mode" : "Dark Mode") : ""}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
            } py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition dark:hover:bg-servicenow-light`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0 text-yellow-400" /> : <Moon className="w-5 h-5 shrink-0" />}
          {!isCollapsed && <span className="font-medium whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={onLogout}
          title={isCollapsed ? "Logout" : ""}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
            } py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition dark:hover:bg-servicenow-light`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </div>
  );
}
