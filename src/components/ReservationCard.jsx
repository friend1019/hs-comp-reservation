import '../styles/components/ReservationCard.css';

export default function ReservationCard({ reservation, onCancel }) {
  if (!reservation) {
    return null;
  }

  return (
    <article className="reservation-card">
      <header className="reservation-card__header">
        <h3 className="reservation-card__title">{reservation.computerName}</h3>
        <span className="reservation-card__status">{reservation.status || '확정'}</span>
      </header>
      <dl className="reservation-card__details">
        <div className="reservation-card__row">
          <dt className="reservation-card__label">예약일</dt>
          <dd className="reservation-card__value">{reservation.date}</dd>
        </div>
        <div className="reservation-card__row">
          <dt className="reservation-card__label">시간</dt>
          <dd className="reservation-card__value">{reservation.slot}</dd>
        </div>
      </dl>
      <footer className="reservation-card__footer">
        <button
          type="button"
          className="reservation-card__cancel-button"
          onClick={() => onCancel?.(reservation.id)}
        >
          예약 취소
        </button>
      </footer>
    </article>
  );
}
