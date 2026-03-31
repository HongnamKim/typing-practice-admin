import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import MembersPage from './pages/MembersPage';
import QuotesPage from './pages/QuotesPage';
import ReportsPage from './pages/ReportsPage';
import BatchPage from './pages/BatchPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  // OAuth 콜백 (code 파라미터가 있으면 LoginPage로)
  if (searchParams.get('code')) {
    return <LoginPage />;
  }

  if (loading) {
    return null;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/members" replace />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="batch" element={<BatchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/members" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider locale={koKR}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
