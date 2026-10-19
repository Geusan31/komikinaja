import { supabase } from './supabase';

/**
 * Service untuk daftar favorit pengguna (tabel `favorites` di Supabase).
 * Semua operasi hanya menyentuh baris milik pengguna aktif (dibatasi RLS).
 */

export interface FavoriteEntry {
  comicId: string;
  title: string;
  cover: string | null;
}

/** Ambil seluruh favorit milik pengguna aktif, terbaru di atas. */
export const listFavorites = async (): Promise<{ data: FavoriteEntry[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };
  const { data, error } = await supabase
    .from('favorites')
    .select('comic_id, comic_title, comic_cover, created_at')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: true };
  return {
    data: (data ?? []).map((row) => ({
      comicId: row.comic_id,
      title: row.comic_title,
      cover: row.comic_cover,
    })),
    error: false,
  };
};

/** Apakah komik (dengan id Kitsu tertentu) sedang difavoritkan pengguna aktif? */
export const isFavorite = async (comicId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('comic_id', comicId)
    .maybeSingle();
  return Boolean(data);
};

/** Tambah komik ke favorit. Aman dipanggil berulang (abaikan bila sudah ada). */
export const addFavorite = async (entry: FavoriteEntry): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: 'Harus login untuk menambah favorit.' };

  const { error } = await supabase
    .from('favorites')
    .upsert(
      { user_id: userId, comic_id: entry.comicId, comic_title: entry.title, comic_cover: entry.cover },
      { onConflict: 'user_id,comic_id', ignoreDuplicates: true },
    );
  return { error: error ? error.message : null };
};

/** Hapus komik dari favorit. Mengembalikan error bila gagal. */
export const removeFavorite = async (comicId: string): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { error } = await supabase.from('favorites').delete().eq('comic_id', comicId);
  return { error: error ? error.message : null };
};
