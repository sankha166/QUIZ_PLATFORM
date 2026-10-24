import api from './axios';

export const startQuiz = (quizId, data = {}) => api.post(`/quizzes/${quizId}/start`, data);
export const submitQuiz = (quizId, data) => api.post(`/quizzes/${quizId}/submit`, data);
export const getMyAttempts = () => api.get('/attempts');
export const getAttemptById = (id) => api.get(`/attempts/${id}`);
