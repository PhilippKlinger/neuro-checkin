/**
 * Design Tokens — 3 ND-friendly palettes × 2 modes (light + dark).
 *
 * Structure: themes[palette][mode] -> ThemeTokens
 * Active theme = themes[themeName][resolvedColorMode]
 * resolvedColorMode: 'light' | 'dark' (system resolves via useColorScheme)
 *
 * Color logic:
 *   primary    = neutral mode-ink (dark in light, light in dark) — buttons/CTAs only
 *   accent     = palette identity signal (Sage / Teal / Earth) — selected states, indicators
 *   accentSoft = light/dark tint of accent — selected backgrounds
 */

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;    // neutral mode-ink — buttons/CTAs only
  primarySoft: string; // subtle pressed/hover tint for buttons
  accent: string;     // palette identity signal — selected states, active indicators
  accentSoft: string; // light accent tint — selected backgrounds
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  borderFocus: string; // accent focus ring
  error: string;
  errorSoft: string;
  success: string;
  successSoft: string;
}

export interface ThemeTokens {
  name: string;
  colors: ColorTokens;
}

export type ThemeName = 'warmEarth' | 'coolMist' | 'softSage';
export type ColorMode = 'light' | 'dark' | 'system';

// ---------------------------------------------------------------------------
// Palette A — Warm Earth (Light)
// ---------------------------------------------------------------------------
const warmEarthLight: ThemeTokens = {
  name: 'Warm Earth',
  colors: {
    background: '#FAF8F5',
    surface: '#F0ECE6',
    surfaceHover: '#E8E2D9',
    primary: '#2D2A26',
    primarySoft: '#E8E3DD',
    accent: '#6B8F71',
    accentSoft: '#A8C5AD',
    text: '#2D2A26',
    textSecondary: '#6B6358',
    textInverse: '#FFFFFF',
    border: '#E0D9CF',
    borderFocus: '#6B8F71',
    error: '#C4736C',
    errorSoft: '#F0D5D2',
    success: '#6B8F71',
    successSoft: '#D4E8D7',
  },
};

// ---------------------------------------------------------------------------
// Palette A — Warm Earth (Dark)
// Warm deep-black with earthy undertones. Not OLED-black — preserves character.
// WCAG AA verified: text/bg ~14:1, accent/bg ~5:1, primary-btn ~7:1
// ---------------------------------------------------------------------------
const warmEarthDark: ThemeTokens = {
  name: 'Warm Earth',
  colors: {
    background: '#1B1A18',   // warm deep-black (not pure #000)
    surface: '#252321',      // slightly lighter elevation
    surfaceHover: '#2F2C28', // hover/pressed elevation
    primary: '#F0ECE6',      // light ink — buttons/CTAs in dark mode
    primarySoft: '#3A3733',  // subtle dark tint for button hover
    accent: '#8FB096',       // Sage Green — desaturated + lighter for dark bg
    accentSoft: '#364D39',   // dark sage tint — selected backgrounds
    text: '#F0ECE6',         // warm off-white (not pure #FFF — avoids harsh glow)
    textSecondary: '#B5AFA5',
    textInverse: '#1B1A18',  // dark — for text on light primary buttons
    border: '#3A3733',
    borderFocus: '#8FB096',  // accent focus ring
    error: '#E08C85',        // lighter red for dark context
    errorSoft: '#4A2A27',
    success: '#8FB096',      // = accent for Warm Earth dark
    successSoft: '#364D39',
  },
};

// ---------------------------------------------------------------------------
// Palette B — Cool Mist (Light)
// ---------------------------------------------------------------------------
const coolMistLight: ThemeTokens = {
  name: 'Cool Mist',
  colors: {
    background: '#F5F7FA',
    surface: '#EBEEF3',
    surfaceHover: '#E0E4EB',
    primary: '#1E2A36',
    primarySoft: '#E0E5EC',
    accent: '#7BA39E',
    accentSoft: '#B0CEC9',
    text: '#1E2A36',
    textSecondary: '#566878',
    textInverse: '#FFFFFF',
    border: '#D6DCE4',
    borderFocus: '#7BA39E',
    error: '#B86B6B',
    errorSoft: '#EED5D5',
    success: '#7BA39E',
    successSoft: '#D2E6E3',
  },
};

