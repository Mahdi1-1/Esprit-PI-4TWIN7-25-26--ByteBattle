// src/api/axios.ts
import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4001';

const api = axios.create({
  baseURL: `${backendUrl}/api`, // Ajustez selon votre backend
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (not authenticated) and 403 (forbidden / wrong role)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      const requestUrl: string = error.config?.url || '';
      const isAuthPublicEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/verify-email') ||
        requestUrl.includes('/auth/resend-verification') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password');

      console.log('API error:', status, requestUrl);

      if (status === 401) {
        // Do not hijack expected auth errors (e.g., invalid login credentials).
        if (isAuthPublicEndpoint) {
          return Promise.reject(error);
        }

        // Token expired or invalid — clear and redirect to login.
        localStorage.removeItem('token');
        console.log('401 error - redirecting to login');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        // Forbidden — user doesn't have the right role
        if (requestUrl.includes('/challenges/generate')) {
          return Promise.reject(error);
        }

        if (window.location.pathname !== '/403') {
          window.location.href = '/403';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
