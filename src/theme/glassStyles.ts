import type { ViewStyle } from 'react-native';

/**
 * Antigravity glassmorphism styles for web (react-native-web).
 *
 * These use CSS-only properties (backdropFilter, boxShadow) that are
 * not part of the React Native StyleSheet API, so they are cast through
 * `unknown` to satisfy TypeScript while remaining valid on the web target.
 */

/** Standard glass panel – cards, nav bars, mini player. */
export const webGlassStyle = {
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.45)',
} as unknown as ViewStyle;

/** Stronger glass – modals, elevated surfaces. */
export const webGlassStyleStrong = {
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  boxShadow: '0px 16px 40px rgba(0, 0, 0, 0.55)',
} as unknown as ViewStyle;

/** Full-screen blur backdrop – player overlay background. */
export const webBlurLayerStyle = {
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
} as unknown as ViewStyle;

/** Subtle card shadow for auth cards, etc. */
export const webShadowStyle = {
  boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.35)',
} as unknown as ViewStyle;

/** Returns a CSS box-shadow glow string for active/selected items. */
export function activeGlow(color: string): string {
  return `0px 0px 22px ${color}55`;
}
