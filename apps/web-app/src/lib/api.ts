import axios from 'axios';
import type { ResumeData } from '@resume-platform/shared-types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const resumeApi = {
  create: (data: Partial<ResumeData>) => api.post<ResumeData>('/resumes', data).then((r) => r.data),
  update: (id: string, data: Partial<ResumeData>) =>
    api.put<ResumeData>(`/resumes/${id}`, data).then((r) => r.data),
  getAll: (guestId?: string) =>
    api.get<ResumeData[]>('/resumes', { params: guestId ? { guestId } : {} }).then((r) => r.data),
  getOne: (id: string) => api.get<ResumeData>(`/resumes/${id}`).then((r) => r.data),
  remove: (id: string) => api.delete(`/resumes/${id}`),
};

export const pdfApi = {
  generate: (resumeId: string, template: string, format = 'A4') =>
    api
      .post('/pdf/generate', { resumeId, template, format }, { responseType: 'blob' })
      .then((r) => r.data as Blob),
};

export default api;
