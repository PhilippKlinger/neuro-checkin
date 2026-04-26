/**
 * Design Tokens — 3 ND-friendly palettes × 2 modes (light + dark).
 *
 * Structure: themes[palette][mode] -> ThemeTokens
 * Active theme = themes[themeName][resolvedColorMode]
 *
 * Color logic:
 *   primary    = neutral dark-gray ink — buttons/CTAs only (not near-black, not branded)
 *   accent     = palette identity signal — selected states, active indicators
 *   accentSoft = light tint of accent — selected backgrounds
 *
 * Palette accents match palette character:
 *   Warm Earth → warm earthy brown (#7A6344)
 *   Cool Mist  → sage-teal (#7BA39E)
 *   Soft Sage  → sage green (#527A58)
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

export type ThemeName = 'warmEarth' | 'coolMist' | 'softSage';
export type ColorMode = 'light' | 'dark' | 'system';

// ---------------------------------------------------------------------------
// Palette A — Warm Earth (Light)
// Warm earthy tones. Primary: dark gray-brown. Accent: earthy warm brown.
// ---------------------------------------------------------------------------
const warmEarthLight: ThemeTokens = {
  name: 'Warm Earth',
  colors: {
    background: '#FAF8F5',
    surface: '#F0ECE6',
    surfaceHover: '#E8E2D9',
    primary: '#4A4540',     // dark gray-brown — buttons/CTAs (softer than near-black)
    primarySoft: '#E8E3DD', // subtle pressed/hover tint
    accent: '#7A6344',      // warm earthy brown — identity signal
    accentSoft: '#DDD1C4',  // light warm brown tint — selected backgrounds
    text: '#2D2A26',
    textSecondary: '#6B6358',
    textInverse: '#FFFFFF',
    border: '#E0D9CF',
    borderFocus: '#7A6344',
    error: '#C4736C',
    errorSoft: '#F0D5D2',
    success: '#6B8F71',     // semantic green — independent of accent
    successSoft: '#D4E8D7',
  },
};

// ---------------------------------------------------------------------------
// Palette A — Warm Earth (Dark)
// ---------------------------------------------------------------------------
const warmEarthDark: ThemeTokens = {
  name: 'Warm Earth',
  colors: {
    background: '#1B1A18',
    surface: '#252321',
    surfaceHover: '#2F2C28',
    primary: '#F0ECE6',     // warm off-white — light ink for buttons in dark
    primarySoft: '#3A3733',
    accent: '#A88A65',      // warm brown lighter — readable on dark bg
    accentSoft: '#403020',  // dark warm brown tint — selected backgrounds
    text: '#F0ECE6',
    textSecondary: '#B5AFA5',
    textInverse: '#1B1A18', // dark — for text on light primary buttons
    border: '#3A3733',
    borderFocus: '#A88A65',
    error: '#E08C85',
    errorSoft: '#4A2A27',
    success: '#8FB096',
    successSoft: '#364D39',
  },
};

// ---------------------------------------------------------------------------
// Palette B — Cool Mist (Light)
// Cool blue-grays. Primary: dark navy-gray. Accent: sage-teal.
// ---------------------------------------------------------------------------
const coolMistLight: ThemeTokens = {
  name: 'Cool Mist',
  colors: {
    background: '#F5F7FA',
    surface: '#EBEEF3',
    surfaceHover: '#E0E4EB',
    primary: '#3A4855',     // dark navy-gray — buttons/CTAs
    primarySoft: '#E0E5EC',
    accent: '#7BA39E',      // sage-teal — identity signal
    accentSoft: '#C5DDD9',  // light teal tint — selected backgrounds
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
// ---------------------------------------------------------------------------
const coolMistDark: ThemeTokens = {
  name: 'Cool Mist',
  colors: {
    background: '#1A1E22',
    surface: '#222830',
    surfaceHover: '#2A3240',
    primary: '#EBF0F5',
    primarySoft: '#2E3540',
    accent: '#9DC4BE',      // sage-teal lighter — readable on dark bg
    accentSoft: '#2A4045',
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
// Nature-green tones. Primary: dark sage-gray. Accent: sage green.
// ---------------------------------------------------------------------------
const softSageLight: ThemeTokens = {
  name: 'Soft Sage',
  colors: {
    background: '#F7F8F5',
    surface: '#ECF0E8',
    surfaceHover: '#E2E8DC',
    primary: '#464B43',     // dark sage-gray — buttons/CTAs
    primarySoft: '#E3E8E0',
    accent: '#527A58',      // sage green — identity signal
    accentSoft: '#C0D8C4',  // light sage green tint — selected backgrounds
    text: '#2A2E28',
    textSecondary: '#5A6057',
    textInverse: '#FFFFFF',
    border: '#D9DFD4',
    borderFocus: '#527A58',
    error: '#B06A5E',
    errorSoft: '#F0D8D2',
    success: '#527A58',     // = accent for Soft Sage (sage green is also success)
    successSoft: '#C0D8C4',
  },
};

// ---------------------------------------------------------------------------
// Palette C — Soft Sage (Dark)
// ---------------------------------------------------------------------------
const softSageDark: ThemeTokens = {
  name: 'Soft Sage',
  colors: {
    background: '#1A1F1B',
    surface: '#222924',
    surfaceHover: '#2C352D',
    primary: '#EEF2EB',
    primarySoft: '#303830',
    accent: '#80A885',      // sage green lighter — readable on dark bg
    accentSoft: '#2E4A34',
    text: '#EEF2EB',
    textSecondary: '#A8B0A4',
    textInverse: '#1A1F1B',
    border: '#303830',
    borderFocus: '#80A885',
    error: '#D09085',
    errorSoft: '#3D2A25',
    success: '#80A885',
    successSoft: '#2E4A34',
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
