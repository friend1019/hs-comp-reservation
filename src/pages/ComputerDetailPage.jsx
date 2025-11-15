import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/pages/ComputerDetailPage.css';
import { fetchComputers, fetchDailyAvailability } from '../services/availabilityApi';
import useReservationStore from '../stores/reservationStore';
import EmptyState from '../components/EmptyState';
import TimeSlotPicker from '../components/TimeSlotPicker';

export default function ComputerDetailPage() {
  const { id } = useParams();
  const [computer, setComputer] = useState(null);
  const [date, setDate] = useState('');
  const {
    availability,
    selectedSlot,
    setSelectedSlot,
    loadAvailability
  } = useReservationStore();

  useEffect(() => {
    fetchComputers()
      .then((computers) => {
        const target = computers.find((item) => item.id === id);
        setComputer(target || null);
        const today = new Date();
        const formatted = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
        setDate(formatted);
        return loadAvailability(fetchDailyAvailability, { computerId: id, date: formatted });
      })
      .catch((error) => {
        console.error('컴퓨터 정보를 불러오지 못했습니다:', error);
      });
  }, [id, loadAvailability]);

  if (!computer) {
    return (
      <div className="computer-detail-page">
        <EmptyState
          title="컴퓨터 정보를 찾을 수 없습니다"
          description="선택한 컴퓨터가 존재하지 않거나 접근할 수 없습니다."
        />
      </div>
    );
  }

  return (
    <div className="computer-detail-page">
      <header className="computer-detail-page__header">
        <h1 className="computer-detail-page__title">{computer.name}</h1>
        <p className="computer-detail-page__status">
          현재 상태: {computer.status === 'available' ? '예약 가능' : '점검 중'}
        </p>
      </header>

      <section className="computer-detail-page__info">
        <p className="computer-detail-page__description">
          실습실의 위치, 사용 가능한 소프트웨어 및 장비에 대한 설명을 여기에 표시합니다.
        </p>
        <div className="computer-detail-page__meta">
          <span className="computer-detail-page__meta-item">식별자: {computer.id}</span>
          <span className="computer-detail-page__meta-item">예약 기준일: {date}</span>
        </div>
      </section>

      <section className="computer-detail-page__slots">
        <TimeSlotPicker
          slots={availability}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />
      </section>
    </div>
  );
}
