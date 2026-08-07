/**
 * context/ThemeContext.tsx: light / dark / system, persisted.
 *
 * ── The one line that matters ───────────────────────────────────────────────
 * `Uniwind.setTheme(...)`. HeroUI Native components are styled by CSS variables
 * scoped to the `light` and `dark` variants, and Uniwind decides which variant
 * is live. Track the color mode in React state alone and you get a toggle that
 * flips your own screens while every Button, Card and Switch stays on the
 * system setting: a genuinely confusing half-themed app. Uniwind must be told.
 *
 * ── Three modes, not two ────────────────────────────────────────────────────
 * 'system' is a distinct, persisted choice, not just the initial value. A user
 * who never touches the toggle should keep following their device as it changes
 * at sunset, and a user who picks Dark should stay dark at noon. Collapsing
 * this to a boolean loses the difference and is the usual reason an app's dark
 * mode "randomly turns itself back on".
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';

import { storage } from '@/lib/storage';

export type ColorModePreference = 'light' | 'dark' | 'system';
export type ResolvedColorMode = 'light' | 'dark';

const STORAGE_KEY = 'settings:colorMode';

interface ThemeContextValue {
  /** What the user chose, including 'system'. */
  preference: ColorModePreference;
  /** What that resolves to right now. */
  colorMode: ResolvedColorMode;
  isDark: boolean;
  setPreference: (mode: ColorModePreference) => void;
  /** Convenience for a single switch: flips between explicit light and dark. */
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ColorModePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore the saved preference before the first paint.
  useEffect(() => {
    storage
      .get<ColorModePreference>(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
          Uniwind.setTheme(saved);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const setPreference = useCallback((mode: ColorModePreference) => {
    setPreferenceState(mode);
    Uniwind.setTheme(mode); // ← see the header note
    void storage.set(STORAGE_KEY, mode);
  }, []);

  const colorMode: ResolvedColorMode =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const toggleColorMode = useCallback(() => {
    setPreference(colorMode === 'dark' ? 'light' : 'dark');
  }, [colorMode, setPreference]);

  // Render nothing until the stored preference is known. One frame of a blank
  // background beats one frame of the wrong theme, which reads as a flash.
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{
        preference,
        colorMode,
        isDark: colorMode === 'dark',
        setPreference,
        toggleColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useColorMode must be used inside <ThemeProvider>');
  return ctx;
}
