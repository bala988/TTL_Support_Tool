import axios from './axios';

export const punchAPI = {
  punchIn: async (data) => {
    const response = await axios.post('/punch/in', data);
    return response.data;
  },

  punchOut: async () => {
    const response = await axios.post('/punch/out');
    return response.data;
  },

  getTodayPunch: async () => {
    const response = await axios.get('/punch/today');
    return response.data;
  },

  getWeeklySummary: async (weekOffset = 0) => {
    const response = await axios.get(`/punch/weekly?weekOffset=${weekOffset}`);
    return response.data;
  },
};
