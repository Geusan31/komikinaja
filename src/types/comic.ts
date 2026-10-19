/**
 * Tipe data terpusat untuk entitas komik.
 * Format mengikuti bentuk hasil mapping Kitsu API di services/api.ts
 * (menyerupai format Jikan agar konsisten dengan kode yang sudah ada).
 */

export interface ComicImageSet {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface ComicImages {
  webp: ComicImageSet;
  jpg: ComicImageSet;
}

export interface ComicGenre {
  mal_id: number;
  name: string;
}

export interface ComicAuthor {
  name: string;
  role?: string;
}

export interface Comic {
  /** ID komik di Kitsu. */
  mal_id: string;
  title: string;
  images: ComicImages;
  chapters: number | null;
  /** Rating rata-rata 0–10 (hasil konversi rating Kitsu 0–100). */
  score: number;
  /** Jumlah pembaca terdaftar di Kitsu. */
  members: number;
  /** Jumlah favorit di Kitsu. */
  favorites: number;
  status: 'Publishing' | 'Finished';
  synopsis: string;
  authors: ComicAuthor[];
  genres: ComicGenre[];
}

export interface Pagination {
  has_next_page: boolean;
}

export interface PaginatedComics {
  data: Comic[];
  pagination: Pagination;
  /** true jika request gagal (bukan karena memang tidak ada hasil). */
  error: boolean;
}
