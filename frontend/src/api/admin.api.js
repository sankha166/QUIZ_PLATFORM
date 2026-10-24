import api from './axios';
export const getAdminAnalytics=(params={})=>api.get('/admin/analytics',{params});
export const getAdminAttempts=(params)=>api.get('/admin/attempts',{params});
export const getAdminAttemptById=(id)=>api.get(`/admin/attempts/${id}`);
export const getQuestionReports=(params)=>api.get('/admin/question-reports',{params});
export const updateQuestionReport=(id,data)=>api.patch(`/admin/question-reports/${id}`,data);
export const getUsers=(params)=>api.get('/users',{params});export const getUserById=(id)=>api.get(`/users/${id}`);export const updateUserStatus=(id,status)=>api.patch(`/users/${id}/status`,{status});export const deleteUser=(id)=>api.delete(`/users/${id}`);export const getLeaderboard=(params)=>api.get('/leaderboard',{params});
