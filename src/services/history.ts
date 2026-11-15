import { supabase } from './supabase';

/**
 * Service untuk riwayat baca & progres chapter (`reading_history` dan `read_chapters`).
 * Mendukung penyimpanan Supabase + fallback `localStorage` agar progres chapter
 * tetap persisten walau migrasi DB belum dijalankan atau sedang mode offline/mock.
 */

export interface HistoryEntry {
  comicId: string;
  title: string;
  cover: string | null;
  lastViewedAt: string;
  lastChapterNumber: number | null;
  lastChapterId: string | null;
  lastChapterTitle: string | null;
}

export interface HistoryRow {
  comic_id: string;
  comic_title: string;
  comic_cover: string | null;
  last_viewed_at: string;
  last_chapter_number?: number | null;
  last_chapter_id?: string | null;
  last_chapter_title?: string | null;
}

export interface ReadChapterRow {
  chapter_id: string;
  chapter_number: number;
}

export interface ComicReadingProgress {
  lastChapterNumber: number | null;
  lastChapterId: string | null;
  lastChapterTitle: string | null;
  readChapterIds: string[];
  readChapterNumbers: number[];
}

const HISTORY_STORAGE_KEY = 'komikinaja_reading_history_v1';
const READ_CHAPTERS_STORAGE_KEY = 'komikinaja_read_chapters_v1';

interface LocalReadChaptersMap {
  [comicId: string]: {
    ids: string[];
    numbers: number[];
  };
}

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readLocalHistory = (): HistoryEntry[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
};

const writeLocalHistory = (entries: HistoryEntry[]): void => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 30)));
  } catch {
    // Abaikan kuota storage penuh
  }
};

const readLocalChaptersMap = (): LocalReadChaptersMap => {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(READ_CHAPTERS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as LocalReadChaptersMap) : {};
  } catch {
    return {};
  }
};

const writeLocalChaptersMap = (map: LocalReadChaptersMap): void => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(READ_CHAPTERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Abaikan kuota storage penuh
  }
};

/** Petakan satu baris tabel `reading_history` menjadi `HistoryEntry`. */
export const mapHistoryRow = (row: HistoryRow): HistoryEntry => ({
  comicId: row.comic_id,
  title: row.comic_title,
  cover: row.comic_cover,
  lastViewedAt: row.last_viewed_at,
  lastChapterNumber:
    typeof row.last_chapter_number === 'number' && Number.isFinite(row.last_chapter_number)
      ? row.last_chapter_number
      : null,
  lastChapterId: row.last_chapter_id ?? null,
  lastChapterTitle: row.last_chapter_title ?? null,
});

/** Petakan baris `read_chapters` menjadi daftar ID & nomor chapter unik. */
export const mapReadChapterRows = (
  rows: ReadChapterRow[],
): { readChapterIds: string[]; readChapterNumbers: number[] } => {
  const ids = new Set<string>();
  const nums = new Set<number>();
  for (const r of rows) {
    if (r.chapter_id) ids.add(r.chapter_id);
    if (typeof r.chapter_number === 'number' && Number.isFinite(r.chapter_number)) {
      nums.add(r.chapter_number);
    }
  }
  return {
    readChapterIds: Array.from(ids),
    readChapterNumbers: Array.from(nums).sort((a, b) => a - b),
  };
};

/**
 * Gabungkan entri riwayat dari Supabase dengan fallback lokal,
 * agar progres chapter tetap terjaga jika kolom 0006 belum tersedia di server.
 */
