/**
 * context/ThemeContext.tsx
 *
 * Provides:
 *   - colorMode: 'light' | 'dark'
 *   - toggleColorMode(): flip between light & dark
 *   - setColorMode(mode): set explicitly
 *   - theme: the full resolved token set (lightTheme / darkTheme)
 *   - isDark: boolean shorthand
 *
 * Persists the user's preference in AsyncStorage so it survives restarts.
 * On first launch, falls back to the device's system color scheme.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/lib/storage';
import {
  lightTheme,
  darkTheme,
  type AppTheme,
  type ColorMode,
} from '@/constants/theme';

// ── Storage key ───────────────────────────────────────────────────────────────
const COLOR_MODE_KEY = 'user:colorMode';

// ── Context shape ─────────────────────────────────────────────────────────────
interface ThemeContextValue {
  colorMode: ColorMode;
  isDark: boolean;
  theme: AppTheme;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorMode, setColorModeState] = useState<ColorMode>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    storage
      .get<ColorMode>(COLOR_MODE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setColorModeState(saved);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    storage.set(COLOR_MODE_KEY, mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  }, [colorMode, setColorMode]);

  const isDark = colorMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  // Prevent flash of wrong theme before AsyncStorage loads
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{ colorMode, isDark, theme, toggleColorMode, setColorMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
