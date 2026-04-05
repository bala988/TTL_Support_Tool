import { useState } from 'react';
import { LayoutDashboard, TicketPlus, Shield, LogOut, Users, BookOpen, FileText, Briefcase, PieChart, UserPlus, ChevronLeft, ChevronRight, Sun, Moon, ClipboardCheck, UserCog, Pencil, Activity, CalendarDays, CalendarCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { isSuperAdmin } from '../../utils/superAdmin';

export default function Sidebar({ userRole = 'engineer', currentPage, onNavigate, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const userEmail = localStorage.getItem("userEmail");
  const isSalesAllowed = isSuperAdmin(userEmail);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      page: userRole === 'admin' ? 'admin-dashboard' : 'engineer-dashboard',
      roles: ['engineer', 'admin']
    },
    {
      icon: Users,
      label: userRole === 'admin' ? 'Work Report' : 'My Activity',
      page: 'attendance', // Matches route in App.jsx (redirects to /attendance/dashboard)
      roles: ['engineer', 'admin', 'sales'],
    },
    {
      icon: Activity,
      label: 'My Activity',
      page: 'admin/activity',
      roles: ['admin']
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
      roles: ['admin'],
      subItems: [
        { label: 'Customer Management', page: 'admin/customers' },
        { label: 'Employee Management', page: 'admin/employees' },
      ]
    },
    {
      icon: FileText,
      label: 'Expense Claims',
      page: 'employee/reimbursement', // Matches route in App.jsx
      roles: ['engineer', 'admin', 'sales']
    },
    {
      icon: CalendarDays,
      label: 'Leave',
      page: 'leave/my',
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
        className="absolute -right-3 top-9 bg-primary-600 text-white p-1 rounded-full shadow-lg hover:bg-primary-700 transition z-50 border-2 border-slate-50 dark:border-servicenow"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 border-b border-gray-800 dark:border-servicenow-light ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-3'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-10 h-10 bg-white rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                <img src="data:image/jpeg;base64,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" alt="TTL" className="w-full h-full object-cover" />
             </div>
             {!isCollapsed && (
               <div className="overflow-hidden">
                 <div className="font-bold truncate">TTL Support</div>
                 <div className="text-xs text-gray-400 capitalize truncate">{userRole} Portal</div>
                 {userName && <div className="text-xs text-green-500 mt-1 font-medium truncate">Hello, {userName.split(' ')[0]}</div>}
               </div>
             )}
          </div>
          
          {/* Profile Icon */}
          {!isCollapsed && (
            <div 
              onClick={() => onNavigate('profile')}
              className="group relative w-12 h-12 rounded-full border-2 border-primary-500 overflow-hidden cursor-pointer hover:border-primary-400 transition-all shrink-0 flex items-center justify-center bg-gray-800"
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

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isSubItemActive = hasSubItems && item.subItems.some(sub => currentPage === sub.page);
          const isActive = currentPage === item.page || isSubItemActive;

          return (
            <div key={item.label}>
              <button
                onClick={() => {
                  if (item.external) {
                    window.location.href = item.url(userEmail);
                  } else if (item.page) {
                    onNavigate(item.page);
                  }
                }}
                title={isCollapsed ? item.label : ""}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
                  } py-3 rounded-lg transition ${isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white dark:hover:bg-servicenow-light'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </button>

              {hasSubItems && !isCollapsed && (
                <div className="mt-1 ml-9 space-y-1">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.page}
                      onClick={() => onNavigate(sub.page)}
                      className={`w-full text-left px-4 py-2 rounded-md transition text-sm ${currentPage === sub.page
                          ? 'bg-primary-600/20 text-primary-400 font-medium'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
