import '../styles/components/TimeSlotPicker.css';

export default function TimeSlotPicker({ slots = [], selectedSlot, onSelectSlot }) {
  return (
    <section className="time-slot-picker">
      <h2 className="time-slot-picker__title">예약 시간 선택</h2>
      <div className="time-slot-picker__grid">
        {slots.length === 0 && (
          <p className="time-slot-picker__empty">선택 가능한 시간이 없습니다.</p>
        )}
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          const isBooked = Boolean(slot.isBooked);
          const isPast = Boolean(slot.isPast);
          const isDisabled = isBooked || isPast;

          return (
            <button
              key={slot.id}
              type="button"
              className={`time-slot-picker__option${
                isSelected ? ' time-slot-picker__option--selected' : ''
              }${isBooked ? ' time-slot-picker__option--booked' : ''}${
                isPast ? ' time-slot-picker__option--past' : ''
              }`}
              onClick={() => onSelectSlot?.(slot.id)}
              disabled={isDisabled}
            >
              <span className="time-slot-picker__label">{slot.label}</span>
              {isBooked && <span className="time-slot-picker__status">예약됨</span>}
              {isPast && !isBooked && (
                <span className="time-slot-picker__status time-slot-picker__status--past">
                  시간 경과
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
