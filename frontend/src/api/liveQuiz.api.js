import api from './axios';

// Live quiz schedules are PostgreSQL TIMESTAMPTZ absolute instants. Keep the
// returned ISO value intact; never append another +05:30 offset in the client.
const normalizeQuiz = (quiz) => quiz;

export const getLiveQuizzes = async () => {
  const response = await api.get('/live-quizzes');
  if (Array.isArray(response.data?.quizzes)) response.data.quizzes = response.data.quizzes.map(normalizeQuiz);
  return response;
};

export const getLiveQuizStats = (id) => api.get(id ? `/live-quizzes/${id}/stats` : '/live-quizzes/stats');
export const getLiveRanking = () => api.get('/live-quizzes/ranking');
export const getAdminLiveQuizStats = (id) => api.get(`/live-quizzes/${id}/stats`);
export const getLiveRegistration = (id) => api.get(`/live-quizzes/${id}/registration`);
export const registerLiveQuiz = (id) => api.post(`/live-quizzes/${id}/register`);
export const startLiveQuiz = (id) => api.post(`/live-quizzes/${id}/start`);
export const answerLiveQuestion = (id, data) => api.post(`/live-quizzes/${id}/answer`, data);
export const finishLiveQuiz = (id, data) => api.post(`/live-quizzes/${id}/finish`, data);
export const endLiveQuiz = (id) => api.post(`/live-quizzes/${id}/end`);
