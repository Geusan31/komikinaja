import type { Comic, ComicAuthor, ComicGenre, PaginatedComics } from '../types/comic';

const BASE_URL = 'https://kitsu.io/api/edge';

const PLACEHOLDER = 'https://placehold.co/400x600';

/** Bentuk mentah item manga dari Kitsu (hanya field yang dipakai). */
interface KitsuMangaResource {
  id: string;
  attributes: {
    canonicalTitle?: string;
    titles?: Record<string, string | undefined>;
    posterImage?: { tiny?: string; small?: string; large?: string; original?: string };
    chapterCount?: number | null;
    averageRating?: string | null;
    userCount?: number | null;
    favoritesCount?: number | null;
    status?: string;
    synopsis?: string | null;
  };
  relationships?: {
    genres?: { data?: Array<{ id: string }> };
    staff?: { data?: Array<{ id: string }> };
  };
}

/** Item `included` dari response Kitsu (genres, mediaStaff, people). */
interface KitsuIncludedItem {
  id: string;
  type: string;
  attributes: {
    name?: string;
    role?: string;
  };
  relationships?: {
    person?: { data?: { id: string } };
  };
}

interface KitsuListResponse {
  data: KitsuMangaResource[];
  included?: KitsuIncludedItem[];
  links?: { next?: string | null };
}

interface KitsuDetailResponse {
  data: KitsuMangaResource;
  included?: KitsuIncludedItem[];
}

/**
 * Mapping genre dari `included` berdasarkan relationship `genres` item manga.
 * `include=genres` harus ditambahkan ke URL agar data genre tersedia.
 */
const mapGenres = (item: KitsuMangaResource, included: KitsuIncludedItem[] | undefined): ComicGenre[] => {
  const genreIds = item.relationships?.genres?.data;
  if (!genreIds || !included) return [];
  return genreIds
    .map((ref) => {
      const genreItem = included.find((inc) => inc.type === 'genres' && inc.id === ref.id);
      if (!genreItem?.attributes.name) return null;
      return { mal_id: Number(genreItem.id), name: genreItem.attributes.name };
    })
    .filter((g): g is ComicGenre => g !== null);
};

/**
 * Mapping penulis dari `included` (mediaStaff → person).
 * `include=staff.person` harus ditambahkan ke URL agar nama penulis tersedia.
 */
const mapAuthors = (item: KitsuMangaResource, included: KitsuIncludedItem[] | undefined): ComicAuthor[] => {
  const staffRefs = item.relationships?.staff?.data;
  if (!staffRefs || !included) return [];
  return staffRefs
    .map((ref): ComicAuthor | null => {
      const staffItem = included.find((inc) => inc.type === 'mediaStaff' && inc.id === ref.id);
      const personId = staffItem?.relationships?.person?.data?.id;
      if (!staffItem || !personId) return null;
      const personItem = included.find((inc) => inc.type === 'people' && inc.id === personId);
      if (!personItem?.attributes.name) return null;
      return { name: personItem.attributes.name, role: staffItem.attributes.role };
    })
    .filter((a): a is ComicAuthor => a !== null);
};

/**
 * Mapping item Kitsu → format internal aplikasi.
 * Export untuk keperluan unit test.
 */
export const mapKitsuToAppFormat = (item: KitsuMangaResource, included?: KitsuIncludedItem[]): Comic => {
  const attrs = item.attributes;
  const poster = attrs.posterImage;

  return {
    mal_id: item.id,
    title:
      attrs.canonicalTitle ||
      attrs.titles?.en_jp ||
      attrs.titles?.en ||
      'Unknown Title',
    images: {
      webp: {
        image_url: poster?.small || poster?.original || PLACEHOLDER,
        small_image_url: poster?.tiny || poster?.small || PLACEHOLDER,
        large_image_url: poster?.large || poster?.original || PLACEHOLDER,
      },
      jpg: {
        image_url: poster?.small || poster?.original || PLACEHOLDER,
        small_image_url: poster?.tiny || poster?.small || PLACEHOLDER,
        large_image_url: poster?.large || poster?.original || PLACEHOLDER,
      },
    },
    chapters: attrs.chapterCount ?? null,
    score: attrs.averageRating ? Number((parseFloat(attrs.averageRating) / 10).toFixed(1)) : 0,
    members: attrs.userCount ?? 0,
    favorites: attrs.favoritesCount ?? 0,
    status: attrs.status === 'current' ? 'Publishing' : 'Finished',
    synopsis: attrs.synopsis || 'No synopsis available.',
    authors: mapAuthors(item, included),
    genres: mapGenres(item, included),
  };
};

const fetchWithRetry = async <T,>(url: string, retries = 3, baseDelay = 1000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        // Rate limited or Server Error, wait and retry
        await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return (await res.json()) as T;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay));
    }
  }
  throw new Error('Max retries reached');
};

/**
 * Daftar manga dengan pagination.
 * `error: true` berarti request gagal (bukan karena memang tidak ada hasil).
 */
export const fetchManga = async (
  page = 1,
  query = '',
  limit = 20,
  genreId = '',
  sortOrder = '-userCount',
): Promise<PaginatedComics> => {
  try {
    const actualLimit = Math.min(limit, 20);
    const offset = (page - 1) * actualLimit;
    let url = `${BASE_URL}/manga?page[limit]=${actualLimit}&page[offset]=${offset}&sort=${sortOrder}&include=genres`;

    if (query) {
      url += `&filter[text]=${encodeURIComponent(query)}`;
    }
    if (genreId) {
      url += `&filter[categories]=${genreId}`;
    }

    const data = await fetchWithRetry<KitsuListResponse>(url);

    if (data.data && data.data.length > 0) {
      return {
        data: data.data.map((item) => mapKitsuToAppFormat(item, data.included)),
        pagination: { has_next_page: !!data.links?.next },
        error: false,
      };
    }

    return { data: [], pagination: { has_next_page: false }, error: false };
  } catch (error) {
    console.error('API error:', error);
    return { data: [], pagination: { has_next_page: false }, error: true };
  }
};

/** Top manga berdasarkan rating rata-rata (bukan tren mingguan). */
export const fetchTopManga = async (limit = 10): Promise<{ data: Comic[]; error: boolean }> => {
  try {
    const actualLimit = Math.min(limit, 20);
    const data = await fetchWithRetry<KitsuListResponse>(
      `${BASE_URL}/manga?page[limit]=${actualLimit}&sort=-averageRating&include=genres`,
    );
    return { data: data.data ? data.data.map((item) => mapKitsuToAppFormat(item)) : [], error: false };
  } catch (error) {
    console.error('API error:', error);
    return { data: [], error: true };
  }
};

/**
 * Detail satu manga, termasuk genre (`genres`) dan penulis (`staff.person`).
 * `error: true` berarti request gagal; `data: null` tanpa error berarti tidak ditemukan.
 */
export const fetchMangaDetail = async (
  id: string | number,
): Promise<{ data: Comic | null; error: boolean }> => {
  try {
    const data = await fetchWithRetry<KitsuDetailResponse>(
      `${BASE_URL}/manga/${id}?include=genres,staff.person`,
    );
    return { data: data.data ? mapKitsuToAppFormat(data.data, data.included) : null, error: false };
  } catch (error) {
    console.error('API error:', error);
    return { data: null, error: true };
  }
};
