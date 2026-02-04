import client from './client';

export const quotesApi = {
  // 문장 목록 조회
  getList: async (params = {}) => {
    const response = await client.get('/admin/quotes', { params });
    return response.data;
  },

  // 문장 승인
  approve: async (quoteId) => {
    const response = await client.post(`/admin/quotes/${quoteId}/approve`);
    return response.data;
  },

  // 문장 거부
  reject: async (quoteId) => {
    const response = await client.post(`/admin/quotes/${quoteId}/reject`);
    return response.data;
  },

  // 문장 수정
  update: async (quoteId, data) => {
    const response = await client.patch(`/admin/quotes/${quoteId}`, data);
    return response.data;
  },

  // 문장 삭제
  delete: async (quoteId) => {
    const response = await client.delete(`/admin/quotes/${quoteId}`);
    return response.data;
  },

  // 문장 숨김
  hide: async (quoteId) => {
    const response = await client.patch(`/admin/quotes/${quoteId}/hide`);
    return response.data;
  },

  // 숨김 해제
  restore: async (quoteId) => {
    const response = await client.post(`/admin/quotes/${quoteId}/restore`);
    return response.data;
  },
};
