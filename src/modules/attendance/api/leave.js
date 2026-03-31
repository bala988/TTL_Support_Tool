import axios from './axios';

export const leaveAPI = {
  applyLeave: async (data) => {
    const response = await axios.post('/leave/apply', data);
    return response.data;
  },

  getMyLeaves: async () => {
    const response = await axios.get('/leave/my');
    return response.data;
  },

  getAllLeaves: async () => {
    const response = await axios.get('/admin/leaves');
    return response.data;
  },

  reviewLeave: async (id, data) => {
    const response = await axios.put(`/admin/leave/${id}/review`, data);
    return response.data;
  },
};
