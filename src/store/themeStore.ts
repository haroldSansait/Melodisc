import { updateProfile, type User } from 'firebase/auth';
import { create } from 'zustand';

import { useAuthStore } from './authStore';
import {
  fetchUserProfile,
  saveUserProfile,
} from '../services/firebase/firestoreService';

type EnvironmentType = 'default' | 'warm_vibe';

type ThemeState = {
  environmentTheme: EnvironmentType;
  setEnvironmentTheme: (theme: EnvironmentType) => void;
  primaryAccent: string;
  accentColor: string;
  displayName: string;
  isHydrated: boolean;
  setPrimaryAccent: (primaryAccent: string) => void;
  setAccentColor: (accentColor: string) => void;
  setDisplayName: (name: string) => void;
  hydrateFromFirestore: (uid: string) => Promise<void>;
  resetHydration: () => void;
};

function isFirebaseUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    'getIdToken' in user &&
    typeof user.getIdToken === 'function'
  );
}

export const useThemeStore = create<ThemeState>(set => ({
  environmentTheme: 'default',
  setEnvironmentTheme: (theme) => set({ environmentTheme: theme }),

  primaryAccent: '#BDEBFF',
  accentColor: '#BDEBFF',
  displayName: '',
  isHydrated: false,

  setPrimaryAccent: primaryAccent => {
    set({ primaryAccent, accentColor: primaryAccent });

    // Background sync to Firestore
    const user = useAuthStore.getState().user;

    if (user) {
      saveUserProfile(user.uid, { primaryAccent }).catch(() => {
        // Silently fail — local value is already applied.
      });
    }
  },

  setAccentColor: accentColor => {
    set({ primaryAccent: accentColor, accentColor });

    const user = useAuthStore.getState().user;

    if (user) {
      saveUserProfile(user.uid, { primaryAccent: accentColor }).catch(() => {});
    }
  },

  setDisplayName: name => {
    // 1. Instant local update
    set({ displayName: name });

    const user = useAuthStore.getState().user;

    if (!user) {
      return;
    }

    // 2. Background sync: Firebase Auth displayName
    if (isFirebaseUser(user)) {
      updateProfile(user, { displayName: name }).catch(() => {});
    }

    // 3. Background sync: Firestore user profile doc
    saveUserProfile(user.uid, { displayName: name }).catch(() => {});
  },

  hydrateFromFirestore: async uid => {
    try {
      const profile = await fetchUserProfile(uid);

      if (profile) {
        set(state => ({
          primaryAccent: profile.primaryAccent ?? state.primaryAccent,
          accentColor: profile.primaryAccent ?? state.accentColor,
          displayName: profile.displayName ?? state.displayName,
        }));
      }
    } finally {
      set({ isHydrated: true });
    }
  },

  resetHydration: () => {
    set({
      isHydrated: false,
      displayName: '',
      primaryAccent: '#BDEBFF',
      accentColor: '#BDEBFF',
    });
  },
}));
