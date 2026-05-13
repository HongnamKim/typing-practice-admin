import client from './client';

export const announcementsApi = {
  // 목록 조회 (커서, pinned 제외)
  getList: async (params = {}) => {
    const response = await client.get('/admin/announcements', { params });
    return response.data;
  },

  // 고정 공지 조회
  getPinned: async () => {
    const response = await client.get('/admin/announcements/pinned');
    return response.data;
  },

  // 단건 조회
  getDetail: async (id) => {
    const response = await client.get(`/admin/announcements/${id}`);
    return response.data;
  },

  // 등록
  create: async (data) => {
    const response = await client.post('/admin/announcements', data);
    return response.data;
  },

  // 수정
  update: async (id, data) => {
    const response = await client.patch(`/admin/announcements/${id}`, data);
    return response.data;
  },

  // 삭제 (논리 삭제)
  delete: async (id) => {
    const response = await client.delete(`/admin/announcements/${id}`);
    return response.data;
  },
};
