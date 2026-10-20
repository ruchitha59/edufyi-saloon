import axios from 'axios';
import { clearAuthStorage, getAuthLoginPath, getStoredAuthRole, getStoredAuthToken } from '../utils/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = config.headers.Authorization || `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = /\/(auth\/(login|verify-otp|staff-admin-login|register)|admin\/login|staff\/login)\b/.test(error?.config?.url || '');

    if (error?.response?.status === 401 && !isAuthEndpoint) {
      const role = getStoredAuthRole();
      clearAuthStorage();

      if (typeof window !== 'undefined') {
        const redirectPath = getAuthLoginPath(role);

        if (window.location.pathname !== redirectPath) {
          window.location.replace(redirectPath);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
