import { useEffect, useState } from 'react';
import '../styles/pages/AdminPage.css';
import {
  fetchAdminOverview,
  fetchAllReservations,
  fetchAllUsers,
  updateComputerStatus,
  createUserDocument,
  updateUserDocument,
  deleteUserDocument
} from '../services/adminApi';
import { createAuthAccount, deleteAuthAccount } from '../services/adminFunctions';
import EmptyState from '../components/EmptyState';

const initialUserFormState = {
  userId: '',
  studentId: '',
  displayName: '',
  email: '',
  roles: 'user',
  isInitialized: false,
  emailVerified: false,
  initialPassword: '',
  createAuthAccount: false
};

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
  const [statusForm, setStatusForm] = useState({ computerId: '', status: 'available' });
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState(initialUserFormState);
  const [isUserEditing, setIsUserEditing] = useState(false);
  const [userFormMessage, setUserFormMessage] = useState('');
  const [userFormError, setUserFormError] = useState('');

  useEffect(() => {
    fetchAdminOverview()
      .then(setOverview)
      .catch((error) => {
        console.error('관리자 요약 정보를 가져오지 못했습니다:', error);
      });

    fetchAllReservations()
      .then(setReservations)
      .catch((error) => {
        console.error('예약 목록을 가져오지 못했습니다:', error);
      });

    fetchAllUsers()
      .then(setUsers)
      .catch((error) => {
        console.error('사용자 목록을 가져오지 못했습니다:', error);
      });
  }, []);

  const handleStatusUpdate = async (computerId, status) => {
    try {
      const result = await updateComputerStatus({ computerId, status });
      setStatusUpdateMessage(`${result.computerId} 상태가 ${result.status}로 변경되었습니다.`);
      const nextOverview = await fetchAdminOverview();
      setOverview(nextOverview);
    } catch (error) {
      console.error('상태 업데이트에 실패했습니다:', error);
    }
  };

  const handleStatusFormChange = (event) => {
    const { name, value } = event.target;
    setStatusForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusFormSubmit = (event) => {
    event.preventDefault();
    if (!statusForm.computerId) {
      return;
    }
    handleStatusUpdate(statusForm.computerId, statusForm.status);
  };

  const resetUserForm = ({ keepMessages = false } = {}) => {
    setUserForm(initialUserFormState);
    setIsUserEditing(false);
    if (!keepMessages) {
      setUserFormMessage('');
      setUserFormError('');
    }
  };

  const handleUserFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserFormSubmit = async (event) => {
    event.preventDefault();
    setUserFormError('');
    setUserFormMessage('');

    if (!userForm.userId.trim()) {
      setUserFormError('사용자 UID를 입력해주세요.');
      return;
    }

    const payload = {
      userId: userForm.userId.trim(),
      studentId: userForm.studentId.trim(),
      displayName: userForm.displayName.trim(),
      email: userForm.email.trim(),
      roles: userForm.roles,
      isInitialized: userForm.isInitialized,
      emailVerified: userForm.emailVerified
    };

    if (!isUserEditing && userForm.createAuthAccount) {
      if (!payload.email) {
        setUserFormError('Auth 계정을 생성하려면 이메일을 입력해주세요.');
        return;
      }

      if (!userForm.initialPassword || userForm.initialPassword.length < 8) {
        setUserFormError('Auth 계정을 생성하려면 8자 이상의 초기 비밀번호를 입력해주세요.');
        return;
      }
    }

    try {
      if (isUserEditing) {
        await updateUserDocument(payload);
        setUserFormMessage('사용자 정보가 업데이트되었습니다.');
      } else {
        await createUserDocument(payload);
        setUserFormMessage('사용자 문서가 생성되었습니다.');

        if (userForm.createAuthAccount) {
          await createAuthAccount({
            userId: payload.userId,
            email: payload.email,
            password: userForm.initialPassword,
            displayName: payload.displayName,
            roles: payload.roles
          });
          setUserFormMessage('사용자 문서가 생성되었고 Auth 계정이 추가되었습니다.');
        }
      }

      const updatedUsers = await fetchAllUsers();
      setUsers(updatedUsers);
      if (isUserEditing) {
        setIsUserEditing(false);
      }
      setUserForm(initialUserFormState);
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      setUserFormError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleEditUser = (user) => {
    setUserForm({
      userId: user.id,
      studentId: user.studentId || '',
      displayName: user.displayName || '',
      email: user.email || '',
      roles: Array.isArray(user.roles) ? user.roles.join(', ') : user.roles || 'user',
      isInitialized: Boolean(user.isInitialized),
      emailVerified: Boolean(user.emailVerified),
      initialPassword: '',
      createAuthAccount: false
    });
    setIsUserEditing(true);
    setUserFormMessage('');
    setUserFormError('');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('해당 사용자를 삭제하시겠습니까?')) {
      return;
    }

    const deleteAuth = window.confirm('Firebase Auth 계정도 함께 삭제하시겠습니까? 확인을 누르면 Auth 계정도 제거됩니다.');

    try {
      await deleteUserDocument({ userId });
      setUserFormMessage('사용자 문서가 삭제되었습니다.');
      if (deleteAuth) {
        await deleteAuthAccount({ userId });
        setUserFormMessage('사용자 문서와 Auth 계정이 삭제되었습니다.');
      }
      const updatedUsers = await fetchAllUsers();
      setUsers(updatedUsers);
      if (userForm.userId === userId) {
        resetUserForm({ keepMessages: true });
      }
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      setUserFormError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">관리자 센터</h1>
        <p className="admin-page__subtitle">
          실습실 자원과 예약 현황을 둘러보고 필요한 작업을 수행하세요.
        </p>
      </header>

      <section className="admin-page__overview">
        <h2 className="admin-page__section-title">요약 정보</h2>
        {overview ? (
          <div className="admin-page__overview-grid">
            <div className="admin-page__overview-card">
              <span className="admin-page__overview-label">전체 컴퓨터</span>
              <strong className="admin-page__overview-value">{overview.totalComputers}</strong>
            </div>
            <div className="admin-page__overview-card">
              <span className="admin-page__overview-label">활성 예약</span>
              <strong className="admin-page__overview-value">{overview.activeReservations}</strong>
            </div>
            <div className="admin-page__overview-card">
              <span className="admin-page__overview-label">점검 중</span>
              <strong className="admin-page__overview-value">{overview.maintenanceCount}</strong>
            </div>
          </div>
        ) : (
          <EmptyState
            title="정보를 불러오는 중입니다"
            description="잠시만 기다려주세요."
          />
        )}
      </section>

      <section className="admin-page__actions">
        <h2 className="admin-page__section-title">컴퓨터 상태 관리</h2>
        <form className="admin-page__status-form" onSubmit={handleStatusFormSubmit}>
          <label className="admin-page__status-field">
            <span className="admin-page__status-label">컴퓨터 ID</span>
            <input
              className="admin-page__status-input"
              type="text"
              name="computerId"
              value={statusForm.computerId}
              onChange={handleStatusFormChange}
              placeholder="comp-101"
              required
            />
          </label>
          <label className="admin-page__status-field">
            <span className="admin-page__status-label">상태</span>
            <select
              className="admin-page__status-select"
              name="status"
              value={statusForm.status}
              onChange={handleStatusFormChange}
            >
              <option value="available">예약 가능</option>
              <option value="maintenance">점검 중</option>
              <option value="offline">사용 불가</option>
            </select>
          </label>
          <button className="admin-page__status-submit" type="submit">
            상태 업데이트
          </button>
        </form>
        {statusUpdateMessage && (
          <p className="admin-page__status-message">{statusUpdateMessage}</p>
        )}
      </section>

      <section className="admin-page__users">
        <h2 className="admin-page__section-title">사용자 관리</h2>
        <div className="admin-page__users-layout">
          <div className="admin-page__users-form">
            <h3 className="admin-page__users-subtitle">{isUserEditing ? '사용자 수정' : '사용자 추가'}</h3>
            <form className="admin-page__user-form" onSubmit={handleUserFormSubmit}>
              <label className="admin-page__user-field">
                <span className="admin-page__user-label">UID</span>
                <input
                  className="admin-page__user-input"
                  type="text"
                  name="userId"
                  value={userForm.userId}
                  onChange={handleUserFormChange}
                  placeholder="Firebase Auth UID"
                  disabled={isUserEditing}
                  required
                />
              </label>
              <label className="admin-page__user-field">
                <span className="admin-page__user-label">학번</span>
                <input
                  className="admin-page__user-input"
                  type="text"
                  name="studentId"
                  value={userForm.studentId}
                  onChange={handleUserFormChange}
                  placeholder="예: 20250001"
                />
              </label>
              <label className="admin-page__user-field">
                <span className="admin-page__user-label">이름</span>
                <input
                  className="admin-page__user-input"
                  type="text"
                  name="displayName"
                  value={userForm.displayName}
                  onChange={handleUserFormChange}
                />
              </label>
              <label className="admin-page__user-field">
                <span className="admin-page__user-label">이메일</span>
                <input
                  className="admin-page__user-input"
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                />
              </label>
              <label className="admin-page__user-field">
                <span className="admin-page__user-label">권한 (쉼표로 구분)</span>
                <input
                  className="admin-page__user-input"
                  type="text"
                  name="roles"
                  value={userForm.roles}
                  onChange={handleUserFormChange}
                  placeholder="예: user, admin"
                />
              </label>
              <label className="admin-page__user-checkbox">
                <input
                  type="checkbox"
                  name="isInitialized"
                  checked={userForm.isInitialized}
                  onChange={handleUserFormChange}
                />
                <span>초기 설정 완료</span>
              </label>
              <label className="admin-page__user-checkbox">
                <input
                  type="checkbox"
                  name="emailVerified"
                  checked={userForm.emailVerified}
                  onChange={handleUserFormChange}
                />
                <span>이메일 인증됨</span>
              </label>
              {!isUserEditing && (
                <>
                  <label className="admin-page__user-checkbox">
                    <input
                      type="checkbox"
                      name="createAuthAccount"
                      checked={userForm.createAuthAccount}
                      onChange={handleUserFormChange}
                    />
                    <span>Firebase Auth 계정도 생성</span>
                  </label>
                  {userForm.createAuthAccount && (
                    <label className="admin-page__user-field">
                      <span className="admin-page__user-label">초기 비밀번호 (8자 이상)</span>
                      <input
                        className="admin-page__user-input"
                        type="password"
                        name="initialPassword"
                        value={userForm.initialPassword}
                        onChange={handleUserFormChange}
                        placeholder="초기 비밀번호"
                        minLength={8}
                        required
                      />
                    </label>
                  )}
                </>
              )}
              <div className="admin-page__user-actions">
                <button className="admin-page__user-submit" type="submit">
                  {isUserEditing ? '사용자 저장' : '사용자 생성'}
                </button>
                {isUserEditing && (
                  <button className="admin-page__user-reset" type="button" onClick={() => resetUserForm()}>
                    새 사용자 추가로 전환
                  </button>
                )}
              </div>
              {userFormMessage && <p className="admin-page__user-message">{userFormMessage}</p>}
              {userFormError && <p className="admin-page__user-error">{userFormError}</p>}
              <p className="admin-page__user-hint">
                * Firebase Auth 계정 생성을 선택하면 UID와 이메일로 바로 계정이 만들어집니다. 이미 Auth에 존재하는 UID는 재사용되므로 주의하세요.
              </p>
            </form>
          </div>
          <div className="admin-page__users-table">
            {users.length === 0 ? (
              <EmptyState title="등록된 사용자가 없습니다" description="사용자를 추가해 관리할 수 있습니다." />
            ) : (
              <table className="admin-page__user-table">
                <thead>
                  <tr>
                    <th>학번</th>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>권한</th>
                    <th>초기 설정</th>
                    <th>이메일 인증</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.studentId || '미등록'}</td>
                      <td>{user.displayName || '이름 없음'}</td>
                      <td>{user.email || '이메일 없음'}</td>
                      <td>{Array.isArray(user.roles) ? user.roles.join(', ') : user.roles || 'user'}</td>
                      <td>{user.isInitialized ? '완료' : '미완료'}</td>
                      <td>{user.emailVerified ? '예' : '아니요'}</td>
                      <td className="admin-page__user-actions-cell">
                        <button
                          type="button"
                          className="admin-page__user-action"
                          onClick={() => handleEditUser(user)}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="admin-page__user-action admin-page__user-action--danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section className="admin-page__reservations">
        <h2 className="admin-page__section-title">전체 예약 현황</h2>
        {reservations.length === 0 ? (
          <EmptyState
            title="예약 정보가 없습니다"
            description="현재 표시할 예약이 없습니다."
          />
        ) : (
          <table className="admin-page__reservation-table">
            <thead className="admin-page__reservation-head">
              <tr className="admin-page__reservation-row">
                <th className="admin-page__reservation-header">학번</th>
                <th className="admin-page__reservation-header">사용자</th>
                <th className="admin-page__reservation-header">컴퓨터</th>
                <th className="admin-page__reservation-header">예약일</th>
                <th className="admin-page__reservation-header">시간</th>
              </tr>
            </thead>
            <tbody className="admin-page__reservation-body">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="admin-page__reservation-row">
                  <td className="admin-page__reservation-cell">{reservation.studentId || '미등록'}</td>
                  <td className="admin-page__reservation-cell">{reservation.userName || '알 수 없음'}</td>
                  <td className="admin-page__reservation-cell">{reservation.computerName || reservation.computerId}</td>
                  <td className="admin-page__reservation-cell">{reservation.date}</td>
                  <td className="admin-page__reservation-cell">
                    {reservation.slot === 'morning'
                      ? '오전'
                      : reservation.slot === 'afternoon'
                      ? '오후'
                      : reservation.slot === 'evening'
                      ? '저녁'
                      : reservation.slot}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
      </section>
    </div>
  );
}
