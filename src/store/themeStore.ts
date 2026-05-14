import { create } from 'zustand';

type ThemeState = {
  accentColor: string;
  setAccentColor: (accentColor: string) => void;
};

export const useThemeStore = create<ThemeState>(set => ({
  accentColor: '#BDEBFF',
  setAccentColor: accentColor => set({ accentColor }),
}));
