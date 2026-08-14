import api from './axios';
export const getAdminLiveQuizzes=()=>api.get('/live-quizzes');
export const getAdminLiveStats=()=>api.get('/live-quizzes/stats');
export const getAdminLiveQuizStats=(id)=>api.get(`/live-quizzes/${id}/stats`);
