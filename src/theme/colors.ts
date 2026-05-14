export const baseColors = {
  background: {
    primary: '#000000',
    secondary: '#050505',
    elevated: '#0B0B0F',
    surface: '#111116',
    soft: '#18181D',
    overlay: 'rgba(0, 0, 0, 0.72)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    muted: '#77777D',
    disabled: '#4D4D52',
    inverse: '#000000',
  },
  feedback: {
    success: '#4ADE80',
    warning: '#FACC15',
    error: '#FB7185',
    info: '#60A5FA',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.08)',
    backgroundStrong: 'rgba(255, 255, 255, 0.14)',
    border: 'rgba(255, 255, 255, 0.18)',
    highlight: 'rgba(189, 235, 255, 0.22)',
    shadow: 'rgba(125, 220, 255, 0.18)',
  },
} as const;

export const backgroundGradient = ['#000000', '#050505', '#0B0B0F'] as const;

export const accentGlowGradient = [
  'rgba(189, 235, 255, 0.30)',
  'rgba(125, 220, 255, 0.10)',
  'rgba(0, 0, 0, 0)',
] as const;
