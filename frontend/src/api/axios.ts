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
      console.log('API error:', status, error.config?.url);

      if (status === 401) {
        // Token expired or invalid — clear and redirect to login
        localStorage.removeItem('token');
        console.log('401 error - redirecting to login');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        // Forbidden — user doesn't have the right role
        const requestUrl = error.config?.url || '';
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
