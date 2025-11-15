import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseApp';

const getUserProfile = async (uid) => {
  if (!uid) {
    return null;
  }

  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) {
    return null;
  }

  return userDoc.data();
};

const buildUserPayload = (firebaseUser, profile) => {
  if (!firebaseUser) {
    return null;
  }

  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const studentId = profile?.studentId || profile?.student_id || '';
  const isInitialized = Boolean(profile?.isInitialized);
  const emailVerified = firebaseUser.emailVerified || Boolean(profile?.emailVerified);

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || profile?.email || '',
    displayName: firebaseUser.displayName || profile?.displayName || '',
    photoURL: firebaseUser.photoURL || profile?.photoURL || null,
    roles,
    studentId,
    isInitialized,
    emailVerified
  };
};

export const signInWithCredentials = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(credential.user.uid);

    return buildUserPayload(credential.user, profile);
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }

    if (error.code === 'auth/user-disabled') {
      throw new Error('해당 계정은 사용이 중지되었습니다. 관리자에게 문의하세요.');
    }

    if (error.code === 'auth/user-not-found') {
      throw new Error('등록되지 않은 계정입니다. 학번을 확인하거나 관리자에게 문의하세요.');
    }

    if (error.code === 'auth/too-many-requests') {
      throw new Error('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
    }

    throw error;
  }
};

export const signOutUser = () => signOut(auth);

export const onAuthStateChange = (callback) =>
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const profile = await getUserProfile(firebaseUser.uid);
      callback(buildUserPayload(firebaseUser, profile));
    } catch (error) {
      console.error('Failed to load user profile:', error);
      callback(buildUserPayload(firebaseUser, null));
    }
  });
