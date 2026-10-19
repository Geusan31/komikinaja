import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import { ChevronLeft, Eye, Bookmark, BookOpen, MessageCircle, AlertCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import type { Comic } from '../types/comic';

export const ComicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [manga, setManga] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchMangaDetail(id).then(({ data, error: hasError }) => {
      if (cancelled) return;
      setManga(data);
      setError(hasError);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-left">
        <Navbar />
        {/* Skeleton Hero Header */}
        <div className="w-full h-64 md:h-80 bg-gray-300 animate-pulse"></div>
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-32 relative z-10 flex flex-col items-center animate-pulse">
          {/* Skeleton Cover */}
          <div className="w-48 h-72 rounded-xl bg-gray-400 mb-6 border-4 border-background"></div>
          {/* Skeleton Title & Info */}
          <div className="w-3/4 h-10 bg-gray-300 rounded mb-4"></div>
          <div className="w-1/2 h-6 bg-gray-300 rounded mb-8"></div>

          <div className="flex gap-2 mb-6">
            <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
          </div>

          <div className="w-full max-w-3xl flex flex-col gap-3 mb-8">
            <div className="w-full h-4 bg-gray-300 rounded"></div>
            <div className="w-full h-4 bg-gray-300 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <AlertCircle size={24} aria-hidden="true" />
          {t('common.loadError')}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-colors"
          >
            {t('common.retry')}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-xl font-bold text-red-500">{t('detail.notFound')}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-white rounded">{t('common.back')}</button>
      </div>
    );
  }

  const coverUrl = manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || "https://placehold.co/400x600";
  const authorNames = manga.authors.map(a => a.name).join(', ');

  return (
    <div className="min-h-screen bg-background flex flex-col text-left">
      <Navbar />

      {/* Hero Header */}
      <div className="w-full h-64 md:h-80 relative overflow-hidden bg-primary">
        <img
          src={coverUrl}
          alt=""
          className="w-full h-full object-cover opacity-40 blur-sm scale-110"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 text-white hover:text-gray-300 z-10 flex items-center gap-1 font-bold bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm"
        >
          <ChevronLeft size={24} aria-hidden="true" /> {t('common.back')}
        </button>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-32 relative z-10 flex flex-col items-center">
        {/* Cover */}
        <div className="w-48 h-72 rounded-xl overflow-hidden shadow-2xl mb-6 border-4 border-background">
          <img src={coverUrl} alt={manga.title} className="w-full h-full object-cover" />
        </div>

        {/* Title & Info */}
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary text-center mb-2">
          {manga.title}
        </h1>
        <p className="text-gray-600 mb-4 text-center font-medium">
          {t('detail.author')}: {authorNames || t('detail.unknownAuthor')}
        </p>

        {manga.genres.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {manga.genres.map((g) => (
              <span
                key={g.mal_id}
                className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6 mb-8 text-sm font-semibold text-gray-700">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary" aria-hidden="true" />
            {t('detail.views')}: {manga.members.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-primary" aria-hidden="true" />
            {t('detail.favorites')}: {manga.favorites.toLocaleString()}
          </div>
        </div>

        <p className="text-center text-gray-800 leading-relaxed mb-12 max-w-3xl">
          {manga.synopsis || t('detail.synopsisEmpty')}
        </p>

        {/* Chapter list — hanya tampil jika data chapter benar-benar ada.
            Komik Kitsu tidak punya chapter di KomikinAja, jadi tampilkan info jujur. */}
        <div className="w-full flex flex-col gap-3 mb-16">
          <h3 className="font-bold text-xl text-gray-700 flex items-center gap-2">
            <BookOpen size={20} className="text-primary" aria-hidden="true" />
            {t('detail.chapters')}
          </h3>
          <div className="bg-surface/70 border border-primary/10 rounded-xl p-6 flex flex-col gap-1">
            <p className="font-semibold text-primary">{t('detail.noChapters')}</p>
            <p className="text-sm text-gray-600">{t('detail.noChaptersDesc')}</p>
          </div>
        </div>

        {/* Comments — hanya info status, form dan data dummy dihapus */}
        <div className="w-full flex flex-col gap-4 mb-16">
          <h3 className="font-bold text-xl text-gray-700 flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" aria-hidden="true" />
            {t('detail.comments')}
          </h3>
          <div className="bg-surface/70 border border-primary/10 rounded-xl p-6 flex flex-col gap-1">
            <p className="text-sm text-gray-600">{t('detail.commentsSoon')}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
