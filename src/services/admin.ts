import { supabase } from './supabase';

/**
 * Service admin (S1): moderasi konten & daftar blokir.
 * Semua operasi membutuhkan akun dengan is_admin = true
 * (dijamin RLS migrasi 0004 + cek di halaman /admin).
 */

export interface AdminUser {
  id: string;
  username: string;
  role: string | null;
  isBanned: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface AdminComic {
  id: string;
  title: string;
  coverUrl: string | null;
  authorName: string;
  hidden: boolean;
  createdAt: string;
}

/** Apakah pengguna yang login adalah admin? */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  return data?.is_admin === true;
};

/** Daftar semua pengguna (untuk moderasi/daftar blokir). */
export const listAllUsers = async (): Promise<{ data: AdminUser[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, is_admin, banned_at, created_at')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: true };

  return {
    data: (data ?? []).map((r) => ({
      id: r.id as string,
      username: (r.username as string | null) ?? 'Pengguna',
      role: (r.role as string | null) ?? null,
      isBanned: r.banned_at !== null,
      isAdmin: r.is_admin === true,
      createdAt: r.created_at as string,
    })),
    error: false,
  };
};

/** Blokir/buka blokir akun pengguna. */
export const setUserBan = async (userId: string, banned: boolean): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { error } = await supabase
    .from('profiles')
    .update({ banned_at: banned ? new Date().toISOString() : null })
    .eq('id', userId);
  if (error) return { error: error.message };
  return { error: null };
};

/** Daftar semua karya creator (untuk moderasi konten). */
interface AdminComicRow {
  id: string;
  title: string;
  cover_url: string | null;
  hidden: boolean;
  created_at: string;
  profiles: { username: string | null } | null;
}

export const listAllComics = async (): Promise<{ data: AdminComic[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };
  const { data, error } = await supabase
    .from('comics')
    .select('id, title, cover_url, hidden, created_at, profiles(username)')
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: true };

  return {
    data: (data ?? []).map((raw) => {
      const r = raw as unknown as AdminComicRow;
      return {
        id: r.id,
        title: r.title,
        coverUrl: r.cover_url ?? null,
        authorName: r.profiles?.username ?? 'Author',
        hidden: r.hidden === true,
        createdAt: r.created_at,
      };
    }),
    error: false,
  };
};

/** Sembunyikan/tampilkan komik (moderasi konten). */
export const setComicHidden = async (comicId: string, hidden: boolean): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { error } = await supabase
    .from('comics')
    .update({ hidden })
    .eq('id', comicId);
  if (error) return { error: error.message };
  return { error: null };
};
