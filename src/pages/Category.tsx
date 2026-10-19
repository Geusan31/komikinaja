import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ComicCard, ComicSkeleton } from '../components/ComicCard';
import { categories } from '../data/dummy';
import { Search, AlertCircle } from 'lucide-react';
import { fetchManga } from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import emptyIllustration from '../assets/empty_ilustration.png';
import type { Comic } from '../types/comic';

// Map UI category to Kitsu Category slugs for accurate filtering
const genreMap: Record<string, string> = {
  "DRAMA": "drama",
  "FANTASI": "fantasy",
  "KERAJAAN": "historical",
  "ACTION": "action",
  "ROMANCE": "romance",
  "SLICE OF LIFE": "slice-of-life",
  "HORROR": "horror",
  "THRILLER": "thriller"
};

// Key i18n untuk tiap opsi urutan, dan sort Kitsu yang sesuai.
// Label diambil dari data, bukan label yang menyesatkan.
const sortOptions = [
  { key: 'Popularitas', i18nKey: 'category.sortPopular', kitsuSort: '-userCount' },
  { key: 'Rating Tertinggi', i18nKey: 'category.sortRating', kitsuSort: '-averageRating' },
  { key: 'Tanggal Terbaru', i18nKey: 'category.sortDate', kitsuSort: '-startDate' },
] as const;

export const Category: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeSort, setActiveSort] = useState<string>(sortOptions[0].key);
  // Query ter-commit berasal dari URL; searchQuery hanya buffer input.
  const urlQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);

  const [mangas, setMangas] = useState<Comic[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const buildFilter = (category: string, sortKey: string) => {
    const genreId = category === "ALL" ? "" : genreMap[category] || "";
    const sortOrder = sortOptions.find(o => o.key === sortKey)?.kitsuSort || sortOptions[0].kitsuSort;
    return { genreId, sortOrder };
  };

  // Muat halaman pertama setiap kali filter berubah. setState sinkron dihindari
  // di sini; semua hasil diterapkan di callback async (.then).
  useEffect(() => {
    let cancelled = false;
    const { genreId, sortOrder } = buildFilter(activeCategory, activeSort);
    fetchManga(1, urlQuery, 20, genreId, sortOrder).then((data) => {
      if (cancelled) return;
      setMangas(data.data);
      setHasNextPage(data.pagination.has_next_page);
      setError(data.error);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeCategory, activeSort, urlQuery, reloadKey]);

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory) return;
    setLoading(true);
    setError(false);
    setActiveCategory(cat);
  };

  const handleSortChange = (key: string) => {
    if (key === activeSort) return;
    setLoading(true);
    setError(false);
    setActiveSort(key);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed === urlQuery) return; // query tidak berubah, tidak perlu reload
    setLoading(true);
    setError(false);
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  const handleLoadMore = () => {
    const nextPage = Math.floor(mangas.length / 20) + 1;
    const { genreId, sortOrder } = buildFilter(activeCategory, activeSort);
    fetchManga(nextPage, urlQuery, 20, genreId, sortOrder).then((data) => {
      setMangas(prev => [...prev, ...data.data]);
      setHasNextPage(data.pagination.has_next_page);
      setError(data.error);
      setLoading(false);
    });
  };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Category Navigation */}
      <div className="w-full border-b-2 border-primary/10 bg-background sticky top-18 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 overflow-x-auto py-4 hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                aria-pressed={activeCategory === cat}
                className={`font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-transparent focus:border-primary focus:ring-0 outline-none transition-colors"
          />
        </form>

        {/* Filters & Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <h2 className="font-bold text-primary">{t('category.count', { count: mangas.length })}</h2>

          <div className="flex items-center gap-4 text-sm font-medium">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortChange(opt.key)}
                aria-pressed={activeSort === opt.key}
                className={`transition-colors ${
                  activeSort === opt.key ? 'text-primary' : 'text-gray-500 hover:text-primary'
                } ${opt.key !== sortOptions[0].key ? 'border-l-2 border-gray-300 pl-4' : ''}`}
              >
                {t(opt.i18nKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 pb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <ComicSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="flex items-center gap-2 text-red-600 font-semibold">
              <AlertCircle size={24} aria-hidden="true" />
              {t('common.loadError')}
            </div>
            <button
              onClick={handleRetry}
              className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : mangas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <img src={emptyIllustration} alt="" className="w-80 h-80 object-contain drop-shadow-lg mb-10" />
            <h3 className="text-2xl font-bold text-gray-500 -mt-5">
              {t('category.notFound', { query: urlQuery || "Manga" })}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 pb-12">
            {mangas.map((manga) => (
              <Link to={`/comic/${manga.mal_id}`} key={manga.mal_id}>
                <ComicCard
                  title={manga.title}
                  cover={manga.images?.webp?.image_url || manga.images?.jpg?.image_url || "https://placehold.co/400x600"}
                  episode={manga.chapters ? `Chapters: ${manga.chapters}` : 'Ongoing'}
                  likes={(manga.score || 0).toString()}
                  views={(manga.members || 0).toLocaleString()}
                  isNew={manga.status === "Publishing"}
                />
              </Link>
            ))}
          </div>
        )}

        {hasNextPage && !loading && !error && (
          <div className="flex justify-center mb-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              {t('home.viewMore')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
