import axios from 'axios';
import { logoutUser, updateAccessToken } from './authHelpers';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.accessToken) {
    config.headers.Authorization = `Bearer ${user.accessToken}`;
    // console.log(`[Request] ${config.method?.toUpperCase()} ${config.url} | Access Token: ${user.accessToken}`);
  }
  return config;
}, (error) => Promise.reject(error));


// Response interceptor for handling 401/403 and refreshing tokens
api.interceptors.response.use(
  (response) => {
    // console.log(`[Response] ${response.config.url} | Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const user = JSON.parse(localStorage.getItem('user'));

    // console.error(`[Error Response] ${originalRequest?.url} | Status: ${error.response?.status}`);

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && user?.refreshToken) {
      // console.warn('Access token expired. Attempting refresh...');
      originalRequest._retry = true;

      try {
        const res = await api.post('/refresh', { refreshToken: user.refreshToken });
        // console.log('Token refresh successful', res.data);

        if (res.data.accessToken) {
          updateAccessToken(res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // console.error('Token refresh failed:', refreshError);
        logoutUser();  // handles redirection too
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
