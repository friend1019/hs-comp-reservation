import { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/pages/HomePage.css';
import useAuthStore from '../stores/authStore';
import useReservationStore from '../stores/reservationStore';
import { fetchComputers, fetchDailyAvailability, SLOT_DEFINITIONS } from '../services/availabilityApi';
import {
  createReservation,
  fetchReservations,
  cancelReservation,
  fetchReservationSummaryByDate
} from '../services/reservationApi';
import CalendarGrid from '../components/CalendarGrid';
import TimeSlotPicker from '../components/TimeSlotPicker';
import ReservationCard from '../components/ReservationCard';
import CancelDialog from '../components/CancelDialog';
import EmptyState from '../components/EmptyState';

const formatDate = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().split('T')[0];
};

export default function HomePage() {
  const { user } = useAuthStore();
  const {
    reservations,
    availability,
    selectedComputerId,
    selectedDate,
    selectedSlot,
    loading,
    error,
    setSelectedComputerId,
    setSelectedDate,
    setSelectedSlot,
    setReservations,
    loadAvailability,
    loadReservations,
    addReservation,
    removeReservation
  } = useReservationStore();
  const [computers, setComputers] = useState([]);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [reservationSummary, setReservationSummary] = useState({});

  const refreshReservationSummary = useCallback(
    async (computerIdParam) => {
      const targetComputerId = computerIdParam || selectedComputerId;

      if (!targetComputerId) {
        return;
      }

      try {
        const summary = await fetchReservationSummaryByDate({ computerId: targetComputerId });
        setReservationSummary(summary);
      } catch (summaryError) {
        console.error('예약 요약을 가져오지 못했습니다:', summaryError);
      }
    },
    [selectedComputerId]
  );

  useEffect(() => {
    fetchComputers().then(setComputers).catch((fetchError) => {
      console.error('컴퓨터 목록을 가져오지 못했습니다:', fetchError);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setReservations([]);
      return;
    }

    loadReservations(fetchReservations, { userId: user.uid }).catch((loadError) => {
      console.error('예약 정보를 가져오지 못했습니다:', loadError);
    });
  }, [loadReservations, setReservations, user]);

  useEffect(() => {
    if (!selectedComputerId || !selectedDate) {
      return;
    }

    loadAvailability(fetchDailyAvailability, {
      computerId: selectedComputerId,
      date: selectedDate
    }).catch((loadError) => {
      console.error('가능한 시간을 가져오지 못했습니다:', loadError);
    });
  }, [loadAvailability, selectedComputerId, selectedDate]);

  useEffect(() => {
    if (!selectedComputerId) {
      return;
    }

    setReservationSummary({});
    refreshReservationSummary(selectedComputerId);
  }, [refreshReservationSummary, selectedComputerId]);

  useEffect(() => {
    if (!selectedComputerId && computers.length > 0) {
      setSelectedComputerId(computers[0].id);
    }
  }, [computers, selectedComputerId, setSelectedComputerId]);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(formatDate(new Date()));
    }
  }, [selectedDate, setSelectedDate]);

  const days = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const totalSlots = SLOT_DEFINITIONS.length;
    const result = [];

    for (let index = 0; index < 7; index += 1) {
      const current = new Date(today);
      current.setDate(today.getDate() + index);
      const dateString = formatDate(current);
      const summaryForDay = reservationSummary[dateString] || [];
      const unavailableSlots = new Set(summaryForDay.map((item) => item.slot));
      const isSameDay = current.getTime() === today.getTime();
      const isBeforeToday = current < today;

      if (isBeforeToday || isSameDay) {
        SLOT_DEFINITIONS.forEach((definition) => {
          const slotEnd = new Date(
            `${dateString}T${String(definition.endHour).padStart(2, '0')}:00:00`
          );

          if (isBeforeToday || now >= slotEnd) {
            unavailableSlots.add(definition.id);
          }
        });
      }

      const availableCount = Math.max(0, totalSlots - unavailableSlots.size);

      result.push({
        date: dateString,
        label: current.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          weekday: 'short'
        }),
        availableCount,
        disabled: false
      });
    }

    return result;
  }, [reservationSummary]);

  const selectedComputer = computers.find((computer) => computer.id === selectedComputerId);

  const handleReserve = async () => {
    if (!user || !selectedComputerId || !selectedDate || !selectedSlot) {
      return;
    }

    try {
      const reservation = await createReservation({
        computerId: selectedComputerId,
        computerName: selectedComputer?.name,
        date: selectedDate,
        slot: selectedSlot,
        userId: user.uid,
        userName: user.displayName || user.email
      });

      addReservation(reservation);
      setSelectedSlot(null);
      await loadAvailability(fetchDailyAvailability, {
        computerId: selectedComputerId,
        date: selectedDate
      });
      await refreshReservationSummary(selectedComputerId);
    } catch (reserveError) {
      console.error('예약에 실패했습니다:', reserveError);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!user) {
      return;
    }

    try {
      await cancelReservation({ reservationId, userId: user.uid });
      removeReservation(reservationId);
      setReservationToCancel(null);
      if (selectedComputerId && selectedDate) {
        await loadAvailability(fetchDailyAvailability, {
          computerId: selectedComputerId,
          date: selectedDate
        });
      }
      await refreshReservationSummary(selectedComputerId);
    } catch (cancelError) {
      console.error('예약 취소에 실패했습니다:', cancelError);
    }
  };

  return (
    <div className="home-page">
      <header className="home-page__header">
        <h1 className="home-page__title">컴퓨터 예약 진행</h1>
        {selectedComputer && (
          <p className="home-page__subtitle">
            선택된 컴퓨터: {selectedComputer.name} ({selectedComputer.status})
          </p>
        )}
      </header>

      <section className="home-page__computers">
        <h2 className="home-page__section-title">컴퓨터 선택</h2>
        <div className="home-page__computer-grid">
          {computers.map((computer) => (
            <button
              key={computer.id}
              type="button"
              className={`home-page__computer-card${
                selectedComputerId === computer.id ? ' home-page__computer-card--selected' : ''
              }`}
              onClick={() => setSelectedComputerId(computer.id)}
            >
              <span className="home-page__computer-name">{computer.name}</span>
              <span className={`home-page__computer-status home-page__computer-status--${computer.status}`}>
                {computer.status === 'available' ? '예약 가능' : '점검 중'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="home-page__grid">
        <CalendarGrid
          days={days}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedSlot(null);
          }}
        />
        <TimeSlotPicker
          slots={availability}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />
      </div>

      <section className="home-page__actions">
        <button
          type="button"
          className="home-page__reserve-button"
          onClick={handleReserve}
          disabled={loading || !selectedSlot}
        >
          예약 확정
        </button>
        {error && <p className="home-page__error">{error}</p>}
      </section>

      <section className="home-page__reservations">
        <h2 className="home-page__section-title">나의 예약</h2>
        {reservations.length === 0 ? (
          <EmptyState
            title="예약 내역이 없습니다"
            description="예약을 진행하면 이곳에서 확인할 수 있습니다."
          />
        ) : (
          <div className="home-page__reservation-list">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={(reservationId) =>
                  setReservationToCancel(reservations.find((item) => item.id === reservationId))
                }
              />
            ))}
          </div>
        )}
      </section>

      <CancelDialog
        reservation={reservationToCancel}
        onConfirm={handleCancelReservation}
        onClose={() => setReservationToCancel(null)}
      />
    </div>
  );
}
