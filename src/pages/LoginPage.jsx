import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Typography, message, Spin } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api';

const { Title, Text } = Typography;

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processingRef = useRef(false);

  // 이미 로그인 되어있으면 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      navigate('/members', { replace: true });
    }
  }, [user, loading, navigate]);

  // Google OAuth 콜백 처리
  useEffect(() => {
    const handleGoogleCallback = async (code) => {
      // 이미 처리 중이면 무시
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const data = await authApi.login(code);
        
        // URL에서 code 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname);
        
        await login(data.accessToken, data.refreshToken);
        message.success('로그인 성공!');
        navigate('/members', { replace: true });
      } catch (error) {
        console.error('Login error:', error);
        message.error(error.message || '로그인에 실패했습니다.');
        window.history.replaceState({}, '', '/login');
        processingRef.current = false;
      }
    };

    const code = searchParams.get('code');
    if (code && !processingRef.current) {
      handleGoogleCallback(code);
    }
  }, [searchParams, login, navigate]);

  const handleGoogleLogin = () => {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    window.location.href = googleAuthUrl.toString();
  };

  if (loading || searchParams.get('code')) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={2}>TP Admin</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          관리자 계정으로 로그인하세요
        </Text>
        <Button
          type="primary"
          icon={<GoogleOutlined />}
          size="large"
          onClick={handleGoogleLogin}
          style={{ width: '100%' }}
        >
          Google로 로그인
        </Button>
      </Card>
    </div>
  );
}
