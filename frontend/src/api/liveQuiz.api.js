import api from './axios';
export const getLiveQuizzes=()=>api.get('/live-quizzes');
export const getLiveQuizStats=()=>api.get('/live-quizzes/stats');
export const getLiveRegistration=(id)=>api.get(`/live-quizzes/${id}/registration`);
export const registerLiveQuiz=(id)=>api.post(`/live-quizzes/${id}/register`);
