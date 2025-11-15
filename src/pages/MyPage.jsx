import '../styles/pages/MyPage.css';
import useAuthStore from '../stores/authStore';
import useReservationStore from '../stores/reservationStore';
import ReservationCard from '../components/ReservationCard';
import EmptyState from '../components/EmptyState';

export default function MyPage() {
  const { user } = useAuthStore();
  const { reservations } = useReservationStore();

  return (
    <div className="my-page">
      <header className="my-page__header">
        <h1 className="my-page__title">내 계정</h1>
        {user && (
          <div className="my-page__profile">
            <span className="my-page__profile-name">{user.displayName || '이름 미입력'}</span>
            <span className="my-page__profile-email">{user.email}</span>
            <span className="my-page__profile-role">
              권한: {(user.roles || ['user']).join(', ')}
            </span>
          </div>
        )}
      </header>

      <section className="my-page__reservations">
        <h2 className="my-page__section-title">내 예약 목록</h2>
        {reservations.length === 0 ? (
          <EmptyState
            title="예약 내역이 없습니다"
            description="예약을 진행하면 이곳에서 확인할 수 있습니다."
          />
        ) : (
          <div className="my-page__reservation-list">
            {reservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
