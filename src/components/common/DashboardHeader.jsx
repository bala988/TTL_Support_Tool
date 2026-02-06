import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../../modules/attendance/hooks/useAuth'; // Reusing existing hook or need a global one? Logic is generic.

const DashboardHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="bg-white dark:bg-servicenow-light rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-servicenow-dark mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-2">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
           <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName || 'User'}</div>
           <div className="text-xs text-gray-500 dark:text-slate-400">{today}</div>
        </div>

        <Link to="/engineer/dashboard/profile" className="group relative block">
          <div className="w-12 h-12 rounded-full border-2 border-primary-100 dark:border-primary-900 overflow-hidden hover:border-primary-600 transition-colors">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.fullName || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
                {user?.fullName ? user.fullName.charAt(0) : 'U'}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardHeader;
