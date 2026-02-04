import client from './client';

export const membersApi = {
  // 회원 목록 조회
  getList: async (params = {}) => {
    const response = await client.get('/admin/members', { params });
    return response.data;
  },

  // 회원 상세 조회
  getById: async (memberId) => {
    const response = await client.get(`/admin/members/${memberId}`);
    return response.data;
  },

  // 권한 변경
  changeRole: async (memberId, role) => {
    const response = await client.patch(`/admin/members/${memberId}/role`, { role });
    return response.data;
  },

  // 회원 차단
  ban: async (memberId, reason = null) => {
    const response = await client.post(`/admin/members/${memberId}/ban`, { reason });
    return response.data;
  },

  // 차단 해제
  unban: async (memberId) => {
    const response = await client.post(`/admin/members/${memberId}/unban`);
    return response.data;
  },
};
