import api from './axios';

const normalizeIstWallClock = (value) => {
  if (!value) return value;
  const text = String(value);
  if (/[zZ]$/.test(text)) {
    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+05:30`;
    }
  }
  return text;
};

export const getQuizzes = (params) => api.get('/quizzes', { params, skipAuthRedirect: true });

// Keep a live quiz's datetime-local value in IST. The DB intentionally stores
// the Indian wall-clock time without a timezone, so converting the returned
// ISO value as a normal instant would incorrectly add another 5h30m.
export const getQuizById = async (id) => {
  const response = await api.get(`/quizzes/${id}`);
  if (response.data?.quiz?.is_live_quiz) {
    response.data.quiz = {
      ...response.data.quiz,
      live_start_at: normalizeIstWallClock(response.data.quiz.live_start_at),
      live_end_at: normalizeIstWallClock(response.data.quiz.live_end_at),
    };
  }
  return response;
};

export const createQuiz = (data) => api.post('/quizzes', data);
export const updateQuiz = (id, data) => api.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
export const updateQuizStatus = (id, status) => api.patch(`/quizzes/${id}/publish`, { status });

export const getQuestions = (quizId) => api.get(`/quizzes/${quizId}/questions`);
export const addQuestion = (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// IMPORTANT: domain_id must stay as the database numeric ID.
// Converting it to a slug here breaks Domain -> Category filtering and quiz matching.
export const getCategories = (params) => api.get('/categories', { params });

export const createCategory = async (data) => {
  const payload = { ...data };
  if (!Number.isInteger(Number(payload.domain_id))) {
    const response = await api.get('/domains');
    const domain = (response.data.domains || []).find(
      (d) =>
        String(d.id) === String(payload.domain_id) ||
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
      (d) =>
        String(d.id) === String(payload.domain_id) ||
        String(d.name).toLowerCase() === String(payload.domain_name || '').toLowerCase()
    );
    if (!domain) throw new Error('Selected domain was not found');
    payload.domain_id = domain.id;
  }
  return api.put(`/categories/${id}`, payload);
};

export const deleteCategory = (id) => api.delete(`/categories/${id}`);
