import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        try {
          const userData = await authApi.getMe();
          if (cancelled) return;
          if (userData.role === 'ADMIN') {
            setUser(userData);
          } else {
            clearTokens();
          }
        } catch (error) {
          if (cancelled) return;
          console.error('Failed to get user info:', error);
          clearTokens();
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    try {
      const userData = await authApi.getMe();
      if (userData.role !== 'ADMIN') {
        clearTokens();
        throw new Error('관리자 권한이 필요합니다.');
      }
      setUser(userData);
    } catch (error) {
      clearTokens();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