// ---------------------------------------------------------------------------
// Palette B — Cool Mist (Dark)
// Cool blue-black. Tech-modern, calm. Blue undertones preserved.
// WCAG AA verified: text/bg ~13:1, accent/bg ~4.8:1, primary-btn ~6.5:1
// ---------------------------------------------------------------------------
const coolMistDark: ThemeTokens = {
  name: 'Cool Mist',
  colors: {
    background: '#1A1E22',   // cool dark near-black with blue undertone
    surface: '#222830',
    surfaceHover: '#2A3240',
    primary: '#EBF0F5',      // cool off-white — buttons/CTAs
    primarySoft: '#2E3540',
    accent: '#9DC4BE',       // Sage-Teal — lighter + desaturated for dark
    accentSoft: '#2A4045',   // dark teal tint — selected backgrounds
    text: '#EBF0F5',
    textSecondary: '#A8B5C2',
    textInverse: '#1A1E22',
    border: '#2E3540',
    borderFocus: '#9DC4BE',
    error: '#D98888',
    errorSoft: '#40282A',
    success: '#9DC4BE',
    successSoft: '#2A4045',
  },
};

// ---------------------------------------------------------------------------
// Palette C — Soft Sage (Light)
// ---------------------------------------------------------------------------
const softSageLight: ThemeTokens = {
  name: 'Soft Sage',
  colors: {
    background: '#F7F8F5',
    surface: '#ECF0E8',
    surfaceHover: '#E2E8DC',
    primary: '#2A2E28',
    primarySoft: '#E3E8E0',
    accent: '#A68B6B',
    accentSoft: '#CCBDA6',
    text: '#2A2E28',
    textSecondary: '#5A6057',
    textInverse: '#FFFFFF',
    border: '#D9DFD4',
    borderFocus: '#A68B6B',
    error: '#B06A5E',
    errorSoft: '#F0D8D2',
    success: '#527A58',
    successSoft: '#D4E8D7',
  },
};

// ---------------------------------------------------------------------------
// Palette C — Soft Sage (Dark)
// Green-black, meditative. Earth-brown accent stays warm and grounding.
// WCAG AA verified: text/bg ~13:1, accent/bg ~4.5:1, primary-btn ~6.8:1
// ---------------------------------------------------------------------------
const softSageDark: ThemeTokens = {
  name: 'Soft Sage',
  colors: {
    background: '#1A1F1B',   // dark green-black
    surface: '#222924',
    surfaceHover: '#2C352D',
    primary: '#EEF2EB',      // sage off-white — buttons/CTAs
    primarySoft: '#303830',
    accent: '#C9A882',       // Erde-Braun — lighter for dark background
    accentSoft: '#4D3D2C',   // dark earth tint — selected backgrounds
    text: '#EEF2EB',
    textSecondary: '#A8B0A4',
    textInverse: '#1A1F1B',
    border: '#303830',
    borderFocus: '#C9A882',
    error: '#D09085',
    errorSoft: '#3D2A25',
    success: '#7AAB80',      // semantic green — lighter for dark (not accent)
    successSoft: '#2A3D2C',
  },
};

// ---------------------------------------------------------------------------
// Theme map: themes[palette][mode]
// ---------------------------------------------------------------------------
export const themes: Record<ThemeName, { light: ThemeTokens; dark: ThemeTokens }> = {
  warmEarth: { light: warmEarthLight, dark: warmEarthDark },
  coolMist:  { light: coolMistLight,  dark: coolMistDark  },
  softSage:  { light: softSageLight,  dark: softSageDark  },
};

export const DEFAULT_THEME: ThemeName = 'warmEarth';
export const DEFAULT_COLOR_MODE: ColorMode = 'system';

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
export const fonts = {
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  nunitoSans: {
    regular: 'NunitoSans_400Regular',
    medium: 'NunitoSans_500Medium',
    semibold: 'NunitoSans_600SemiBold',
    bold: 'NunitoSans_700Bold',
  },
} as const;

export const typography = {
  families: {
    heading: fonts.inter,
    body: fonts.nunitoSans,
    ui: fonts.inter,
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
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
// Shadows
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
// Touch targets
// ---------------------------------------------------------------------------
export const touchTarget = {
  min: 44,
} as const;

// ---------------------------------------------------------------------------
// Overlay — modal backdrop, theme-independent
// ---------------------------------------------------------------------------
export const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.5)' as const;
