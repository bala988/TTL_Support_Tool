import axios from '../modules/attendance/api/axios';

export const userAPI = {
  // Update profile
  updateProfile: async (data) => {
    // We are keeping the backend route /api/attendance/profile for now as per plan
    // But conceptually this is a user update.
    // If I change backend route, I update this.
    // Let's stick to the existing route for now to ensure backend works without code changes there yet.
    const response = await axios.put('/attendance/profile', data);
    return response.data;
  },
};
