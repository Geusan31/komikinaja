import type { Comic } from '../types/comic';
import { fetchManga, fetchMangaDetail, fetchTopManga } from './api';
import { listHistory } from './history';

/**
 * Rekomendasi berbasis riwayat baca (M5).
 *
 * Pendekatannya: kumpulkan genre dari komik yang sudah dibaca user,
 * lalu skor kandidat dari Kitsu berdasarkan kecocokan genre di klien.
 * Tidak memakai `filter[categories]` Kitsu karena nama genre tidak
 * selalu sama dengan slug kategori — skor jauh lebih jujur & tahan banting.
 *
 * Saat tidak ada riwayat (atau gagal), fallback ke komik rating
 * tertinggi sebagai rekomendasi default.
 */

export interface PersonalizedResult {
  data: Comic[];
  /** True bila benar-benar dipersonalisasi dari riwayat baca. */
  personalized: boolean;
  error: boolean;
}

const HISTORY_LIMIT = 12;
const POOL_SIZE = 20;
const RECOMMEND_LIMIT = 6;

/**
 * Skor kecocokan satu kandidat terhadap genre preferensi (fungsi murni).
 * `preferred` memetakan nama genre (huruf kecil) -> bobot (frekuensi baca).
 * Kembalikan total bobot genre kandidat yang cocok.
 */
export const scoreCandidate = (
  candidateGenres: string[],
  preferred: Map<string, number>,
): number => {
  let score = 0;
  for (const genre of candidateGenres) {
    score += preferred.get(genre.toLowerCase()) ?? 0;
  }
  return score;
};

/** Bangun peta genre preferensi dari daftar genre komik yang dibaca (murni). */
export const buildPreferredGenres = (genreLists: string[][]): Map<string, number> => {
  const preferred = new Map<string, number>();
  for (const genres of genreLists) {
    for (const genre of genres) {
      const key = genre.toLowerCase();
      preferred.set(key, (preferred.get(key) ?? 0) + 1);
    }
  }
  return preferred;
};

/** Urutkan kandidat: skor tertinggi dulu, lalu buang yang sudah dibaca (murni). */
export const rankCandidates = (
  candidates: Comic[],
  preferred: Map<string, number>,
  readIds: Set<string>,
  limit: number,
): Comic[] => {
  const seen = new Set<string>();
  const scored: { comic: Comic; score: number }[] = [];

  for (const comic of candidates) {
    if (readIds.has(comic.mal_id)) continue;
    if (seen.has(comic.mal_id)) continue;
    seen.add(comic.mal_id);

    const score = scoreCandidate(comic.genres.map((g) => g.name), preferred);
    if (score > 0) scored.push({ comic, score });
  }

  // Stable sort: skor tertinggi dulu (urutan asli dipertahankan saat seri).
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.comic);
};

/**
 * Rekomendasi personal untuk pengguna yang login.
 * Fallback jujur: tanpa riwayat / tanpa kecocokan / gagal -> rating tertinggi.
 */
export const getPersonalizedRecommendations = async (
  limit = RECOMMEND_LIMIT,
): Promise<PersonalizedResult> => {
  // 1. Riwayat baca pengguna.
  const { data: history } = await listHistory(HISTORY_LIMIT);
  const readIds = new Set(history.map((h) => h.comicId));

  // Belum ada riwayat -> rekomendasi default (rating tertinggi).
  if (history.length === 0) {
    const { data, error } = await fetchTopManga(limit);
    return { data, personalized: false, error };
  }

  // 2. Genre preferensi dari komik yang sudah dibaca (paralel, toleran gagal).
  const details = await Promise.all(history.map((h) => fetchMangaDetail(h.comicId)));
  const genreLists = details
    .map((d) => (d.data?.genres ?? []).map((g) => g.name))
    .filter((g) => g.length > 0);
  const preferred = buildPreferredGenres(genreLists);

  // 3. Kandidat dari Kitsu (rating tertinggi + populer), sudah menyertakan genre.
  const [top, popular] = await Promise.all([
    fetchTopManga(POOL_SIZE),
    fetchManga(1, '', POOL_SIZE),
  ]);
  const error = top.error && popular.error;
  const pool = [...top.data, ...popular.data];

  // Tidak ada preferensi atau kandidat -> fallback default.
  if (preferred.size === 0 || pool.length === 0) {
    const fallback = top.data.length > 0 ? top.data : (await fetchTopManga(limit)).data;
    return { data: fallback.slice(0, limit), personalized: false, error };
  }

  // 4. Skor + buang yang sudah dibaca.
  const matches = rankCandidates(pool, preferred, readIds, limit);
  if (matches.length === 0) {
    return { data: top.data.slice(0, limit), personalized: false, error };
  }

  // 5. Bila hasil kecocokan kurang dari `limit`, lengkapi dengan rating
  //    tertinggi (tanpa duplikat & tanpa yang sudah dibaca).
  if (matches.length < limit) {
    const chosen = new Set(matches.map((m) => m.mal_id));
    for (const comic of top.data) {
      if (matches.length >= limit) break;
      if (readIds.has(comic.mal_id) || chosen.has(comic.mal_id)) continue;
      chosen.add(comic.mal_id);
      matches.push(comic);
    }
  }

  return { data: matches, personalized: true, error };
};
