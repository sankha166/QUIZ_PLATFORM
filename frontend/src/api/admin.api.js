import api from './axios';

export const getAdminAnalytics = () => api.get('/admin/analytics');
export const getAdminAttempts = (params) => api.get('/admin/attempts', { params });
export const getAdminAttemptById = (id) => api.get(`/admin/attempts/${id}`);

export const getUsers = (params) => api.get('/users', { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUserStatus = (id, status) => api.patch(`/users/${id}/status`, { status });
export const deleteUser = (id) => api.delete(`/users/${id}`);

export const getLeaderboard = (params) => api.get('/leaderboard', { params });
