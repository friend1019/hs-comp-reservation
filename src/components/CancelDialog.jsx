import '../styles/components/CancelDialog.css';

export default function CancelDialog({ reservation, onConfirm, onClose }) {
  if (!reservation) {
    return null;
  }

  return (
    <div className="cancel-dialog">
      <div className="cancel-dialog__content">
        <h3 className="cancel-dialog__title">예약을 취소하시겠습니까?</h3>
        <p className="cancel-dialog__description">
          {reservation.date} {reservation.slot}에 예약된 {reservation.computerName} 이용이
          취소됩니다.
        </p>
        <div className="cancel-dialog__actions">
          <button
            type="button"
            className="cancel-dialog__action cancel-dialog__action--dismiss"
            onClick={onClose}
          >
            닫기
          </button>
          <button
            type="button"
            className="cancel-dialog__action cancel-dialog__action--confirm"
            onClick={() => onConfirm?.(reservation.id)}
          >
            취소 확정
          </button>
        </div>
      </div>
    </div>
  );
}
