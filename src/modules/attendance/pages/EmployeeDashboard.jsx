import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import HeaderCard from '../components/employee/HeaderCard';
import AttendanceToggle from '../components/employee/AttendanceToggle';
import WorklogForm from '../components/employee/WorklogForm';
import CalendarView from '../components/employee/CalendarView';
import WorklogHistory from '../components/employee/WorklogHistory';
import Button from '../components/ui/Button';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'calendar', 'history'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-servicenow-dark dark:to-servicenow-dark p-6">
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={logout} className="text-sm">
            Logout
          </Button>
        </div>

        <HeaderCard user={user} />

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 sticky top-4 z-20 bg-white/80 dark:bg-servicenow-light/80 p-2 rounded-xl backdrop-blur-md shadow-sm border border-white/20 dark:border-white/10">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'daily'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'text-dark-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-servicenow'
            }`}
          >
            Daily Entry
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'calendar'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'text-dark-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-servicenow'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                : 'text-dark-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-servicenow'
            }`}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <AttendanceToggle 
                  onAttendanceUpdate={handleRefresh} 
                  refreshTrigger={refreshTrigger}
                />
                <WorklogForm onSuccess={handleRefresh} />
              </div>
              <div className="md:col-span-1">
                <div className="bg-white dark:bg-servicenow-light p-6 rounded-2xl shadow-premium border border-dark-100 dark:border-servicenow-dark sticky top-24">
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Quick Actions</h3>
                  <Button 
                    variant="secondary" 
                    className="w-full mb-3 flex items-center justify-center gap-2"
                    onClick={handleRefresh}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </Button>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 mt-6 sticky top-64">
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-400 mb-2">Tips</h3>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-2 list-disc pl-4">
                    <li>Mark attendance daily to track presence</li>
                    <li>Add worklogs with accurate time ranges</li>
                    <li>Worklogs cannot overlap in time</li>
                    <li>Use detailed activity descriptions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <CalendarView refreshTrigger={refreshTrigger} />
          )}

          {activeTab === 'history' && (
            <WorklogHistory refreshTrigger={refreshTrigger} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
