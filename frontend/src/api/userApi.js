import api from './client.js';

export const loginAPI = async (credentials) => (await api.post('/login', credentials)).data;

export const signupAPI = async (details) => (await api.post('/signup', details)).data;

export const logoutAPI = async (refreshToken) => (await api.post('/logout', { refreshToken })).data;

export const forgotPasswordAPI = async (email) => (await api.post('/forgot-password', { email })).data;

export const resetPasswordAPI = async (token, newPassword) =>
  (await api.post('/reset-password', { token, newPassword })).data;

export const fetchProfile = async () => (await api.get('/profile')).data;

export const updateProfileAPI = async (details) => (await api.patch('/profile', details)).data;

export const changePasswordAPI = async (currentPassword, newPassword) =>
  (await api.post('/profile/password', { currentPassword, newPassword })).data;

export const logoutAllAPI = async () => (await api.post('/logout-all')).data;

export const fetchAllUsers = async () => (await api.get('/admin/users')).data;

export const updateUserRole = async (userId, role) =>
  (await api.patch(`/admin/users/${userId}/role`, { role })).data;

export const deleteUser = async (userId) => (await api.delete(`/admin/users/${userId}`)).data;
