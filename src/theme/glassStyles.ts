import { Platform, type ViewStyle } from 'react-native';

/**
 * Antigravity glassmorphism styles.
 *
 * Web uses CSS-only backdropFilter / boxShadow.
 * Native uses elevated opaque backgrounds with native shadow properties
 * for a premium frosted-glass appearance without browser APIs.
 */

/** Standard glass panel – cards, nav bars, mini player. */
export const webGlassStyle: ViewStyle = Platform.select({
  web: {
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.45)',
  } as unknown as ViewStyle,
  default: {
    backgroundColor: 'rgba(18, 18, 24, 0.92)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
})!;

/** Stronger glass – modals, elevated surfaces. */
export const webGlassStyleStrong: ViewStyle = Platform.select({
  web: {
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    boxShadow: '0px 16px 40px rgba(0, 0, 0, 0.55)',
  } as unknown as ViewStyle,
  default: {
    backgroundColor: 'rgba(14, 14, 20, 0.96)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 16,
  },
})!;

/** Full-screen blur backdrop – player overlay background. */
export const webBlurLayerStyle: ViewStyle = Platform.select({
  web: {
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  } as unknown as ViewStyle,
  default: {
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
})!;

/** Subtle card shadow for auth cards, etc. */
export const webShadowStyle: ViewStyle = Platform.select({
  web: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.35)',
  } as unknown as ViewStyle,
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
})!;

/** Returns a CSS box-shadow glow string for active/selected items (web only). */
export function activeGlow(color: string): string {
  return `0px 0px 22px ${color}55`;
}
