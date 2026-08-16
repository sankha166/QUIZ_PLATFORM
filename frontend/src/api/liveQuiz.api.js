import api from './axios';

// PostgreSQL stores live_start_at as an IST wall-clock timestamp without a timezone.
// node-postgres serializes that value as a UTC-looking ISO string, which can make
// the browser add another +05:30. Rebuild the original IST wall-clock explicitly.
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

const normalizeQuiz = (quiz) => {
  if (!quiz || !quiz.is_live_quiz) return quiz;
  return {
    ...quiz,
    live_start_at: normalizeIstWallClock(quiz.live_start_at),
    computed_end_at: normalizeIstWallClock(quiz.computed_end_at),
    live_end_at: normalizeIstWallClock(quiz.live_end_at),
  };
};

export const getLiveQuizzes = async () => {
  const response = await api.get('/live-quizzes');
  if (Array.isArray(response.data?.quizzes)) {
    response.data.quizzes = response.data.quizzes.map(normalizeQuiz);
  }
  return response;
};

export const getLiveQuizStats = () => api.get('/live-quizzes/stats');
export const getLiveRanking = () => api.get('/live-quizzes/ranking');

export const getAdminLiveQuizStats = async (id) => {
  const response = await api.get(`/live-quizzes/${id}/stats`);
  if (response.data?.stats) {
    response.data.stats = normalizeQuiz(response.data.stats);
  }
  return response;
};

export const getLiveRegistration = (id) => api.get(`/live-quizzes/${id}/registration`);
export const registerLiveQuiz = (id) => api.post(`/live-quizzes/${id}/register`);
export const startLiveQuiz = (id) => api.post(`/live-quizzes/${id}/start`);
export const answerLiveQuestion = (id, data) => api.post(`/live-quizzes/${id}/answer`, data);
export const finishLiveQuiz = (id, data) => api.post(`/live-quizzes/${id}/finish`, data);
export const endLiveQuiz = (id) => api.post(`/live-quizzes/${id}/end`);
