/**
 * Design Tokens — 3 ND-friendly color palettes.
 *
 * All palettes follow the same semantic token structure so components
 * never reference colors directly — only token names.
 * Active palette is selected via ThemeContext (to be implemented).
 */

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  borderFocus: string;
  error: string;
  errorSoft: string;
  success: string;
  successSoft: string;
}

export interface ThemeTokens {
  name: string;
  colors: ColorTokens;
}

// ---------------------------------------------------------------------------
// Palette A — Warm Earth
// Warm, natural tones. Earthy, calming, biophilic.
// ---------------------------------------------------------------------------
const warmEarth: ThemeTokens = {
  name: 'Warm Earth',
  colors: {
    background: '#FAF8F5',
    surface: '#F0ECE6',
    surfaceHover: '#E8E2D9',
    primary: '#8B7355',
    primarySoft: '#B5A48B',
    accent: '#6B8F71',
    accentSoft: '#A8C5AD',
    text: '#2D2A26',
    textSecondary: '#7A7267',
    textInverse: '#FAF8F5',
    border: '#E0D9CF',
    borderFocus: '#8B7355',
    error: '#C4736C',
    errorSoft: '#F0D5D2',
    success: '#6B8F71',
    successSoft: '#D4E8D7',
  },
};

// ---------------------------------------------------------------------------
// Palette B — Cool Mist
// Cool, soft blue-grays. Minimalist, tech-modern, calm.
// ---------------------------------------------------------------------------
const coolMist: ThemeTokens = {
  name: 'Cool Mist',
  colors: {
    background: '#F5F7FA',
    surface: '#EBEEF3',
    surfaceHover: '#E0E4EB',
    primary: '#5B7B9A',
    primarySoft: '#8BA8C2',
    accent: '#7BA39E',
    accentSoft: '#B0CEC9',
    text: '#1E2A36',
    textSecondary: '#6B7B8A',
    textInverse: '#F5F7FA',
    border: '#D6DCE4',
    borderFocus: '#5B7B9A',
    error: '#B86B6B',
    errorSoft: '#EED5D5',
    success: '#7BA39E',
    successSoft: '#D2E6E3',
  },
};

// ---------------------------------------------------------------------------
// Palette C — Soft Sage
// Green-based, nature-connected, meditative mood.
// ---------------------------------------------------------------------------
const softSage: ThemeTokens = {
  name: 'Soft Sage',
  colors: {
    background: '#F7F8F5',
    surface: '#ECF0E8',
    surfaceHover: '#E2E8DC',
    primary: '#6B8F71',
    primarySoft: '#9BB89F',
    accent: '#A68B6B',
    accentSoft: '#CCBDA6',
    text: '#2A2E28',
    textSecondary: '#6B7268',
    textInverse: '#F7F8F5',
    border: '#D9DFD4',
    borderFocus: '#6B8F71',
    error: '#C47A6C',
    errorSoft: '#F0D8D2',
    success: '#6B8F71',
    successSoft: '#D4E8D7',
  },
};

export const themes = {
  warmEarth,
  coolMist,
  softSage,
} as const;

export type ThemeName = keyof typeof themes;

export const DEFAULT_THEME: ThemeName = 'warmEarth';

// ---------------------------------------------------------------------------
// Spacing — 8px grid
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ---------------------------------------------------------------------------
// Border Radii
// ---------------------------------------------------------------------------
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows (subtle, not aggressive)
// ---------------------------------------------------------------------------
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

// ---------------------------------------------------------------------------
// Touch targets — minimum 44x44 for accessibility
// ---------------------------------------------------------------------------
export const touchTarget = {
  min: 44,
} as const;
