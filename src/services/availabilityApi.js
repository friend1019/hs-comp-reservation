import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseApp';

export const SLOT_DEFINITIONS = [
  { id: 'morning', label: '오전 (09:00 - 12:00)', startHour: 9, endHour: 12 },
  { id: 'afternoon', label: '오후 (13:00 - 17:00)', startHour: 13, endHour: 17 },
  { id: 'evening', label: '저녁 (18:00 - 21:00)', startHour: 18, endHour: 21 }
];

export const fetchDailyAvailability = async ({ computerId, date }) => {
  if (!computerId || !date) {
    throw new Error('컴퓨터와 날짜를 선택해주세요.');
  }

  const reservationsRef = collection(db, 'reservations');
  const reservationQuery = query(
    reservationsRef,
    where('computerId', '==', computerId),
    where('date', '==', date)
  );
  const snapshot = await getDocs(reservationQuery);

  const bookedSlots = new Set(
    snapshot.docs
      .map((docSnapshot) => docSnapshot.data())
      .filter((data) => data.status !== 'cancelled')
      .map((data) => data.slot)
  );

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return SLOT_DEFINITIONS.map((definition) => {
    const targetDate = new Date(`${date}T00:00:00`);
    const slotEnd = new Date(`${date}T${String(definition.endHour).padStart(2, '0')}:00:00`);
    const isBeforeToday = targetDate < today;
    const isSameDay = targetDate.getTime() === today.getTime();
    const isPast = isBeforeToday || (isSameDay && now >= slotEnd);
    const isBooked = bookedSlots.has(definition.id);

    return {
      computerId,
      date,
      id: definition.id,
      label: definition.label,
      isBooked,
      isPast
    };
  });
};

export const fetchComputers = async () => {
  const computersSnapshot = await getDocs(collection(db, 'computers'));

  return computersSnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      name: data.name || docSnapshot.id,
      status: data.status || 'available',
      ...data
    };
  });
};
