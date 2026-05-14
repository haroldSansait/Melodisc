import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: undefined,
  }),
  display: {
    large: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
    medium: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  },
  title: {
    large: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    medium: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    small: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  },
  body: {
    large: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
    medium: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
    small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  },
  label: {
    large: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
    medium: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
    small: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  },
} as const;
