import { supabase } from './supabase';

/**
 * Service mengikuti/mengikuti berhenti (tabel followers, A2).
 * Relasi bersifat per-author (bukan per-karya).
 */

/** Apakah pengguna yang login sedang mengikuti author ini? */
export const isFollowing = async (authorId: string): Promise<boolean> => {
  if (!supabase) return false;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;

  const { data } = await supabase
    .from('followers')
    .select('id')
    .eq('follower_id', userId)
    .eq('author_id', authorId)
    .maybeSingle();
  return data !== null;
};

/** Ikuti author. */
export const followAuthor = async (authorId: string): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: 'Harus login untuk mengikuti author.' };
  if (userId === authorId) return { error: 'Tidak bisa mengikuti diri sendiri.' };

  const { error } = await supabase
    .from('followers')
    .insert({ follower_id: userId, author_id: authorId });
  // code 23505 = sudah mengikuti (unique violation) — anggap sukses.
  if (error && error.code !== '23505') return { error: error.message };
  return { error: null };
};

/** Berhenti mengikuti author. */
export const unfollowAuthor = async (authorId: string): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: 'Harus login.' };

  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', userId)
    .eq('author_id', authorId);
  if (error) return { error: error.message };
  return { error: null };
};

/** Jumlah follower seorang author. */
export const followerCount = async (authorId: string): Promise<number> => {
  if (!supabase) return 0;
  const { count } = await supabase
    .from('followers')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', authorId);
  return count ?? 0;
};
