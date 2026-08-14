import api from './axios';
export const getQuizReview=(attemptId)=>api.get(`/quiz-reviews/${attemptId}`);
export const submitQuizReview=(data)=>api.post('/quiz-reviews',data);
