import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import { ChevronLeft, AlertCircle, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Comic } from '../types/comic';

export const ReadingMode: React.FC = () => {
  const { id } = useParams<{ id: string, episode: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [manga, setManga] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchMangaDetail(id).then(({ data }) => {
      if (cancelled) return;
      setManga(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="min-h-screen bg-primary-hover text-background flex flex-col relative">
      {/* Topbar */}
      <div className="sticky top-0 w-full bg-primary p-4 flex items-center justify-between z-50">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="hover:text-white transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold truncate max-w-50 sm:max-w-sm">
            {loading ? t('common.loading') : (manga?.title || t('detail.notFound'))}
          </span>
        </div>
        {/* Menu button dihapus karena belum memiliki fungsi */}
      </div>

      {/* Konten baca — Kitsu tidak menyediakan halaman komik, jadi tampilkan status jujur */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full bg-primary rounded-2xl border border-white/10 p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <BookOpen size={28} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold font-heading">{t('read.notAvailableTitle')}</h1>
          <p className="text-gray-300 text-sm leading-relaxed">{t('read.notAvailableDesc')}</p>
          <button
            onClick={() => navigate(`/comic/${id}`)}
            className="mt-2 px-6 py-3 bg-surface text-primary font-bold rounded-full hover:bg-white transition-colors flex items-center gap-2"
          >
            <AlertCircle size={18} aria-hidden="true" />
            {t('read.backToDetail')}
          </button>
        </div>
      </main>
    </div>
  );
};
