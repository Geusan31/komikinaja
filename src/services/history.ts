import { supabase } from './supabase';

/**
 * Service untuk riwayat baca (tabel `reading_history`).
 * Mencatat komik terakhir dibuka pengguna agar bisa "Lanjutkan membaca".
 */

export interface HistoryEntry {
  comicId: string;
  title: string;
  cover: string | null;
  lastViewedAt: string;
}

/** Catat bahwa pengguna membuka sebuah komik (upsert agar tidak ganda). */
export const recordView = async (comic: {
  comicId: string;
  title: string;
  cover: string | null;
}): Promise<void> => {
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

/** Ambil riwayat terakhir dibuka, terbaru di atas. */
export const listHistory = async (limit = 6): Promise<{ data: HistoryEntry[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };

  const { data, error } = await supabase
    .from('reading_history')
    .select('comic_id, comic_title, comic_cover, last_viewed_at')
    .order('last_viewed_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: true };
  return {
    data: (data ?? []).map((row) => ({
      comicId: row.comic_id,
      title: row.comic_title,
      cover: row.comic_cover,
      lastViewedAt: row.last_viewed_at,
    })),
    error: false,
  };
};
