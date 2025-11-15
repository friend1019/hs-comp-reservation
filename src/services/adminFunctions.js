import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebaseApp';

const callFunction = async (name, data) => {
  const callable = httpsCallable(functions, name);
  const result = await callable(data);
  return result.data;
};

export const createAuthAccount = async ({ userId, email, password, displayName, roles }) =>
  callFunction('createAuthUser', { userId, email, password, displayName, roles });

export const deleteAuthAccount = async ({ userId }) =>
  callFunction('deleteAuthUser', { userId });
