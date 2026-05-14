import React, { createContext, useMemo, type ReactNode } from 'react';

import { useThemeStore } from '../store/themeStore';
import { baseColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export type MelodiscTheme = {
  colors: typeof baseColors & {
    accent: {
      primary: string;
      secondary: string;
      glow: string;
      deep: string;
      soft: string;
    };
  };
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  shadows: {
    card: typeof shadows.card;
    accentGlow: Omit<typeof shadows.accentGlow, 'shadowColor'> & {
      shadowColor: string;
    };
  };
};

export const ThemeContext = createContext<MelodiscTheme | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const accentColor = useThemeStore(state => state.accentColor);

  const theme = useMemo<MelodiscTheme>(() => {
    return {
      colors: {
        ...baseColors,
        accent: {
          primary: accentColor,
          secondary: accentColor,
          glow: accentColor,
          deep: '#1DADEB',
          soft: '#E6F8FF',
        },
      },
      spacing,
      typography,
      radius,
      shadows: {
        ...shadows,
        accentGlow: {
          ...shadows.accentGlow,
          shadowColor: accentColor,
        },
      },
    };
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
