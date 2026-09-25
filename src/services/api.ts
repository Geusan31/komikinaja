const BASE_URL = 'https://kitsu.io/api/edge';

const mapKitsuToAppFormat = (kitsuItem: any) => {
  return {
    mal_id: kitsuItem.id,
    title: kitsuItem.attributes.canonicalTitle || kitsuItem.attributes.titles.en_jp || "Unknown Title",
    images: { 
      webp: { 
        image_url: kitsuItem.attributes.posterImage?.small || kitsuItem.attributes.posterImage?.original || "https://placehold.co/400x600",
        small_image_url: kitsuItem.attributes.posterImage?.tiny || kitsuItem.attributes.posterImage?.small || "https://placehold.co/100x150",
        large_image_url: kitsuItem.attributes.posterImage?.large || kitsuItem.attributes.posterImage?.original || "https://placehold.co/800x1200"
      },
      jpg: { 
        image_url: kitsuItem.attributes.posterImage?.small || kitsuItem.attributes.posterImage?.original || "https://placehold.co/400x600",
        small_image_url: kitsuItem.attributes.posterImage?.tiny || kitsuItem.attributes.posterImage?.small || "https://placehold.co/100x150",
        large_image_url: kitsuItem.attributes.posterImage?.large || kitsuItem.attributes.posterImage?.original || "https://placehold.co/800x1200"
      }
    },
    chapters: kitsuItem.attributes.chapterCount || null,
    score: kitsuItem.attributes.averageRating ? (parseFloat(kitsuItem.attributes.averageRating) / 10).toFixed(1) : 0,
    members: kitsuItem.attributes.userCount || 0,
    status: kitsuItem.attributes.status === 'current' ? 'Publishing' : 'Finished',
    synopsis: kitsuItem.attributes.synopsis || "No synopsis available."
  };
};

const fetchWithRetry = async (url: string, retries = 3, baseDelay = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        // Rate limited or Server Error, wait and retry
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

export const fetchManga = async (page = 1, query = '', limit = 20, genreId = '', sortOrder = '-userCount') => {
  try {
    const actualLimit = Math.min(limit, 20);
    const offset = (page - 1) * actualLimit;
    let url = `${BASE_URL}/manga?page[limit]=${actualLimit}&page[offset]=${offset}&sort=${sortOrder}`;
    
    if (query) {
      url += `&filter[text]=${encodeURIComponent(query)}`;
    }
    if (genreId) {
      url += `&filter[categories]=${genreId}`;
    }

    const data = await fetchWithRetry(url);
    
    if (data.data && data.data.length > 0) {
      return {
        data: data.data.map(mapKitsuToAppFormat),
        pagination: { has_next_page: !!data.links?.next }
      };
    }
    
    return { data: [], pagination: { has_next_page: false } };

  } catch (error) {
    console.error("API error:", error);
    return { data: [], pagination: { has_next_page: false } };
  }
};

export const fetchTopManga = async (limit = 10) => {
  try {
    const actualLimit = Math.min(limit, 20);
    const data = await fetchWithRetry(`${BASE_URL}/manga?page[limit]=${actualLimit}&sort=-averageRating`);
    return data.data ? data.data.map(mapKitsuToAppFormat) : [];
  } catch (error) {
    console.error("API error:", error);
    return [];
  }
};

export const fetchMangaDetail = async (id: string | number) => {
  try {
    const data = await fetchWithRetry(`${BASE_URL}/manga/${id}`);
    return data.data ? mapKitsuToAppFormat(data.data) : null;
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
};

export const fetchMangaPictures = async (_id: string | number) => {
  try {
    // Kitsu doesn't have a direct equivalent to Jikan's pictures array
    // Returning empty array will trigger the placeholder fallback logic in ReadingMode.tsx
    return [];
  } catch (error) {
    return [];
  }
};
