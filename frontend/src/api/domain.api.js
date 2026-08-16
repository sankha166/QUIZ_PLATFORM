import api from './axios';
export const getDomains=()=>api.get('/domains');
export const createDomain=(data)=>api.post('/domains',data);
export const updateDomain=(id,data)=>api.put(`/domains/${id}`,data);
export const deleteDomain=(id)=>api.delete(`/domains/${id}`);
// Let Axios/browser generate the multipart boundary. Manually setting Content-Type
// can produce a malformed request in some browsers/proxies and was the source of
// the intermittent 405/empty upload behaviour.
export const importQuestions=(formData)=>api.post('/admin/import-questions',formData);
