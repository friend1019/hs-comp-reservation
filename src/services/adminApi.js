import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseApp';

export const fetchAdminOverview = async () => {
  const computersSnapshot = await getDocs(collection(db, 'computers'));
  const reservationsSnapshot = await getDocs(collection(db, 'reservations'));

  const totalComputers = computersSnapshot.size;
  const maintenanceCount = computersSnapshot.docs.filter(
    (docSnapshot) => docSnapshot.data().status === 'maintenance'
  ).length;

  const reservations = reservationsSnapshot.docs.map((docSnapshot) => docSnapshot.data());
  const activeReservations = reservations.filter((reservation) => reservation.status !== 'cancelled').length;

  return {
    totalComputers,
    activeReservations,
    maintenanceCount
  };
};

const slotOrder = ['morning', 'afternoon', 'evening'];

const sortReservationsByDate = (reservations) =>
  reservations.sort((a, b) => {
    if (a.date === b.date) {
      const slotIndexA = slotOrder.includes(a.slot) ? slotOrder.indexOf(a.slot) : Number.MAX_SAFE_INTEGER;
      const slotIndexB = slotOrder.includes(b.slot) ? slotOrder.indexOf(b.slot) : Number.MAX_SAFE_INTEGER;
      return slotIndexA - slotIndexB;
    }

    return a.date.localeCompare(b.date);
  });

export const fetchAllReservations = async () => {
  const studentMap = await fetchAllStudents();
  const reservationsSnapshot = await getDocs(collection(db, 'reservations'));

  const reservations = reservationsSnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const studentId = studentMap.get(data.userId) || data.studentId || null;

    return {
      id: docSnapshot.id,
      ...data,
      studentId
    };
  });

  return sortReservationsByDate(reservations);
};

export const updateComputerStatus = async ({ computerId, status }) => {
  if (!computerId || !status) {
    throw new Error('컴퓨터와 상태를 모두 입력해주세요.');
  }

  const computerRef = doc(db, 'computers', computerId);
  const computerSnapshot = await getDoc(computerRef);

  if (!computerSnapshot.exists()) {
    throw new Error('존재하지 않는 컴퓨터입니다.');
  }

  await updateDoc(computerRef, { status });

  return { computerId, status };
};

const fetchAllStudents = async () => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const studentMap = new Map();

  usersSnapshot.docs.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const uid = docSnapshot.id;

    if (uid && data?.studentId) {
      studentMap.set(uid, data.studentId);
    }
  });

  return studentMap;
};

const normalizeRoles = (roles) => {
  if (Array.isArray(roles)) {
    return roles.filter(Boolean).map((role) => String(role).trim()).filter(Boolean);
  }

  if (typeof roles === 'string') {
    return roles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }

  return [];
};

export const fetchAllUsers = async () => {
  const usersSnapshot = await getDocs(collection(db, 'users'));

  const users = usersSnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      email: data.email || '',
      displayName: data.displayName || '',
      studentId: data.studentId || '',
      roles: normalizeRoles(data.roles),
      isInitialized: Boolean(data.isInitialized),
      emailVerified: Boolean(data.emailVerified)
    };
  });

  return users.sort((a, b) => {
    if (a.studentId && b.studentId) {
      return a.studentId.localeCompare(b.studentId);
    }

    return a.email.localeCompare(b.email);
  });
};

export const createUserDocument = async ({ userId, ...data }) => {
  if (!userId) {
    throw new Error('사용자 UID가 필요합니다.');
  }

  const docRef = doc(db, 'users', userId);
  const normalizedData = {
    displayName: data.displayName || '',
    email: data.email || '',
    studentId: data.studentId || '',
    roles: normalizeRoles(data.roles),
    isInitialized: Boolean(data.isInitialized),
    emailVerified: Boolean(data.emailVerified)
  };

  await setDoc(docRef, normalizedData, { merge: true });

  return { id: userId, ...normalizedData };
};

export const updateUserDocument = async ({ userId, ...data }) => {
  if (!userId) {
    throw new Error('사용자 UID가 필요합니다.');
  }

  const docRef = doc(db, 'users', userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('존재하지 않는 사용자입니다.');
  }

  const normalizedData = {
    displayName: data.displayName || '',
    email: data.email || '',
    studentId: data.studentId || '',
    roles: normalizeRoles(data.roles),
    isInitialized: Boolean(data.isInitialized),
    emailVerified: Boolean(data.emailVerified)
  };

  await updateDoc(docRef, normalizedData);

  return { id: userId, ...normalizedData };
};

export const deleteUserDocument = async ({ userId }) => {
  if (!userId) {
    throw new Error('사용자 UID가 필요합니다.');
  }

  await deleteDoc(doc(db, 'users', userId));
  return true;
};
