import api from './axios';
export const getFavorites=()=>api.get('/favorites');
export const getFavoriteStatus=(quizId)=>api.get(`/favorites/status/${quizId}`);
export const addFavorite=(quizId)=>api.post(`/favorites/${quizId}`);
export const removeFavorite=(quizId)=>api.delete(`/favorites/${quizId}`);
