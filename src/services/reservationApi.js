import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebaseApp';

const reservationsCollection = collection(db, 'reservations');

const sortReservations = (items) =>
  items.sort((a, b) => {
    if (a.date === b.date) {
      return a.slot.localeCompare(b.slot);
    }

    return a.date.localeCompare(b.date);
  });

export const fetchReservations = async ({ userId }) => {
  if (!userId) {
    throw new Error('사용자 정보를 찾을 수 없습니다.');
  }

  const reservationQuery = query(reservationsCollection, where('userId', '==', userId));
  const snapshot = await getDocs(reservationQuery);

  const reservations = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data
    };
  });

  return sortReservations(reservations);
};

export const createReservation = async ({
  computerId,
  date,
  slot,
  userId,
  userName,
  computerName
}) => {
  if (!computerId || !date || !slot || !userId) {
    throw new Error('예약 정보를 모두 입력해주세요.');
  }

  const slotQuery = query(
    reservationsCollection,
    where('computerId', '==', computerId),
    where('date', '==', date),
    where('slot', '==', slot)
  );
  const slotSnapshot = await getDocs(slotQuery);

  const activeReservationExists = slotSnapshot.docs.some(
    (docSnapshot) => docSnapshot.data().status !== 'cancelled'
  );

  if (activeReservationExists) {
    throw new Error('이미 예약된 시간입니다.');
  }

  let finalComputerName = computerName;

  if (!finalComputerName) {
    const computerSnapshot = await getDoc(doc(db, 'computers', computerId));
    finalComputerName = computerSnapshot.exists()
      ? computerSnapshot.data().name || computerId
      : computerId;
  }

  const reservationPayload = {
    computerId,
    computerName: finalComputerName,
    date,
    slot,
    userId,
    userName,
    status: 'confirmed',
    createdAt: serverTimestamp()
  };

  const newReservationRef = await addDoc(reservationsCollection, reservationPayload);

  return {
    id: newReservationRef.id,
    ...reservationPayload,
    createdAt: new Date().toISOString()
  };
};

export const cancelReservation = async ({ reservationId, userId }) => {
  if (!reservationId) {
    throw new Error('예약을 찾을 수 없습니다.');
  }

  const reservationRef = doc(db, 'reservations', reservationId);
  const reservationSnapshot = await getDoc(reservationRef);

  if (!reservationSnapshot.exists()) {
    throw new Error('예약을 찾을 수 없습니다.');
  }

  const reservation = reservationSnapshot.data();

  if (userId && reservation.userId !== userId) {
    throw new Error('본인의 예약만 취소할 수 있습니다.');
  }

  await updateDoc(reservationRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp()
  });

  return true;
};
export const fetchReservationSummaryByDate = async ({ computerId }) => {
  if (!computerId) {
    throw new Error('컴퓨터 정보를 찾을 수 없습니다.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 6);

  const reservationsRef = collection(db, 'reservations');
  const reservationQuery = query(
    reservationsRef,
    where('computerId', '==', computerId)
  );

  const snapshot = await getDocs(reservationQuery);

  const summary = {};

  snapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const { date, slot, status } = data;

    if (!date || !slot) {
      return;
    }

    const reservationDate = new Date(`${date}T00:00:00`);

    if (reservationDate < today || reservationDate > sevenDaysLater) {
      return;
    }

    if (status === 'cancelled') {
      return;
    }

    if (!summary[date]) {
      summary[date] = [];
    }

    summary[date].push({ slot, status });
  });

  return summary;
};
