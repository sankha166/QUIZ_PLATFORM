import api from './axios';
export const submitQuizReview=(data)=>api.post('/quiz-reviews',data);
