import { describe, it, expect } from 'vitest';
import { mapKitsuToAppFormat } from './api';
import type { Comic } from '../types/comic';

/**
 * Fixture minimal yang meniru bentuk asli response Kitsu API
 * (diverifikasi 19 Okt 2026 terhadap /manga/38?include=genres,staff.person).
 */
const kitsuItem = {
  id: '38',
  attributes: {
    canonicalTitle: 'One Piece',
    titles: { en: 'One Piece', en_jp: 'One Piece', ja_jp: 'ONE PIECE' },
    posterImage: {
      tiny: 'https://media.kitsu.app/tiny.jpg',
      small: 'https://media.kitsu.app/small.jpg',
      large: 'https://media.kitsu.app/large.jpg',
      original: 'https://media.kitsu.app/original.jpg',
    },
    chapterCount: null,
    averageRating: '85.08',
    userCount: 163858,
    favoritesCount: 3787,
    status: 'current',
    synopsis: 'Gol D. Roger was known as the Pirate King...',
  },
  relationships: {
    genres: {
      data: [
        { id: '1' },
        { id: '3' },
      ],
    },
    staff: {
      data: [{ id: '112871' }],
    },
  },
};

const included = [
  { id: '1', type: 'genres', attributes: { name: 'Action' } },
  { id: '3', type: 'genres', attributes: { name: 'Comedy' } },
  {
    id: '112871',
    type: 'mediaStaff',
    attributes: { role: 'Story & Art' },
    relationships: { person: { data: { id: '952' } } },
  },
  { id: '952', type: 'people', attributes: { name: 'Eiichiro Oda' } },
];

describe('mapKitsuToAppFormat', () => {
  const comic = mapKitsuToAppFormat(kitsuItem, included);

  it('memetakan id dan judul kanonik', () => {
    expect(comic.mal_id).toBe('38');
    expect(comic.title).toBe('One Piece');
  });

  it('mengembalikan struktur gambar webp dan jpg yang sama', () => {
    expect(comic.images.webp.image_url).toBe('https://media.kitsu.app/small.jpg');
    expect(comic.images.webp.large_image_url).toBe('https://media.kitsu.app/large.jpg');
    expect(comic.images.jpg.image_url).toBe('https://media.kitsu.app/small.jpg');
  });

  it('mengonversi rating Kitsu (0–100) ke skor 0–10 sebagai number', () => {
    expect(comic.score).toBe(8.5);
    expect(typeof comic.score).toBe('number');
  });

  it('memetakan status kitsu current → Publishing', () => {
    expect(comic.status).toBe('Publishing');
  });

  it('memetakan members, favorites, dan chapters', () => {
    expect(comic.members).toBe(163858);
    expect(comic.favorites).toBe(3787);
    expect(comic.chapters).toBeNull();
  });

  it('memetakan genres dari array included berdasarkan relationship', () => {
    expect(comic.genres).toEqual([
      { mal_id: 1, name: 'Action' },
      { mal_id: 3, name: 'Comedy' },
    ]);
  });

  it('memetakan penulis melalui mediaStaff → person', () => {
    expect(comic.authors).toEqual([
      { name: 'Eiichiro Oda', role: 'Story & Art' },
    ]);
  });

  it('fallback ke judul alternatif jika canonicalTitle kosong', () => {
    const noTitle = {
      ...kitsuItem,
      attributes: { ...kitsuItem.attributes, canonicalTitle: undefined },
    };
    const result = mapKitsuToAppFormat(noTitle, []);
    expect(result.title).toBe('One Piece');
  });

  it('memberikan fallback gambar placeholder jika posterImage kosong', () => {
    const noPoster = {
      ...kitsuItem,
      attributes: { ...kitsuItem.attributes, posterImage: undefined },
    };
    const result = mapKitsuToAppFormat(noPoster, []) as Comic;
    expect(result.images.webp.image_url).toContain('placehold.co');
  });

  it('genres dan authors kosong saat tidak ada included', () => {
    const result = mapKitsuToAppFormat(kitsuItem);
    expect(result.genres).toEqual([]);
    expect(result.authors).toEqual([]);
  });
});
