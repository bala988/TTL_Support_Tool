import axios from './axios';

export const adminAPI = {
  // Get all employees
  getAllEmployees: async (params = {}) => {
    const { search, sortBy, order } = params;
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (order) queryParams.append('order', order);
    
    const response = await axios.get(`/admin/employees?${queryParams.toString()}`);
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    const response = await axios.get(`/admin/employees/${id}`);
    return response.data;
  },

  // Get employee worklogs
  getEmployeeWorklogs: async (id, month) => {
    const response = await axios.get(`/admin/employees/${id}/worklogs?month=${month}`);
    return response.data;
  },

  // Get employee attendance
  getEmployeeAttendance: async (id, month) => {
    const response = await axios.get(`/admin/employees/${id}/attendance?month=${month}`);
    return response.data;
  },

  // Export employee CSV
  exportEmployeeCSV: async (id, from, to) => {
    const response = await axios.get(`/admin/employees/${id}/export/csv?from=${from}&to=${to}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  // Export global attendance CSV
  exportGlobalAttendanceCSV: async (from, to) => {
    const response = await axios.get(`/admin/attendance/export?from=${from}&to=${to}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await axios.get('/admin/stats');
    return response.data;
  },
};
