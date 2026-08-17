import api from './axios';

export const getQuizzes = (params) => api.get('/quizzes', { params, skipAuthRedirect: true });

// Live quiz timestamps are stored as PostgreSQL TIMESTAMPTZ. Keep the ISO
// instant returned by the API intact; converting UTC fields into another
// +05:30 offset here would display the wrong wall-clock time in the form.
export const getQuizById = (id) => api.get(`/quizzes/${id}`);

export const createQuiz = (data) => api.post('/quizzes', data);
export const updateQuiz = (id, data) => api.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
export const updateQuizStatus = (id, status) => api.patch(`/quizzes/${id}/publish`, { status });

export const getQuestions = (quizId) => api.get(`/quizzes/${quizId}/questions`);
export const addQuestion = (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// IMPORTANT: domain_id must stay as the database numeric ID.
export const getCategories = (params) => api.get('/categories', { params });

export const createCategory = async (data) => {
  const payload = { ...data };
  if (!Number.isInteger(Number(payload.domain_id))) {
    const response = await api.get('/domains');
    const domain = (response.data.domains || []).find(
      (d) => String(d.id) === String(payload.domain_id) ||
        String(d.name).toLowerCase() === String(payload.domain_name || '').toLowerCase()
    );
    if (!domain) throw new Error('Selected domain was not found');
    payload.domain_id = domain.id;
  }
  return api.post('/categories', payload);
};

export const updateCategory = async (id, data) => {
  const payload = { ...data };
  if (!Number.isInteger(Number(payload.domain_id))) {
    const response = await api.get('/domains');
    const domain = (response.data.domains || []).find(
      (d) => String(d.id) === String(payload.domain_id) ||
        String(d.name).toLowerCase() === String(payload.domain_name || '').toLowerCase()
    );
    if (!domain) throw new Error('Selected domain was not found');
    payload.domain_id = domain.id;
  }
  return api.put(`/categories/${id}`, payload);
};

export const deleteCategory = (id) => api.delete(`/categories/${id}`);
