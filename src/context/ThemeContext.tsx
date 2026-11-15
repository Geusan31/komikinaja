/* eslint-disable react-refresh/only-export-components --
   Pola React context idiomatik: Provider (komponen) dan hook useTheme
   di file yang sama agar konteksnya mudah ditemukan. */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type DarkIntensity = 'gray' | 'amoled';
export type ResolvedTheme = 'light' | 'dark';

const MODE_STORAGE_KEY = 'komikinaja_theme_mode';
const INTENSITY_STORAGE_KEY = 'komikinaja_dark_intensity';
const LEGACY_NIGHT_KEY = 'komikinaja_night';

/** Malam hari lokal didefinisikan pukul 18:00 s.d. 05:59. */
export const isNightTime = (date: Date = new Date()): boolean => {
  const hour = date.getHours();
  return hour >= 18 || hour < 6;
};

/** Tentukan tema akhir ('light' | 'dark') berdasarkan mode dan waktu lokal. */
export const resolveTheme = (mode: ThemeMode, date: Date = new Date()): ResolvedTheme => {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return isNightTime(date) ? 'dark' : 'light';
};

const getInitialMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'auto';
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored;
  // Migrasi ringan dari preferensi lama di mode baca
  const legacy = window.localStorage.getItem(LEGACY_NIGHT_KEY);
  if (legacy === '1') return 'dark';
  return 'auto';
};

const getInitialIntensity = (): DarkIntensity => {
  if (typeof window === 'undefined') return 'gray';
  const stored = window.localStorage.getItem(INTENSITY_STORAGE_KEY);
  return stored === 'amoled' ? 'amoled' : 'gray';
};

interface ThemeContextType {
  mode: ThemeMode;
  darkIntensity: DarkIntensity;
  resolvedTheme: ResolvedTheme;
  isAutoNight: boolean;
  setMode: (mode: ThemeMode) => void;
  setDarkIntensity: (intensity: DarkIntensity) => void;
  cycleQuickMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [darkIntensity, setDarkIntensity] = useState<DarkIntensity>(getInitialIntensity);
  const [autoNight, setAutoNight] = useState<boolean>(() => isNightTime());

  const resolvedTheme: ResolvedTheme =
    mode === 'auto' ? (autoNight ? 'dark' : 'light') : mode;

  // Perbarui deteksi waktu lokal tiap menit saat mode otomatis aktif
  useEffect(() => {
    if (mode !== 'auto') return;
    const timer = window.setInterval(() => {
      setAutoNight(isNightTime());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [mode]);

  // Sinkronkan atribut DOM dan localStorage agar seluruh aplikasi mengikuti tema aktif
  useEffect(() => {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    window.localStorage.setItem(INTENSITY_STORAGE_KEY, darkIntensity);
    window.localStorage.setItem(LEGACY_NIGHT_KEY, resolvedTheme === 'dark' ? '1' : '0');

    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.darkIntensity = darkIntensity;
    root.style.colorScheme = resolvedTheme;
  }, [mode, darkIntensity, resolvedTheme]);

  const cycleQuickMode = () => {
    setMode((prev) => {
      if (prev === 'auto') return 'dark';
      if (prev === 'dark') return 'light';
      return 'auto';
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        darkIntensity,
        resolvedTheme,
        isAutoNight: autoNight,
        setMode,
        setDarkIntensity,
        cycleQuickMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

