import '../styles/components/CalendarGrid.css';

export default function CalendarGrid({ days = [], selectedDate, onSelectDate }) {
  return (
    <section className="calendar-grid">
      <h2 className="calendar-grid__title">예약 가능한 날짜</h2>
      <div className="calendar-grid__list">
        {days.length === 0 && (
          <p className="calendar-grid__empty">예약 가능한 날짜가 없습니다.</p>
        )}
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`calendar-grid__day${
              selectedDate === day.date ? ' calendar-grid__day--selected' : ''
            }`}
            onClick={() => onSelectDate?.(day.date)}
            disabled={day.disabled}
          >
            <span className="calendar-grid__day-label">{day.label}</span>
            <span className="calendar-grid__day-meta">이용 가능 {day.availableCount}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
