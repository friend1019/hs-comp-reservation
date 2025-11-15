const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const ensureAdminCaller = async (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const callerUid = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(callerUid).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', '사용자 정보를 찾을 수 없습니다.');
  }

  const roles = Array.isArray(userDoc.data().roles) ? userDoc.data().roles : [];

  if (!roles.includes('admin')) {
    throw new functions.https.HttpsError('permission-denied', '관리자 권한이 필요합니다.');
  }
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

exports.createAuthUser = functions.https.onCall(async (data, context) => {
  await ensureAdminCaller(context);

  const { userId, email, password, displayName, roles } = data || {};

  if (!userId || !email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'userId, email, password는 필수 값입니다.');
  }

  if (password.length < 8) {
    throw new functions.https.HttpsError('invalid-argument', '비밀번호는 8자 이상이어야 합니다.');
  }

  let userRecord;

  try {
    userRecord = await admin.auth().getUser(userId);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      userRecord = null;
    } else {
      throw new functions.https.HttpsError('internal', '기존 사용자 확인 중 문제가 발생했습니다.', error);
    }
  }

  if (userRecord) {
    throw new functions.https.HttpsError('already-exists', '해당 UID의 Auth 계정이 이미 존재합니다.');
  }

  const normalizedRoles = normalizeRoles(roles);

  try {
    await admin.auth().createUser({
      uid: userId,
      email,
      password,
      displayName
    });

    await admin.auth().setCustomUserClaims(userId, {
      admin: normalizedRoles.includes('admin')
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Auth 계정 생성에 실패했습니다.', error);
  }
});

exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  await ensureAdminCaller(context);

  const { userId } = data || {};

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId가 필요합니다.');
  }

  try {
    await admin.auth().deleteUser(userId);
    return { success: true };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return { success: true, message: 'Auth 계정이 존재하지 않아 생략되었습니다.' };
    }
    throw new functions.https.HttpsError('internal', 'Auth 계정 삭제에 실패했습니다.', error);
  }
});
