import { createContext, useContext, useState, ReactNode } from 'react';
import {
  themes,
  DEFAULT_THEME,
  typography,
  spacing,
  radii,
  shadows,
  touchTarget,
  ThemeName,
  ThemeTokens,
} from '../constants/themes';

interface ThemeContextValue {
  theme: ThemeTokens;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
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

  const value: ThemeContextValue = {
    theme: themes[themeName],
    themeName,
    setThemeName,
    typography,
    spacing,
    radii,
    shadows,
    touchTarget,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
