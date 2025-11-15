import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseApp';

export const markUserInitialized = async (uid) => {
  if (!uid) {
    throw new Error('사용자 정보를 확인할 수 없습니다.');
  }

  const userRef = doc(db, 'users', uid);

  await updateDoc(userRef, {
    isInitialized: true,
    emailVerified: true,
    updatedAt: serverTimestamp()
  });
};
