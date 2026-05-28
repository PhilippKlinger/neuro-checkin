import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  themes,
  DEFAULT_THEME,
  DEFAULT_COLOR_MODE,
  fonts,
  typography,
  spacing,
  radii,
  shadows,
  touchTarget,
  ThemeName,
  ColorMode,
  ThemeTokens,
} from '../constants/themes';
import type { FontFamily } from '../types/checkin';

export interface ThemeContextValue {
  theme: ThemeTokens;
  themeName: ThemeName;
  colorMode: ColorMode;
  resolvedMode: 'light' | 'dark';
  fontFamily: FontFamily;
  setThemeName: (name: ThemeName) => void;
  setColorMode: (mode: ColorMode) => void;
  setFontFamily: (f: FontFamily) => void;
  typography: { families: FontFamilies; sizes: typeof typography.sizes; lineHeights: typeof typography.lineHeights };
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  touchTarget: typeof touchTarget;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

interface FontSet {
  regular: string;
  medium: string;
  semibold: string;
  bold?: string;
}

interface FontFamilies {
  heading: FontSet;
  body: FontSet;
  ui: FontSet;
  display: FontSet;
}

const FONT_FAMILY_MAP: Record<FontFamily, FontFamilies> = {
  lexend: { heading: fonts.lexend, body: fonts.lexend, ui: fonts.lexend, display: fonts.lexend },
  atkinson: {
    heading: fonts.atkinson,
    body: fonts.atkinson,
    ui: fonts.atkinson,
    display: fonts.atkinson,
  },
  nunito: { heading: fonts.nunito, body: fonts.nunito, ui: fonts.nunito, display: fonts.nunito },
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME);
  const [colorMode, setColorMode] = useState<ColorMode>(DEFAULT_COLOR_MODE);
  const [fontFamily, setFontFamily] = useState<FontFamily>('lexend');
  const systemColorScheme = useColorScheme();

  const resolvedTypography = useMemo(
    () => ({ ...typography, families: FONT_FAMILY_MAP[fontFamily] }),
    [fontFamily]
  );

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedMode =
      colorMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : colorMode;
    return {
      theme: themes[themeName][resolvedMode],
      themeName,
      colorMode,
      resolvedMode,
      fontFamily,
      setThemeName,
      setColorMode,
      setFontFamily,
      typography: resolvedTypography,
      spacing,
      radii,
      shadows,
      touchTarget,
    };
  }, [themeName, colorMode, systemColorScheme, fontFamily, resolvedTypography]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
