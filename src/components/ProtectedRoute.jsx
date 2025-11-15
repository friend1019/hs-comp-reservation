import '../styles/components/ProtectedRoute.css';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import EmptyState from './EmptyState';

export default function ProtectedRoute({ children }) {
  const { user, status } = useAuthStore();
  const location = useLocation();
  const isVerificationMode =
    location.pathname === '/init' &&
    new URLSearchParams(location.search || '').get('mode') === 'verifyEmail';

  if (status === 'loading') {
    return (
      <div className="protected-route__loading">
        <EmptyState
          title="인증 처리 중"
          description="잠시만 기다려주세요. 계정 정보를 확인하고 있습니다."
        />
      </div>
    );
  }

  if (!user) {
    if (isVerificationMode) {
      return <div className="protected-route">{children}</div>;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.isInitialized && location.pathname !== '/init') {
    return <Navigate to="/init" replace />;
  }

  return <div className="protected-route">{children}</div>;
}
