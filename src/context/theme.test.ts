import { describe, it, expect } from 'vitest';
import { isNightTime, resolveTheme } from './ThemeContext';

describe('ThemeContext — Auto Dark Mode berbasis waktu lokal', () => {
  it('menganggap malam hari antara pukul 18:00 hingga 05:59', () => {
    expect(isNightTime(new Date(2026, 10, 15, 18, 0))).toBe(true);
    expect(isNightTime(new Date(2026, 10, 15, 22, 30))).toBe(true);
    expect(isNightTime(new Date(2026, 10, 15, 0, 0))).toBe(true);
    expect(isNightTime(new Date(2026, 10, 15, 5, 59))).toBe(true);
  });

  it('menganggap siang/terang antara pukul 06:00 hingga 17:59', () => {
    expect(isNightTime(new Date(2026, 10, 15, 6, 0))).toBe(false);
    expect(isNightTime(new Date(2026, 10, 15, 12, 15))).toBe(false);
    expect(isNightTime(new Date(2026, 10, 15, 17, 59))).toBe(false);
  });

  it('resolveTheme mengikuti waktu lokal ketika mode adalah auto', () => {
    const nightDate = new Date(2026, 10, 15, 21, 0);
    const dayDate = new Date(2026, 10, 15, 14, 0);

    expect(resolveTheme('auto', nightDate)).toBe('dark');
    expect(resolveTheme('auto', dayDate)).toBe('light');
  });

  it('resolveTheme menghormati override manual light atau dark', () => {
    const nightDate = new Date(2026, 10, 15, 21, 0);
    const dayDate = new Date(2026, 10, 15, 14, 0);

    expect(resolveTheme('light', nightDate)).toBe('light');
    expect(resolveTheme('dark', dayDate)).toBe('dark');
  });
});

