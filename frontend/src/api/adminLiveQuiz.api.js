import api from './axios';

export const getAdminLiveQuizzes = () => api.get('/live-quizzes');
export const getAdminLiveQuizStats = (id) => api.get(`/live-quizzes/${id}/stats`);
export const publishLiveQuiz = (id) =>
  api.patch(`/quizzes/${id}/publish`, { status: 'published' });
export const unpublishLiveQuiz = (id) =>
  api.patch(`/quizzes/${id}/publish`, { status: 'unpublished' });
export const deleteLiveQuiz = (id) => api.delete(`/quizzes/${id}`);
