import client from './client';

export const authApi = {
  // 로그인 (Google OAuth 콜백 후 토큰 교환)
  login: async (code) => {
    const response = await client.post('/auth/google', {
      code,
      redirectUri: process.env.REACT_APP_REDIRECT_URI,
    });
    return response.data;
  },

  // 현재 사용자 정보
  getMe: async () => {
    const response = await client.get('/members/me');
    return response.data;
  },

  // 로그아웃 (localStorage 처리는 AuthContext에서 담당)
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await client.post('/auth/logout', { refreshToken });
    }
  },
};
