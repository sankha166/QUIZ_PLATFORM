import api from './axios';

export const getQuizzes = (params) => api.get('/quizzes', { params });
export const getQuizById = (id) => api.get(`/quizzes/${id}`);
export const createQuiz = (data) => api.post('/quizzes', data);
export const updateQuiz = (id, data) => api.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
export const updateQuizStatus = (id, status) => api.patch(`/quizzes/${id}/publish`, { status });

// Questions
export const getQuestions = (quizId) => api.get(`/quizzes/${quizId}/questions`);
export const addQuestion = (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
