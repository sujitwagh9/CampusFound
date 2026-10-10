import axios from 'axios';
import { getSession, setSession, updateSession } from './session.js';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');

// No default Content-Type: axios picks JSON for objects and multipart for FormData
const api = axios.create({ baseURL: API_URL });

// Requests that must never trigger a token refresh
const AUTH_ENDPOINTS = ['/login', '/signup', '/auth/google', '/refresh', '/logout', '/forgot-password', '/reset-password'];

api.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Several requests can fail with 401 at once; they all wait for one refresh
let refreshPromise = null;

const refreshTokens = async () => {
  const session = getSession();
  if (!session?.refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post(`${API_URL}/refresh`, { refreshToken: session.refreshToken });
  updateSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
  return data.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = AUTH_ENDPOINTS.includes(original?.url);

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint && getSession()) {
      original._retry = true;
      try {
        refreshPromise ??= refreshTokens().finally(() => {
          refreshPromise = null;
        });
        const accessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        // Session is no longer valid; AuthContext reacts and routes redirect to /login
        setSession(null);
        sessionStorage.setItem('authMessage', 'Your session has expired. Please sign in again.');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/** Best human-readable message from an API error. */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
};

/** Field -> message map from a validation error, for inline form errors. */
export const fieldErrors = (err) =>
  Object.fromEntries((err?.response?.data?.errors || []).map((e) => [e.field, e.message]));

export default api;
