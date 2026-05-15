import { updateProfile } from 'firebase/auth';
import { create } from 'zustand';

import { useAuthStore } from './authStore';

type ThemeState = {
  primaryAccent: string;
  accentColor: string;
  displayName: string;
  setPrimaryAccent: (primaryAccent: string) => void;
  setAccentColor: (accentColor: string) => void;
  setDisplayName: (name: string) => void;
};

export const useThemeStore = create<ThemeState>(set => ({
  primaryAccent: '#BDEBFF',
  accentColor: '#BDEBFF',
  displayName: '',
  setPrimaryAccent: primaryAccent =>
    set({
      primaryAccent,
      accentColor: primaryAccent,
    }),
  setAccentColor: accentColor =>
    set({
      primaryAccent: accentColor,
      accentColor,
    }),
  setDisplayName: name => {
    set({ displayName: name });

    // Hybrid sync: persist to Firebase in the background
    const user = useAuthStore.getState().user;

    if (user) {
      updateProfile(user, { displayName: name }).catch(() => {
        // Silently fail – local value is already applied.
        // A future retry/queue mechanism could be added here.
      });
    }
  },
}));
