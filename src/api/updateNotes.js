import client from './client';

export const updateNotesApi = {
  // 목록 조회 (커서)
  getList: async (params = {}) => {
    const response = await client.get('/admin/update-notes', { params });
    return response.data;
  },

  // 단건 조회
  getDetail: async (id) => {
    const response = await client.get(`/admin/update-notes/${id}`);
    return response.data;
  },

  // 등록
  create: async (data) => {
    const response = await client.post('/admin/update-notes', data);
    return response.data;
  },

  // 수정
  update: async (id, data) => {
    const response = await client.patch(`/admin/update-notes/${id}`, data);
    return response.data;
  },

  // 삭제 (논리 삭제)
  delete: async (id) => {
    const response = await client.delete(`/admin/update-notes/${id}`);
    return response.data;
  },
};
