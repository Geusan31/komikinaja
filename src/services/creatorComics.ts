import { supabase } from './supabase';

/**
 * Service untuk karya komik author (tabel comics/chapters/chapter_pages
 * + bucket Storage `komikinaja-media`).
 *
 * ID memakai UUID sehingga bisa dibedakan dari id Kitsu (numerik).
 * Gunakan `isKitsuId` untuk membedakan sumber di halaman detail/mode baca.
 */

const BUCKET = 'komikinaja-media';

/** id Kitsu selalu berupa angka; UUID karya author tidak. */
export const isKitsuId = (id: string): boolean => /^\d+$/.test(id);

export interface CreatorComic {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  genres: string[];
  authorName: string;
  createdAt: string;
}

export interface CreatorChapter {
  id: string;
  number: number;
  title: string | null;
  pageCount: number;
}

interface ComicRow {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  genres: string[] | null;
  created_at: string;
  author_id: string;
  profiles: { username: string | null } | null;
}

const mapComic = (row: ComicRow): CreatorComic => ({
  id: row.id,
  title: row.title,
  description: row.description,
  coverUrl: row.cover_url,
  genres: row.genres ?? [],
  authorName: row.profiles?.username ?? 'Author',
  createdAt: row.created_at,
});

const COMIC_SELECT =
  'id, title, description, cover_url, genres, created_at, author_id, profiles(username)';

/** Unggah satu berkas ke Storage dan kembalikan path-nya (bukan URL). */
const uploadToStorage = async (userId: string, folder: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase!.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
};

/** Ubah path Storage menjadi URL publik. */
const publicUrl = (path: string): string =>
  supabase!.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

/** Daftar karya terbit (untuk section beranda). */
export const listPublishedComics = async (limit = 6): Promise<{ data: CreatorComic[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };
  const { data, error } = await supabase
    .from('comics')
    .select(COMIC_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: true };
  return { data: (data ?? []).map((r) => mapComic(r as unknown as ComicRow)), error: false };
};

/** Daftar karya milik author yang login. */
export const listMyComics = async (): Promise<{ data: CreatorComic[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { data: [], error: false };

  const { data, error } = await supabase
    .from('comics')
    .select(COMIC_SELECT)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: true };
  return { data: (data ?? []).map((r) => mapComic(r as unknown as ComicRow)), error: false };
};

/** Ambil satu komik karya creator lengkap dengan daftar chapter. */
export const getCreatorComic = async (
  id: string,
): Promise<{ data: CreatorComic | null; chapters: CreatorChapter[]; error: boolean }> => {
  if (!supabase) return { data: null, chapters: [], error: false };

  const { data: comicRow, error } = await supabase
    .from('comics')
    .select(COMIC_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) return { data: null, chapters: [], error: true };
  if (!comicRow) return { data: null, chapters: [], error: false };

  const chapters = await listChapters(id);
  return { data: mapComic(comicRow as unknown as ComicRow), chapters, error: false };
};

/** Daftar chapter satu komik (dengan jumlah halaman). */
export const listChapters = async (comicId: string): Promise<CreatorChapter[]> => {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chapters')
    .select('id, number, title, chapter_pages(id)')
    .eq('comic_id', comicId)
    .order('number', { ascending: true });
  return (data ?? []).map((row) => ({
    id: row.id,
    number: Number(row.number),
    title: row.title,
    pageCount: row.chapter_pages?.length ?? 0,
  }));
};

/** Buat komik baru (opsional unggah sampul). Mengembalikan id komik. */
export const createComic = async (input: {
  title: string;
  description: string;
  genres: string[];
  coverFile?: File | null;
}): Promise<{ data: string | null; error: string | null }> => {
  if (!supabase) return { data: null, error: 'Supabase belum dikonfigurasi.' };
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { data: null, error: 'Harus login sebagai author.' };
  if (!input.title.trim()) return { data: null, error: 'Judul tidak boleh kosong.' };

  let coverUrl: string | null = null;
  if (input.coverFile) {
    try {
      const path = await uploadToStorage(userId, 'covers', input.coverFile);
      coverUrl = publicUrl(path);
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Gagal unggah sampul.' };
    }
  }

  const { data, error } = await supabase
    .from('comics')
    .insert({
      author_id: userId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      cover_url: coverUrl,
      genres: input.genres,
    })
    .select('id')
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data.id as string, error: null };
};

/** Tambah satu chapter beserta halaman-halamannya. */
export const addChapter = async (
  comicId: string,
  input: { number: number; title?: string; pageFiles: File[] },
): Promise<{ error: string | null }> => {
  if (!supabase) return { error: 'Supabase belum dikonfigurasi.' };
  if (!Number.isFinite(input.number)) return { error: 'Nomor chapter tidak valid.' };
  if (input.pageFiles.length === 0) return { error: 'Pilih minimal satu gambar halaman.' };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: 'Harus login sebagai author.' };

  const { data: chapterRow, error: chapterErr } = await supabase
    .from('chapters')
    .insert({ comic_id: comicId, number: input.number, title: input.title?.trim() || null })
    .select('id')
    .single();
  if (chapterErr) return { error: chapterErr.message };
  const chapterId = chapterRow.id as string;

  // Unggah semua halaman, urutkan sesuai urutan berkas yang dipilih.
  try {
    const rows: { chapter_id: string; page_number: number; image_path: string }[] = [];
    for (let i = 0; i < input.pageFiles.length; i++) {
      const path = await uploadToStorage(userId, 'pages', input.pageFiles[i]);
      rows.push({ chapter_id: chapterId, page_number: i + 1, image_path: path });
    }
    const { error: pagesErr } = await supabase.from('chapter_pages').insert(rows);
    if (pagesErr) return { error: pagesErr.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Gagal unggah halaman.' };
  }

  return { error: null };
};

/** Ambil URL publik halaman-halaman sebuah chapter (terurut). */
export const getChapterPages = async (chapterId: string): Promise<{ data: string[]; error: boolean }> => {
  if (!supabase) return { data: [], error: false };
  const { data, error } = await supabase
    .from('chapter_pages')
    .select('page_number, image_path')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });
  if (error) return { data: [], error: true };
  return { data: (data ?? []).map((r) => publicUrl(r.image_path)), error: false };
};

/** Cari chapter berdasarkan nomor dalam suatu komik. */
export const findChapterByNumber = async (
  comicId: string,
  number: number,
): Promise<CreatorChapter | null> => {
  if (!supabase) return null;
  const { data } = await supabase
    .from('chapters')
    .select('id, number, title, chapter_pages(id)')
    .eq('comic_id', comicId)
    .eq('number', number)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    number: Number(data.number),
    title: data.title,
    pageCount: data.chapter_pages?.length ?? 0,
  };
};
