import { User } from 'store/User/types';
import type { Site } from 'store/Sites/types';
import requests from 'helpers/requests';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import app from '../firebase';

// Helper mock user
const createMockFirebaseUser = (email: string) => ({
  user: {
    email,
    getIdToken: () => Promise.resolve('mock-id-token'),
    delete: () => Promise.resolve(),
  }
});

const createUser = (email: string, password: string) => {
  if (app) {
    const auth = getAuth(app);
    return createUserWithEmailAndPassword(auth, email, password);
  }
  return Promise.resolve(createMockFirebaseUser(email)) as any;
};

const storeUser = (
  fullName: string,
  email: string,
  organization: string,
  token?: string,
) => {
  if (!app) {
    return Promise.resolve({
      data: {
        id: 999,
        email,
        fullName,
        organization,
        adminLevel: 'super_admin',
        firebaseUid: 'mock-uid',
      }
    }) as any;
  }
  return requests.send<User>({
    method: 'POST',
    url: 'users',
    data: {
      fullName,
      email,
      organization,
    },
    token,
  });
};

const resetPassword = (email: string): Promise<void> => {
  if (!app) return Promise.resolve();
  const auth = getAuth(app);
  return sendPasswordResetEmail(auth, email, { url: window.location.origin });
};

const getSelf = (token?: string) => {
  if (!app) {
    return Promise.resolve({
      data: {
        id: 999,
        email: 'mock@example.com',
        fullName: 'Mock User',
        organization: 'Ocean Conservation',
        adminLevel: 'super_admin',
        firebaseUid: 'mock-uid',
      }
    }) as any;
  }
  return requests.send<User>({
    method: 'GET',
    url: 'users/current',
    token,
  });
};

const getAdministeredSites = (token?: string) => {
  if (!app) {
    return Promise.resolve({ data: [] }) as any;
  }
  return requests.send<Site[]>({
    method: 'GET',
    url: 'users/current/administered-sites',
    token,
  });
};

const signInUser = (email: string, password: string) => {
  if (app) {
    const auth = getAuth(app);
    return signInWithEmailAndPassword(auth, email, password);
  }
  return Promise.resolve(createMockFirebaseUser(email)) as any;
};

const signOutUser = () => {
  if (app) {
    const auth = getAuth(app);
    return signOut(auth);
  }
  return Promise.resolve() as any;
};

export default {
  createUser,
  storeUser,
  getAdministeredSites,
  getSelf,
  resetPassword,
  signInUser,
  signOutUser,
};
