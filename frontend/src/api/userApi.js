import api from './axois.js';
import { getAuthHeader } from './authHelpers.js';

export const fetchAllUsers = async () => {
  const response = await api.get('/admin/users', getAuthHeader());
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`, getAuthHeader());
  return response.data;
}