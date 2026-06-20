import { mangas as dummyMangas } from '../data/dummy';

const BASE_URL = 'https://api.jikan.moe/v4';

const getFallbackMangas = () => {
  return dummyMangas.map(m => ({
    mal_id: m.id,
    title: m.title,
    images: { webp: { image_url: m.cover } },
    chapters: m.episode,
    score: m.likes,
    members: m.views,
    status: m.isNew ? "Publishing" : "Finished"
  }));
};

const filterBannedMangas = (mangas: any[]) => {
  const bannedIds = [71];
  return mangas.filter(m => !bannedIds.includes(m.mal_id));
};

const fetchWithRetry = async (url: string, retries = 3, baseDelay = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, baseDelay));
    }
  }
  throw new Error('Max retries reached');
};

export const fetchManga = async (page = 1, query = '', limit = 24, genreId = '') => {
  try {
    const searchParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const genreParam = genreId ? `&genres=${genreId}` : '';
    const data = await fetchWithRetry(`${BASE_URL}/manga?page=${page}&limit=${limit}${searchParam}${genreParam}&order_by=popularity&sort=asc&sfw=true&genres_exclude=9,12,26,28,43,49,58`);
    return {
      data: filterBannedMangas(data.data || getFallbackMangas()),
      pagination: data.pagination || { has_next_page: false }
    };
  } catch (error) {
    console.error("API error, using fallback data:", error);
    return { data: filterBannedMangas(getFallbackMangas()), pagination: { has_next_page: false } };
  }
};

export const fetchTopManga = async (limit = 10) => {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/top/manga?limit=${limit}&sfw=true&genres_exclude=9,12,26,28,43,49,58`);
    return filterBannedMangas(data.data || getFallbackMangas());
  } catch (error) {
    console.error("API error, using fallback data:", error);
    return filterBannedMangas(getFallbackMangas());
  }
};

export const fetchMangaDetail = async (id: string | number) => {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/manga/${id}`);
    return data.data || getFallbackMangas().find((m: any) => m.mal_id.toString() === id.toString()) || getFallbackMangas()[0];
  } catch (error) {
    console.error("API error, using fallback data:", error);
    return getFallbackMangas().find((m: any) => m.mal_id.toString() === id.toString()) || getFallbackMangas()[0];
  }
};

export const fetchMangaPictures = async (id: string | number) => {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/manga/${id}/pictures`);
    return data.data || [];
  } catch (error) {
    console.error("API error, using fallback data:", error);
    return [];
  }
};
