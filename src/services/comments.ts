import { supabase } from './supabase';

/**
 * Service untuk komentar per komik (tabel `comments`).
 * Komentar menempel pada id komik Kitsu (string) dan bisa untuk seluruh katalog.
 */

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  /** true bila komentar milik pengguna aktif (boleh dihapus). */
  isOwn: boolean;
  user: { name: string; avatar: string };
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
}

const mapRow = (row: CommentRow, currentUserId?: string): Comment => {
  const name = row.profiles?.username ?? 'Pengguna';
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    isOwn: row.user_id === currentUserId,
    user: {
      name,
      avatar:
        row.profiles?.avatar_url ??
        `https://placehold.co/200x200/1F2544/FFFFFF/png?text=${encodeURIComponent(name.charAt(0).toUpperCase())}`,
    },
  };
};

/** Ambil semua komentar satu komik, terbaru di atas. */
export const listComments = async (comicId: string): Promise<{ data: Comment[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };

  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData.user?.id;

  const { data, error } = await supabase
    .from('comments')
    .select('id, content, created_at, user_id, profiles(username, avatar_url)')
    .eq('comic_id', comicId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: true };
  return { data: (data ?? []).map((row) => mapRow(row as unknown as CommentRow, currentUserId)), error: false };
};

/** Tambah komentar untuk komik tertentu. */
export const addComment = async (comicId: string, content: string): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const trimmed = content.trim();
  if (!trimmed) return { error: 'Komentar tidak boleh kosong.' };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: 'Harus login untuk berkomentar.' };

  const { error } = await supabase
    .from('comments')
    .insert({ user_id: userId, comic_id: comicId, content: trimmed });
  return { error: error ? error.message : null };
};

/** Hapus komentar (hanya milik sendiri, dibatasi RLS). */
export const deleteComment = async (id: string): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  const { error } = await supabase.from('comments').delete().eq('id', id);
  return { error: error ? error.message : null };
};
