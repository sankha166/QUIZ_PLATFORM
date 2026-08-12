import api from './axios';
export const getDomains=()=>api.get('/domains');
export const createDomain=(data)=>api.post('/domains',data);
export const updateDomain=(id,data)=>api.put(`/domains/${id}`,data);
export const deleteDomain=(id)=>api.delete(`/domains/${id}`);
export const importQuestions=(formData)=>api.post('/admin/import-questions',formData,{headers:{'Content-Type':'multipart/form-data'}});
