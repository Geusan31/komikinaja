import { supabase } from './supabase';

/**
 * Service analitik author (A2).
 *
 * Semua metrik dihitung dari chapter_views (pembaca unik & chapter
 * populer) dan followers (jumlah follower). chapter_views hanya bisa
 * dibaca oleh author komik terkait / admin (lihat RLS migrasi 0004).
 */

/** Catat satu pembukaan chapter karya creator (fire-and-forget). */
export const recordChapterView = async (comicId: string, chapterId: string): Promise<void> => {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  // Kegagalan tidak boleh mengganggu pembacaan — abaikan error.
  await supabase.from('chapter_views').insert({
    comic_id: comicId,
    chapter_id: chapterId,
    user_id: userId,
  });
};

export interface WorkStat {
  comicId: string;
  title: string;
  coverUrl: string | null;
  /** Jumlah pembaca terdaftar unik (distinct user_id pada chapter_views). */
  uniqueReaders: number;
  /** Total pembukaan semua chapter. */
  totalReads: number;
  /** Nomor chapter paling banyak dibaca (null bila belum ada pembaca). */
  topChapterNumber: number | null;
  /** Jumlah pembacaan chapter tersebut. */
  topChapterReads: number;
}

export interface AuthorStats {
  works: WorkStat[];
  /** Total follower author ini. */
  followers: number;
  error: boolean;
}

interface ViewRow {
  comic_id: string;
  chapter_id: string;
  user_id: string | null;
}

/** Ambil seluruh statistik karya untuk author yang login. */
export const getAuthorStats = async (): Promise<AuthorStats> => {
  if (!supabase) return { works: [], followers: 0, error: false };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { works: [], followers: 0, error: false };

  // 1. Karya milik author.
  const { data: comicRows, error: comicsErr } = await supabase
    .from('comics')
    .select('id, title, cover_url')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  if (comicsErr) return { works: [], followers: 0, error: true };

  const comics = (comicRows ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    coverUrl: (r.cover_url as string | null) ?? null,
  }));
  const comicIds = comics.map((c) => c.id);

  // 2. Jumlah follower author.
  const { count: followers } = await supabase
    .from('followers')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId);

  if (comicIds.length === 0) {
    return { works: [], followers: followers ?? 0, error: false };
  }

  // 3. Chapters milik karya author (untuk memetakan chapter_id -> nomor).
  const { data: chapterRows, error: chaptersErr } = await supabase
    .from('chapters')
    .select('id, comic_id, number')
    .in('comic_id', comicIds);
  if (chaptersErr) return { works: [], followers: followers ?? 0, error: true };

  const chapters = (chapterRows ?? []).map((r) => ({
    id: r.id as string,
    comic_id: r.comic_id as string,
    number: Number(r.number),
  }));

  // 4. Views untuk karya author (RLS sudah membatasi hanya karya sendiri).
  const { data: viewRows, error: viewsErr } = await supabase
    .from('chapter_views')
    .select('comic_id, chapter_id, user_id')
    .in('comic_id', comicIds);
  if (viewsErr) return { works: [], followers: followers ?? 0, error: true };

  const views = (viewRows ?? []) as ViewRow[];
  const chapterNumberById = new Map(chapters.map((c) => [c.id, c.number]));

  const works: WorkStat[] = comics.map((comic) => {
    const comicViews = views.filter((v) => v.comic_id === comic.id);

    // Pembaca unik: distinct user_id non-null.
    const uniqueReaders = new Set(
      comicViews.filter((v) => v.user_id !== null).map((v) => v.user_id as string),
    ).size;

    // Pembacaan per chapter -> chapter populer.
    const readsByChapter = new Map<number, number>();
    for (const v of comicViews) {
      const number = chapterNumberById.get(v.chapter_id);
      if (number === undefined) continue;
      readsByChapter.set(number, (readsByChapter.get(number) ?? 0) + 1);
    }

    let topChapterNumber: number | null = null;
    let topChapterReads = 0;
    for (const [number, reads] of readsByChapter) {
      if (reads > topChapterReads) {
        topChapterNumber = number;
        topChapterReads = reads;
      }
    }

    return {
      comicId: comic.id,
      title: comic.title,
      coverUrl: comic.coverUrl,
      uniqueReaders,
      totalReads: comicViews.length,
      topChapterNumber,
      topChapterReads,
    };
  });

  return { works, followers: followers ?? 0, error: false };
};
