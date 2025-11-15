import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/pages/LoginPage.css';
import useAuthStore from '../stores/authStore';
import { signInWithCredentials } from '../services/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from;
  const from =
    typeof fromLocation === 'string'
      ? fromLocation
      : fromLocation
      ? `${fromLocation.pathname}${fromLocation.search || ''}`
      : '/';
  const { login, error, status } = useAuthStore();
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const trimmedIdentifier = credentials.identifier.trim().toLowerCase();
      const email = trimmedIdentifier.includes('@')
        ? trimmedIdentifier
        : `${trimmedIdentifier}@office.hanseo.ac.kr`;

      await login(signInWithCredentials, { email, password: credentials.password });
      navigate(from, { replace: true });
    } catch (submitError) {
      console.error('로그인 실패:', submitError);
    }
  };

  return (
    <div className="login-page">
      <section className="login-page__panel">
        <h1 className="login-page__title">컴퓨터 예약 시스템 로그인</h1>
        <p className="login-page__subtitle">학교 컴퓨터 예약을 위해 계정으로 로그인하세요.</p>
        <form className="login-page__form" onSubmit={handleSubmit}>
          <label className="login-page__field">
            <span className="login-page__field-label">학교 이메일</span>
            <input
              className="login-page__input"
              type="text"
              name="identifier"
              value={credentials.identifier}
              onChange={handleChange}
              placeholder="예: 202400001@office.hanseo.ac.kr"
              required
            />
          </label>
          <label className="login-page__field">
            <span className="login-page__field-label">비밀번호</span>
            <input
              className="login-page__input"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••"
              required
            />
          </label>
          {error && <p className="login-page__error">{error}</p>}
          <button
            className="login-page__submit"
            type="submit"
            disabled={status === 'loading'}
          >
            로그인
          </button>
        </form>
      </section>
    </div>
  );
}
