import axios from './axios';

export const regularizationAPI = {
  apply: async (data) => {
    const response = await axios.post('/regularization/apply', data);
    return response.data;
  },

  getMyRequests: async () => {
    const response = await axios.get('/regularization/my');
    return response.data;
  },

  getAllRequests: async () => {
    const response = await axios.get('/admin/regularizations');
    return response.data;
  },

  review: async (id, data) => {
    const response = await axios.put(`/admin/regularization/${id}/review`, data);
    return response.data;
  },
};
