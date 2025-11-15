import '../styles/components/AdminRoute.css';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import EmptyState from './EmptyState';

export default function AdminRoute({ children }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isInitialized) {
    return <Navigate to="/init" replace />;
  }

  const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');

  if (!isAdmin) {
    return (
      <div className="admin-route__unauthorized">
        <EmptyState
          title="권한이 필요합니다"
          description="관리자 전용 페이지입니다. 접근 권한이 없습니다."
        />
      </div>
    );
  }

  return <div className="admin-route">{children}</div>;
}
