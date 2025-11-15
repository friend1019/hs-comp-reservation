import './styles/components/routes.css';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './pages/LoginPage';
import InitPage from './pages/InitPage';
import HomePage from './pages/HomePage';
import ComputerDetailPage from './pages/ComputerDetailPage';
import MyPage from './pages/MyPage';
import AdminPage from './pages/AdminPage';

export default function AppRoutes() {
  return (
    <div className="routes">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/init" element={<InitPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/computer/:id"
          element={
            <ProtectedRoute>
              <ComputerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Routes>
    </div>
  );
}
