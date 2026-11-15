import { describe, it, expect } from 'vitest';
import {
  mapHistoryRow,
  mapReadChapterRows,
  mergeHistoryWithLocal,
  type HistoryEntry,
} from './history';

describe('history service — pemetaan progres baca tingkat chapter', () => {
  it('memetakan baris reading_history lengkap dengan progres chapter', () => {
    const entry = mapHistoryRow({
      comic_id: 'comic-uuid-1',
      comic_title: 'Petualangan Nusantara',
      comic_cover: 'https://example.com/cover.jpg',
      last_viewed_at: '2026-11-15T10:00:00Z',
      last_chapter_number: 14,
      last_chapter_id: 'ch-uuid-14',
      last_chapter_title: 'Pertarungan Senja',
    });

    expect(entry).toEqual({
      comicId: 'comic-uuid-1',
      title: 'Petualangan Nusantara',
      cover: 'https://example.com/cover.jpg',
      lastViewedAt: '2026-11-15T10:00:00Z',
      lastChapterNumber: 14,
      lastChapterId: 'ch-uuid-14',
      lastChapterTitle: 'Pertarungan Senja',
    });
  });

  it('mengembalikan null untuk field chapter jika baris berasal dari skema lama', () => {
    const entry = mapHistoryRow({
      comic_id: '38',
      comic_title: 'One Piece',
      comic_cover: null,
      last_viewed_at: '2026-11-15T08:00:00Z',
    });

    expect(entry.lastChapterNumber).toBeNull();
    expect(entry.lastChapterId).toBeNull();
    expect(entry.lastChapterTitle).toBeNull();
  });

  it('memetakan dan mengurutkan read_chapters tanpa duplikat', () => {
    const mapped = mapReadChapterRows([
      { chapter_id: 'ch-3', chapter_number: 3 },
      { chapter_id: 'ch-1', chapter_number: 1 },
      { chapter_id: 'ch-3', chapter_number: 3 },
    ]);

    expect(mapped.readChapterIds).toEqual(['ch-3', 'ch-1']);
    expect(mapped.readChapterNumbers).toEqual([1, 3]);
  });

  it('menggabungkan riwayat remote tanpa chapter dengan fallback lokal yang memiliki nomor chapter', () => {
    const remote: HistoryEntry[] = [
      {
        comicId: 'comic-1',
        title: 'Komik A',
        cover: null,
        lastViewedAt: '2026-11-15T10:00:00Z',
        lastChapterNumber: null,
        lastChapterId: null,
        lastChapterTitle: null,
      },
    ];
    const local: HistoryEntry[] = [
      {
        comicId: 'comic-1',
        title: 'Komik A',
        cover: null,
        lastViewedAt: '2026-11-15T09:55:00Z',
        lastChapterNumber: 7,
        lastChapterId: 'ch-7',
        lastChapterTitle: 'Bab 7',
      },
      {
        comicId: 'comic-2',
        title: 'Komik B',
        cover: null,
        lastViewedAt: '2026-11-15T11:00:00Z',
        lastChapterNumber: 2,
        lastChapterId: 'ch-2',
        lastChapterTitle: null,
      },
    ];

    const merged = mergeHistoryWithLocal(remote, local);
    expect(merged.map((m) => m.comicId)).toEqual(['comic-2', 'comic-1']);
    expect(merged[1].lastChapterNumber).toBe(7);
    expect(merged[1].lastChapterId).toBe('ch-7');
    expect(merged[1].lastChapterTitle).toBe('Bab 7');
  });
});

