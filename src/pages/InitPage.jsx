import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/pages/InitPage.css';
import {
  EmailAuthProvider,
  applyActionCode,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  updatePassword
} from 'firebase/auth';
import useAuthStore from '../stores/authStore';
import { auth } from '../firebase/firebaseApp';
import { markUserInitialized } from '../services/userApi';

export default function InitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, status } = useAuthStore();
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(Boolean(user?.emailVerified));
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [stepError, setStepError] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const mode = query.get('mode');
  const oobCode = query.get('oobCode');
  const isVerificationMode = mode === 'verifyEmail';

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!user) {
      if (!isVerificationMode) {
        navigate('/login', { replace: true });
      }
      return;
    }

    if (user.isInitialized) {
      navigate('/', { replace: true });
    }
  }, [isVerificationMode, navigate, status, user]);

  useEffect(() => {
    if (isVerificationMode && oobCode && !emailVerified) {
      handleVerifyLink(oobCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerificationMode, oobCode]);

  useEffect(() => {
    if (user?.emailVerified) {
      setEmailVerified(true);
      setEmailSent(true);
    }
  }, [user?.emailVerified]);

  const handleSendEmail = async () => {
    if (!auth.currentUser) {
      setStepError('로그인 정보가 만료되었습니다. 다시 로그인해주세요.');
      return;
    }

    setIsSending(true);
    setStepError('');

    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/init?mode=verifyEmail`,
        handleCodeInApp: true
      });
      setEmailSent(true);
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      setStepError('이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyLink = async (code) => {
    setIsVerifying(true);
    setStepError('');

    try {
      await applyActionCode(auth, code);
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
      }
      setEmailVerified(true);
      setVerificationMessage('이메일 인증이 완료되었습니다. 초기 설정을 이어가주세요.');
      if (auth.currentUser) {
        navigate('/init', { replace: true });
      }
    } catch (error) {
      console.error('인증 처리 실패:', error);
      setStepError('인증 처리에 실패했습니다. 링크를 다시 확인하거나 이메일을 재발송해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setStepError('');

    if (!passwords.currentPassword) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!auth.currentUser) {
      setStepError('로그인 정보가 만료되었습니다. 다시 로그인해주세요.');
      return;
    }

    setIsCompleting(true);

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email || computedEmail,
        passwords.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwords.newPassword);
      await markUserInitialized(user.uid);
      setUser({ ...user, isInitialized: true });
      navigate('/', { replace: true });
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
        setPasswordError('현재 비밀번호가 올바르지 않습니다. 다시 입력해주세요.');
      } else if (error.code === 'auth/requires-recent-login') {
        setStepError('보안을 위해 다시 로그인한 뒤 비밀번호 변경을 진행해주세요.');
      } else {
        setStepError('비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const computedEmail = user?.email || `${user?.studentId || 'student'}@office.hanseo.ac.kr`;
  const emailStepComplete = emailVerified;

  return (
    <div className="init-page">
      <section className="init-page__content">
        <h1 className="init-page__title">계정 초기 설정</h1>
        <p className="init-page__description">
          첫 로그인 시 이메일 인증과 비밀번호 변경을 완료해야 서비스를 이용할 수 있습니다.
        </p>

        {!user && isVerificationMode ? (
          <div className="init-page__steps">
            <div className="init-page__step init-page__step--active">
              <h2 className="init-page__step-title">이메일 인증</h2>
              <p className="init-page__step-description">
                이메일 인증이 완료되면 로그인하신 뒤 초기 설정을 마무리할 수 있습니다.
              </p>
              {verificationMessage ? (
                <p className="init-page__success">{verificationMessage}</p>
              ) : (
                <p className="init-page__hint">
                  인증 링크를 통해 접속하셨다면, 로그인을 진행해 초기 설정을 이어가주세요.
                </p>
              )}
              <button
                type="button"
                className="init-page__button init-page__button--primary"
                onClick={() => navigate('/login', { replace: true })}
              >
                로그인 화면으로 이동
              </button>
            </div>
            {stepError && <p className="init-page__error">{stepError}</p>}
          </div>
        ) : (
          <div className="init-page__steps">
          <div className={`init-page__step ${emailSent ? 'init-page__step--active' : ''}`}>
            <h2 className="init-page__step-title">1. 이메일 인증</h2>
            <p className="init-page__step-description">
              학교 계정 이메일로 인증 코드를 발송합니다. 이메일 주소는 수정할 수 없습니다.
            </p>
            <label className="init-page__field">
              <span className="init-page__field-label">이메일</span>
              <input className="init-page__input" value={computedEmail} disabled />
            </label>
            {!emailStepComplete && (
              <div className="init-page__actions">
                <button
                  type="button"
                  className="init-page__button"
                  onClick={handleSendEmail}
                  disabled={isSending}
                >
                  {isSending ? '전송 중...' : emailSent ? '이메일 재전송' : '인증 이메일 전송'}
                </button>
              </div>
            )}
            {emailSent && !emailStepComplete && (
              <p className="init-page__hint">
                이메일에 포함된 인증 링크를 클릭하면 자동으로 인증이 완료됩니다. 인증 메일이 오지 않았다면
                스팸함을 확인하거나 이메일을 다시 전송하세요.
              </p>
            )}
            {emailStepComplete && <p className="init-page__success">이메일 인증이 완료되었습니다.</p>}
          </div>

          <div className={`init-page__step ${emailStepComplete ? 'init-page__step--active' : ''}`}>
            <h2 className="init-page__step-title">2. 비밀번호 변경</h2>
            <p className="init-page__step-description">
              인증 완료 후 새 비밀번호로 변경해야 합니다. 변경 후 다시 로그인할 때부터 새
              비밀번호를 사용합니다.
            </p>
            <form className="init-page__form" onSubmit={handlePasswordChange}>
              <label className="init-page__field">
                <span className="init-page__field-label">현재 비밀번호</span>
                <input
                  className="init-page__input"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
                  placeholder="현재 비밀번호를 입력하세요"
                  disabled={!emailStepComplete}
                  required
                />
              </label>
              <label className="init-page__field">
                <span className="init-page__field-label">새 비밀번호</span>
                <input
                  className="init-page__input"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                  placeholder="8자 이상 입력하세요"
                  disabled={!emailStepComplete}
                  required
                />
              </label>
              <label className="init-page__field">
                <span className="init-page__field-label">비밀번호 확인</span>
                <input
                  className="init-page__input"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(event) =>
                    setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={!emailStepComplete}
                  required
                />
              </label>
              {passwordError && <p className="init-page__error">{passwordError}</p>}
              <button
                type="submit"
                className="init-page__button init-page__button--primary"
                disabled={!emailStepComplete || isCompleting}
              >
                {isCompleting ? '처리 중...' : '비밀번호 변경 완료'}
              </button>
            </form>
          </div>
          </div>
        )}

        {stepError && !(!user && isVerificationMode) && (
          <p className="init-page__error">{stepError}</p>
        )}
      </section>
    </div>
  );
}
