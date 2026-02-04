import client from './client';

export const reportsApi = {
  // 신고 목록 조회
  getList: async (params = {}) => {
    const response = await client.get('/admin/reports', { params });
    return response.data;
  },

  // 신고 상세 조회
  getById: async (reportId) => {
    const response = await client.get(`/admin/reports/${reportId}`);
    return response.data;
  },

  // 신고 처리 (수정 또는 삭제)
  process: async (quoteId, data = {}) => {
    const response = await client.post(`/admin/reports/${quoteId}/process`, data);
    return response.data;
  },

  // 신고 삭제
  delete: async (reportId) => {
    const response = await client.delete(`/admin/reports/${reportId}`);
    return response.data;
  },
};
