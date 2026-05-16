import {create} from 'zustand';
import type {AuthCredentials} from '../types';
import EncryptedStorage from 'react-native-encrypted-storage';
import {STORAGE_KEY_CREDENTIALS} from '../utils/constants';

interface AuthState {
  credentials: AuthCredentials | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setCredentials: (creds: AuthCredentials) => Promise<void>;
  loadCredentials: () => Promise<void>;
  clearCredentials: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  credentials: null,
  isAuthenticated: false,
  isLoading: true,

  setCredentials: async (creds: AuthCredentials) => {
    await EncryptedStorage.setItem(
      STORAGE_KEY_CREDENTIALS,
      JSON.stringify(creds),
    );
    set({credentials: creds, isAuthenticated: true});
  },

  loadCredentials: async () => {
    try {
      const raw = await EncryptedStorage.getItem(STORAGE_KEY_CREDENTIALS);
      if (raw) {
        const creds: AuthCredentials = JSON.parse(raw);
        set({credentials: creds, isAuthenticated: true, isLoading: false});
      } else {
        set({isLoading: false});
      }
    } catch {
      set({isLoading: false});
    }
  },

  clearCredentials: async () => {
    // Always clear in-memory state first — even if storage removal fails,
    // we need RootNavigator to switch back to AuthStack so the user can
    // recover. Otherwise a storage error leaves them stuck "logged in".
    set({credentials: null, isAuthenticated: false});
    try {
      await EncryptedStorage.removeItem(STORAGE_KEY_CREDENTIALS);
    } catch (err) {
      console.warn('[auth] removeItem failed (state cleared anyway)', err);
    }
  },
}));
