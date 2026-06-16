const BASE_URL = 'https://api.jikan.moe/v4';

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

export const fetchManga = async (page = 1, query = '', limit = 24) => {
  try {
    const searchParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const data = await fetchWithRetry(`${BASE_URL}/manga?page=${page}&limit=${limit}${searchParam}&order_by=popularity&sort=asc&sfw=true`);
    return {
      data: data.data,
      pagination: data.pagination
    };
  } catch (error) {
    console.error(error);
    return { data: [], pagination: { has_next_page: false } };
  }
};

export const fetchTopManga = async (limit = 10) => {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/top/manga?limit=${limit}&sfw=true`);
    return data.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchMangaDetail = async (id: string | number) => {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/manga/${id}`);
    return data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