export const mergeHistoryWithLocal = (
  remote: HistoryEntry[],
  local: HistoryEntry[],
): HistoryEntry[] => {
  const byId = new Map<string, HistoryEntry>();

  for (const item of remote) {
    byId.set(item.comicId, item);
  }

  for (const loc of local) {
    const existing = byId.get(loc.comicId);
    if (!existing) {
      byId.set(loc.comicId, loc);
      continue;
    }
    const existingTime = new Date(existing.lastViewedAt).getTime();
    const localTime = new Date(loc.lastViewedAt).getTime();
    const useLocalChapter =
      existing.lastChapterNumber === null && loc.lastChapterNumber !== null;

    byId.set(loc.comicId, {
      ...existing,
      lastViewedAt: localTime > existingTime ? loc.lastViewedAt : existing.lastViewedAt,
      lastChapterNumber: useLocalChapter
        ? loc.lastChapterNumber
        : (existing.lastChapterNumber ?? loc.lastChapterNumber),
      lastChapterId: existing.lastChapterId ?? loc.lastChapterId,
      lastChapterTitle: existing.lastChapterTitle ?? loc.lastChapterTitle,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime(),
  );
};

const upsertLocalHistory = (entry: {
  comicId: string;
  title: string;
  cover: string | null;
  lastChapterNumber?: number | null;
  lastChapterId?: string | null;
  lastChapterTitle?: string | null;
}): void => {
  const list = readLocalHistory();
  const prev = list.find((item) => item.comicId === entry.comicId);
  const nextEntry: HistoryEntry = {
    comicId: entry.comicId,
    title: entry.title,
    cover: entry.cover ?? prev?.cover ?? null,
    lastViewedAt: new Date().toISOString(),
    lastChapterNumber:
      entry.lastChapterNumber !== undefined
        ? entry.lastChapterNumber
        : (prev?.lastChapterNumber ?? null),
    lastChapterId:
      entry.lastChapterId !== undefined
        ? entry.lastChapterId
        : (prev?.lastChapterId ?? null),
    lastChapterTitle:
      entry.lastChapterTitle !== undefined
        ? entry.lastChapterTitle
        : (prev?.lastChapterTitle ?? null),
  };

  const filtered = list.filter((item) => item.comicId !== entry.comicId);
  writeLocalHistory([nextEntry, ...filtered]);
};

const addLocalReadChapter = (comicId: string, chapterId: string, chapterNumber: number): void => {
  const map = readLocalChaptersMap();
  const current = map[comicId] ?? { ids: [], numbers: [] };
  const ids = new Set(current.ids);
  const numbers = new Set(current.numbers);
  if (chapterId) ids.add(chapterId);
  if (Number.isFinite(chapterNumber)) numbers.add(chapterNumber);
  map[comicId] = {
    ids: Array.from(ids),
    numbers: Array.from(numbers).sort((a, b) => a - b),
  };
  writeLocalChaptersMap(map);
};

/** Catat bahwa pengguna membuka halaman detail sebuah komik tanpa menimpa chapter terakhir. */
export const recordView = async (comic: {
  comicId: string;
  title: string;
  cover: string | null;
}): Promise<void> => {
  upsertLocalHistory(comic);

  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  await supabase
    .from('reading_history')
    .upsert(
      {
        user_id: userId,
        comic_id: comic.comicId,
        comic_title: comic.title,
        comic_cover: comic.cover,
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,comic_id' },
    );
};

/**
 * Catat progres baca tingkat chapter saat chapter dibuka di Mode Baca.
 * Menyimpan nomor chapter terakhir di `reading_history` dan menandai chapter di `read_chapters`.
 */
export const recordChapterRead = async (input: {
  comicId: string;
  title: string;
  cover: string | null;
  chapterId: string;
  chapterNumber: number;
  chapterTitle?: string | null;
}): Promise<void> => {
  upsertLocalHistory({
    comicId: input.comicId,
    title: input.title,
    cover: input.cover,
    lastChapterNumber: input.chapterNumber,
    lastChapterId: input.chapterId,
    lastChapterTitle: input.chapterTitle ?? null,
  });
  addLocalReadChapter(input.comicId, input.chapterId, input.chapterNumber);

  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const now = new Date().toISOString();

  const { error: historyErr } = await supabase
    .from('reading_history')
    .upsert(
      {
        user_id: userId,
        comic_id: input.comicId,
        comic_title: input.title,
        comic_cover: input.cover,
        last_viewed_at: now,
        last_chapter_number: input.chapterNumber,
        last_chapter_id: input.chapterId,
        last_chapter_title: input.chapterTitle ?? null,
      },
      { onConflict: 'user_id,comic_id' },
    );

  // Fallback jika skema DB belum menjalankan migrasi 0006
  if (historyErr) {
    await supabase
      .from('reading_history')
      .upsert(
        {
          user_id: userId,
          comic_id: input.comicId,
          comic_title: input.title,
          comic_cover: input.cover,
          last_viewed_at: now,
        },
        { onConflict: 'user_id,comic_id' },
      );
  }

  await supabase
    .from('read_chapters')
    .upsert(
      {
        user_id: userId,
        comic_id: input.comicId,
        chapter_id: input.chapterId,
        chapter_number: input.chapterNumber,
        read_at: now,
      },
      { onConflict: 'user_id,comic_id,chapter_id' },
    );
};

/** Ambil riwayat terakhir dibuka, terbaru di atas. */
export const listHistory = async (limit = 6): Promise<{ data: HistoryEntry[]; error: boolean }> => {
  const local = readLocalHistory();
  if (!supabase) return { data: local.slice(0, limit), error: false };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: local.slice(0, limit), error: false };

  const { data, error } = await supabase
    .from('reading_history')
    .select('comic_id, comic_title, comic_cover, last_viewed_at, last_chapter_number, last_chapter_id, last_chapter_title')
    .order('last_viewed_at', { ascending: false })
    .limit(limit);

  if (!error) {
    const remote = (data ?? []).map((row) => mapHistoryRow(row as HistoryRow));
    return { data: mergeHistoryWithLocal(remote, local).slice(0, limit), error: false };
  }

  // Fallback untuk skema lama sebelum migrasi 0006
  const legacy = await supabase
    .from('reading_history')
    .select('comic_id, comic_title, comic_cover, last_viewed_at')
    .order('last_viewed_at', { ascending: false })
    .limit(limit);

  if (legacy.error) {
    return { data: local.slice(0, limit), error: local.length === 0 };
  }

  const remoteLegacy = (legacy.data ?? []).map((row) => mapHistoryRow(row as HistoryRow));
  return { data: mergeHistoryWithLocal(remoteLegacy, local).slice(0, limit), error: false };
};

/** Ambil progres baca lengkap (chapter terakhir + daftar chapter terbaca) untuk satu komik. */
export const getComicReadingProgress = async (comicId: string): Promise<ComicReadingProgress> => {
  const localHistory = readLocalHistory().find((h) => h.comicId === comicId);
  const localRead = readLocalChaptersMap()[comicId] ?? { ids: [], numbers: [] };

  const base: ComicReadingProgress = {
    lastChapterNumber: localHistory?.lastChapterNumber ?? null,
    lastChapterId: localHistory?.lastChapterId ?? null,
    lastChapterTitle: localHistory?.lastChapterTitle ?? null,
    readChapterIds: [...localRead.ids],
    readChapterNumbers: [...localRead.numbers],
  };

  if (!supabase) return base;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return base;

  const [historyRes, chaptersRes] = await Promise.all([
    supabase
      .from('reading_history')
      .select('last_chapter_number, last_chapter_id, last_chapter_title')
      .eq('user_id', userId)
      .eq('comic_id', comicId)
      .maybeSingle(),
    supabase
      .from('read_chapters')
      .select('chapter_id, chapter_number')
      .eq('user_id', userId)
      .eq('comic_id', comicId),
  ]);

  const remoteMapped = chaptersRes.error
    ? { readChapterIds: [], readChapterNumbers: [] }
    : mapReadChapterRows((chaptersRes.data ?? []) as ReadChapterRow[]);

  const mergedIds = new Set([...base.readChapterIds, ...remoteMapped.readChapterIds]);
  const mergedNums = new Set([...base.readChapterNumbers, ...remoteMapped.readChapterNumbers]);

  const remoteHistory = !historyRes.error && historyRes.data
    ? (historyRes.data as Pick<HistoryRow, 'last_chapter_number' | 'last_chapter_id' | 'last_chapter_title'>)
    : null;

  return {
    lastChapterNumber:
      typeof remoteHistory?.last_chapter_number === 'number'
        ? remoteHistory.last_chapter_number
        : base.lastChapterNumber,
    lastChapterId: remoteHistory?.last_chapter_id ?? base.lastChapterId,
    lastChapterTitle: remoteHistory?.last_chapter_title ?? base.lastChapterTitle,
    readChapterIds: Array.from(mergedIds),
    readChapterNumbers: Array.from(mergedNums).sort((a, b) => a - b),
  };
};
