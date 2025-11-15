import '../styles/components/HeaderNav.css';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { signOutUser } from '../services/authApi';

export default function HeaderNav() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setError = useAuthStore((state) => state.setError);

  const handleLogout = async () => {
    try {
      await logout(signOutUser);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setError('로그아웃에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <header className="header-nav">
      <div className="header-nav__brand">
        <Link to="/" className="header-nav__title">
          항소 컴퓨터 예약 시스템
        </Link>
      </div>
      <nav className="header-nav__menu">
        <NavLink to="/" className="header-nav__link">
          홈
        </NavLink>
        <NavLink to="/mypage" className="header-nav__link">
          마이페이지
        </NavLink>
        <NavLink to="/admin" className="header-nav__link">
          관리자
        </NavLink>
      </nav>
      <div className="header-nav__user">
        {user ? (
          <>
            <span className="header-nav__user-name">{user.displayName || user.email}</span>
            <button type="button" className="header-nav__logout" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login" className="header-nav__login-link">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
