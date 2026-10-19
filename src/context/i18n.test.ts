import { describe, it, expect } from 'vitest';
import { translations } from './LanguageContext';

/**
 * Pastikan setiap key yang ada di bahasa Indonesia juga ada di English
 * dan sebaliknya, supaya tidak ada label yang tampil mentah (raw key)
 * saat pengguna mengganti bahasa.
 */
describe('LanguageContext — kelengkapan terjemahan', () => {
  const idKeys = Object.keys(translations.id).sort();
  const enKeys = Object.keys(translations.en).sort();

  it('minimal ada satu string yang diterjemahkan', () => {
    expect(idKeys.length).toBeGreaterThan(0);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('setiap key ID tersedia di EN', () => {
    const missing = idKeys.filter((key) => !enKeys.includes(key));
    expect(missing).toEqual([]);
  });

  it('setiap key EN tersedia di ID', () => {
    const missing = enKeys.filter((key) => !idKeys.includes(key));
    expect(missing).toEqual([]);
  });

  it('tidak ada terjemahan yang kosong', () => {
    for (const key of idKeys) {
      expect(translations.id[key].trim()).not.toBe('');
    }
    for (const key of enKeys) {
      expect(translations.en[key].trim()).not.toBe('');
    }
  });

  it('placeholder konsisten antar bahasa (mis. {count})', () => {
    const placeholderRe = /\{(\w+)\}/g;
    for (const key of idKeys) {
      const idText = translations.id[key];
      const enText = translations.en[key] ?? '';
      const idPlaceholders = [...idText.matchAll(placeholderRe)].map((m) => m[1]).sort();
      const enPlaceholders = [...enText.matchAll(placeholderRe)].map((m) => m[1]).sort();
      expect(enPlaceholders, `Placeholder tidak cocok untuk key "${key}"`).toEqual(idPlaceholders);
    }
  });
});
