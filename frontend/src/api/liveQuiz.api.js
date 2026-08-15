import api from './axios';
export const getLiveQuizzes=()=>api.get('/live-quizzes');
export const getLiveQuizStats=()=>api.get('/live-quizzes/stats');
export const getAdminLiveQuizStats=id=>api.get(`/live-quizzes/${id}/stats`);
export const getLiveRegistration=id=>api.get(`/live-quizzes/${id}/registration`);
export const registerLiveQuiz=id=>api.post(`/live-quizzes/${id}/register`);
export const startLiveQuiz=id=>api.post(`/live-quizzes/${id}/start`);
export const answerLiveQuestion=(id,data)=>api.post(`/live-quizzes/${id}/answer`,data);
export const finishLiveQuiz=(id,data)=>api.post(`/live-quizzes/${id}/finish`,data);
