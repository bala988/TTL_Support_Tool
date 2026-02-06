import { format } from 'date-fns';
import Card from '../ui/Card';
import { Link } from 'react-router-dom';

const HeaderCard = ({ user }) => {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl shadow-lg bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold hidden sm:flex">
             TTL
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2 text-shadow-sm">
              Welcome, {user && user.fullName ? user.fullName.split(' ')[0] : 'User'}!
            </h1>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-primary-50">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <span className="font-medium text-sm">{user?.employeeId || 'ID'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{today}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative">
          <div className="w-16 h-16 rounded-full border-4 border-white/30 shadow-xl overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.fullName || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {user?.fullName ? user.fullName.charAt(0) : 'U'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HeaderCard;
