import api from './axios';
export const getQuizReview=(attemptId)=>api.get(`/quiz-reviews/${attemptId}`);
export const submitQuizReview=(data)=>api.post('/quiz-reviews',data);
export const submitQuestionReport=(data)=>api.post('/quiz-reviews/question-report',data);
export const getShortFeedback=(data)=>api.post('/quiz-reviews/short-feedback',data);
