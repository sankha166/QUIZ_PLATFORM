import axios from 'axios';

// Allow overriding the API base URL at build time via Vite env var `VITE_API_BASE`.
// Fallback to relative `/api` for local/fullstack deployments where frontend
// and backend are served from the same origin (e.g., reverse-proxy or local dev).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear token and redirect to login.
// Public API requests can opt out by setting `skipAuthRedirect: true` on the request config.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const config = err.config || {};
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!config.skipAuthRedirect) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
