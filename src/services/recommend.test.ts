import { describe, it, expect } from 'vitest';
import { scoreCandidate, buildPreferredGenres, rankCandidates } from './recommend';
import type { Comic } from '../types/comic';

/** Fixture komik minimal untuk pengujian murni. */
const makeComic = (id: string, title: string, genreNames: string[]): Comic => ({
  mal_id: id,
  title,
  images: {
    webp: {
      image_url: 'https://placehold.co/small',
      small_image_url: 'https://placehold.co/tiny',
      large_image_url: 'https://placehold.co/large',
    },
    jpg: {
      image_url: 'https://placehold.co/small',
      small_image_url: 'https://placehold.co/tiny',
      large_image_url: 'https://placehold.co/large',
    },
  },
  chapters: null,
  score: 7.5,
  members: 1000,
  favorites: 50,
  status: 'Publishing',
  synopsis: 'Sinopsis.',
  authors: [],
  genres: genreNames.map((name, i) => ({ mal_id: i, name })),
});

describe('buildPreferredGenres', () => {
  it('menjumlahkan frekuensi genre (case-insensitive)', () => {
    const preferred = buildPreferredGenres([
      ['Action', 'Fantasy'],
      ['action', 'Romance'],
    ]);
    expect(preferred.get('action')).toBe(2);
    expect(preferred.get('fantasy')).toBe(1);
    expect(preferred.get('romance')).toBe(1);
  });

  it('mengembalikan peta kosong untuk input kosong', () => {
    expect(buildPreferredGenres([]).size).toBe(0);
  });
});

describe('scoreCandidate', () => {
  it('menjumlahkan bobot genre yang cocok', () => {
    const preferred = new Map([
      ['action', 2],
      ['fantasy', 1],
    ]);
    expect(scoreCandidate(['Action', 'Comedy'], preferred)).toBe(2);
    expect(scoreCandidate(['Action', 'Fantasy'], preferred)).toBe(3);
  });

  it('mengabaikan genre yang tidak ada di preferensi', () => {
    const preferred = new Map([['action', 2]]);
    expect(scoreCandidate(['Drama'], preferred)).toBe(0);
  });

  it('cocok tanpa memedulikan huruf besar/kecil', () => {
    const preferred = new Map([['action', 1]]);
    expect(scoreCandidate(['ACTION'], preferred)).toBe(1);
  });
});

describe('rankCandidates', () => {
  it('mengurutkan skor tertinggi lebih dulu', () => {
    const preferred = buildPreferredGenres([['Action', 'Action', 'Romance']]);
    const candidates = [
      makeComic('1', 'Romance Only', ['Romance']), // skor 1
      makeComic('2', 'Action Only', ['Action']), // skor 2
      makeComic('3', 'Action + Romance', ['Action', 'Romance']), // skor 3
    ];
    const ranked = rankCandidates(candidates, preferred, new Set(), 3);
    expect(ranked.map((c) => c.mal_id)).toEqual(['3', '2', '1']);
  });

  it('membuang komik yang sudah dibaca', () => {
    const preferred = buildPreferredGenres([['Action']]);
    const candidates = [
      makeComic('1', 'Read', ['Action']),
      makeComic('2', 'Unread', ['Action']),
    ];
    const ranked = rankCandidates(candidates, preferred, new Set(['1']), 3);
    expect(ranked.map((c) => c.mal_id)).toEqual(['2']);
  });

  it('membuang duplikat berdasarkan mal_id', () => {
    const preferred = buildPreferredGenres([['Action']]);
    const candidates = [
      makeComic('1', 'Dup A', ['Action']),
      makeComic('1', 'Dup B', ['Action']),
    ];
    const ranked = rankCandidates(candidates, preferred, new Set(), 3);
    expect(ranked).toHaveLength(1);
  });

  it('mengabaikan kandidat tanpa kecocokan genre (skor 0)', () => {
    const preferred = buildPreferredGenres([['Action']]);
    const candidates = [
      makeComic('1', 'No Match', ['Drama']),
      makeComic('2', 'Match', ['Action']),
    ];
    const ranked = rankCandidates(candidates, preferred, new Set(), 3);
    expect(ranked.map((c) => c.mal_id)).toEqual(['2']);
  });

  it('membatasi hasil sesuai limit', () => {
    const preferred = buildPreferredGenres([['Action']]);
    const candidates = ['1', '2', '3', '4'].map((id) =>
      makeComic(id, `Comic ${id}`, ['Action']),
    );
    const ranked = rankCandidates(candidates, preferred, new Set(), 2);
    expect(ranked).toHaveLength(2);
  });
});
