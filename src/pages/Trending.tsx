import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComicCard, ComicSkeleton } from '../components/ComicCard';
import { fetchTopManga } from '../services/api';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import emptyIllustration from '../assets/empty_ilustration.png';
import type { Comic } from '../types/comic';

export const Trending: React.FC = () => {
  const { t } = useLanguage();
  const [trendingMangas, setTrendingMangas] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchTopManga(20).then(({ data, error: hasError }) => {
      if (cancelled) return;
      setTrendingMangas(data);
      setError(hasError);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-3xl font-bold font-heading text-primary">{t('trending.title')}</h1>
          <p className="text-gray-600">{t('trending.subtitle')}</p>
        </div>

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
        ) : trendingMangas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <img src={emptyIllustration} alt="" className="w-80 h-80 object-contain drop-shadow-lg mb-10" />
            <h3 className="text-2xl font-bold text-gray-500 -mt-5">
              {t('trending.empty')}
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 pb-12">
            {trendingMangas.map((manga) => (
              <Link to={`/comic/${manga.mal_id}`} key={manga.mal_id}>
                <ComicCard
                  title={manga.title}
                  cover={manga.images?.webp?.image_url || manga.images?.jpg?.image_url || ''}
                  episode={manga.chapters ? `Chapters: ${manga.chapters}` : 'Ongoing'}
                  likes={(manga.score || 0).toString()}
                  views={(manga.members || 0).toLocaleString()}
                  isNew={manga.status === "Publishing"}
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
