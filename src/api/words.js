import client from './client';

export const wordsApi = {
  // 단어 목록 조회
  getList: async (params = {}) => {
    const response = await client.get('/admin/words', { params });
    return response.data;
  },

  // 단어 단일 조회
  getDetail: async (wordId) => {
    const response = await client.get(`/admin/words/${wordId}`);
    return response.data;
  },

  // 단어 등록
  create: async (data) => {
    const response = await client.post('/admin/words', data);
    return response.data;
  },

  // 단어 수정
  update: async (wordId, data) => {
    const response = await client.patch(`/admin/words/${wordId}`, data);
    return response.data;
  },

  // 단어 삭제
  delete: async (wordId) => {
    const response = await client.delete(`/admin/words/${wordId}`);
    return response.data;
  },
};
