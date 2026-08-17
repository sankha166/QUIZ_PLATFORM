import api from './axios';
export const getDomains = () => api.get('/domains');
export const createDomain = (data) => api.post('/domains', data);
export const updateDomain = (id, data) => api.put(`/domains/${id}`, data);
export const deleteDomain = (id) => api.delete(`/domains/${id}`);

// Axios/browser must generate the multipart boundary. The backend supports
// both paths so older deployments do not turn a valid upload into a 405.
export const importQuestions = async (formData) => {
  try {
    return await api.post('/admin/import-questions', formData);
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 405) throw error;
    return api.post('/admin/quizzes/import-questions', formData);
  }
};
