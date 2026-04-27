import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  themes,
  DEFAULT_THEME,
  DEFAULT_COLOR_MODE,
  typography,
  spacing,
  radii,
  shadows,
  touchTarget,
  ThemeName,
  ColorMode,
  ThemeTokens,
} from '../constants/themes';

export interface ThemeContextValue {
  theme: ThemeTokens;
  themeName: ThemeName;
  colorMode: ColorMode;
  resolvedMode: 'light' | 'dark';
  setThemeName: (name: ThemeName) => void;
  setColorMode: (mode: ColorMode) => void;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  touchTarget: typeof touchTarget;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME);
  const [colorMode, setColorMode] = useState<ColorMode>(DEFAULT_COLOR_MODE);
  const systemColorScheme = useColorScheme();

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedMode =
      colorMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : colorMode;
    return {
      theme: themes[themeName][resolvedMode],
      themeName,
      colorMode,
      resolvedMode,
      setThemeName,
      setColorMode,
      typography,
      spacing,
      radii,
      shadows,
      touchTarget,
    };
  }, [themeName, colorMode, systemColorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
