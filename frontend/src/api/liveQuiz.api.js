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

// The dedicated result endpoint is authoritative. Keep a stats fallback so an
// older backend deployment cannot make the Past Contest card appear dead.
export const getLiveQuizResult = async (id) => {
  try {
    return await api.get(`/live-quiz-results/${id}`);
  } catch (error) {
    const fallback = await api.get(`/live-quizzes/${id}/stats`);
    return {
      ...fallback,
      data: {
        ...fallback.data,
        result: {
          ...(fallback.data?.stats || {}),
          id,
          title: fallback.data?.stats?.title || 'Live quiz result',
          question_count: fallback.data?.stats?.question_count ?? 0,
          attempts: fallback.data?.stats?.attempts ?? 0,
          students: fallback.data?.stats?.students ?? 0,
          avg_rating: fallback.data?.stats?.avg_rating ?? 0,
          attempted: fallback.data?.stats?.attempted ?? false,
          rating: fallback.data?.stats?.rating ?? 0,
          rank: fallback.data?.stats?.rank ?? null,
          answered: fallback.data?.stats?.answered ?? 0,
          correct: fallback.data?.stats?.correct ?? 0,
          wrong: fallback.data?.stats?.wrong ?? 0,
          unanswered: fallback.data?.stats?.unanswered ?? 0,
        },
      },
    };
  }
};

export const getLiveRanking = () => api.get('/live-quizzes/ranking');
export const getAdminLiveQuizStats = (id) => api.get(`/live-quizzes/${id}/stats`);
export const getLiveRegistration = (id) => api.get(`/live-quizzes/${id}/registration`);
export const registerLiveQuiz = (id) => api.post(`/live-quizzes/${id}/register`);
export const startLiveQuiz = (id) => api.post(`/live-quizzes/${id}/start`);
export const answerLiveQuestion = (id, data) => api.post(`/live-quizzes/${id}/answer`, data);
export const finishLiveQuiz = (id, data) => api.post(`/live-quizzes/${id}/finish`, data);
export const endLiveQuiz = (id) => api.post(`/live-quizzes/${id}/end`);
