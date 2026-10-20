import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  isKitsuId,
  getCreatorComic,
  getChapterPages,
  type CreatorComic,
  type CreatorChapter,
} from '../services/creatorComics';

const NIGHT_KEY = 'komikinaja_night';
const getInitialNight = (): boolean =>
  typeof window !== 'undefined' && window.localStorage.getItem(NIGHT_KEY) === '1';

const posKey = (comicId: string, ep: string) => `komikinaja_pos_${comicId}_${ep}`;

export const ReadingMode: React.FC = () => {
  const { id, episode } = useParams<{ id: string; episode: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isCreator = id ? !isKitsuId(id) : false;

  // Data
  const [mangaTitle, setMangaTitle] = useState('');
  const [comic, setComic] = useState<CreatorComic | null>(null);
  const [chapters, setChapters] = useState<CreatorChapter[]>([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Fitur P4
  const [zoom, setZoom] = useState(100);
  const [night, setNight] = useState<boolean>(getInitialNight);
  const restoredRef = React.useRef(false);

  // Muat konten sesuai sumber.
  useEffect(() => {
    if (!id || !episode) return;
    let cancelled = false;
    const cid = id;
    const ep = episode;

    const load = async (): Promise<boolean> => {
      if (isKitsuId(cid)) {
        const { data } = await fetchMangaDetail(cid);
        if (cancelled) return false;
        setMangaTitle(data?.title ?? '');
        return true;
      }
      const chapterNumber = Number(ep);
      if (!Number.isFinite(chapterNumber)) return false;
      const { data, chapters: ch } = await getCreatorComic(cid);
      if (cancelled) return false;
      if (!data) return false;
      const current = ch.find((c) => c.number === chapterNumber);
      if (!current) return false;
      setComic(data);
      setChapters(ch);
      setChapterTitle(current.title ?? '');
      const { data: pageUrls, error } = await getChapterPages(current.id);
      if (cancelled) return false;
      if (error) return false;
      setPages(pageUrls);
      return true;
    };

    load().then((ok) => {
      if (cancelled) return;
      if (!ok) setLoadError(true);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id, episode]);

  // Ingat posisi: pulihkan scroll saat konten siap (sekali saja).
  useEffect(() => {
    if (loading || loadError || !isCreator) return;
    if (restoredRef.current) return;
    if (!id || !episode) return;
    restoredRef.current = true;
    const saved = Number(window.localStorage.getItem(posKey(id, episode)) ?? '0');
    if (saved > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'auto' }));
    }
  }, [loading, loadError, isCreator, id, episode]);

  // Ingat posisi: simpan saat scroll (dienkangi) dan saat meninggalkan halaman.
  useEffect(() => {
    if (!isCreator || !id || !episode) return;
    const key = posKey(id, episode);
    let timeout: number | undefined;
    const save = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        window.localStorage.setItem(key, String(window.scrollY));
      }, 200);
    };
    const saveNow = () => window.localStorage.setItem(key, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('beforeunload', saveNow);
    return () => {
      window.removeEventListener('scroll', save);
      window.removeEventListener('beforeunload', saveNow);
      window.localStorage.setItem(key, String(window.scrollY));
    };
  }, [isCreator, id, episode]);

  // Persistensi mode malam.
  useEffect(() => {
    window.localStorage.setItem(NIGHT_KEY, night ? '1' : '0');
  }, [night]);

  const currentNumber = Number(episode);
  const chapterIndex = chapters.findIndex((c) => c.number === currentNumber);
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  const displayTitle = isCreator ? (comic?.title ?? '') : mangaTitle;
  const chapterLabel = chapterTitle
    ? `${t('read.chapterLabel')} ${episode} — ${chapterTitle}`
    : `${t('read.chapterLabel')} ${episode}`;

  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const zoomIn = () => setZoom((z) => Math.min(200, z + 25));

  return (
    <div
      className={`min-h-screen flex flex-col relative ${night ? 'bg-gray-900' : 'bg-background'}`}
    >
      {/* Topbar */}
      <div className="sticky top-0 w-full bg-primary p-4 flex items-center justify-between gap-2 z-50">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="flex flex-col items-center min-w-0 text-white">
          <span className="text-sm font-bold truncate max-w-40 sm:max-w-md">
            {loading ? t('common.loading') : (displayTitle || t('detail.notFound'))}
          </span>
          {isCreator && !loading && (
            <span className="text-xs text-gray-200 truncate max-w-40 sm:max-w-md">{chapterLabel}</span>
          )}
        </div>

        {/* Kontrol baca (P4) — hanya untuk karya creator yang bisa dibaca */}
        <div className="flex items-center gap-1 shrink-0">
          {isCreator && (
            <>
              <button
                onClick={zoomOut}
                aria-label={t('read.zoomOut')}
                title={t('read.zoomOut')}
                className="p-2 rounded hover:bg-white/15 transition-colors"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-xs font-bold w-10 text-center text-white">{zoom}%</span>
              <button
                onClick={zoomIn}
                aria-label={t('read.zoomIn')}
                title={t('read.zoomIn')}
                className="p-2 rounded hover:bg-white/15 transition-colors"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => setNight((n) => !n)}
                aria-label={night ? t('read.day') : t('read.night')}
                aria-pressed={night}
                title={night ? t('read.day') : t('read.night')}
                className="p-2 rounded hover:bg-white/15 transition-colors"
              >
                {night ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Konten */}
      {loading ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center p-6 gap-3">
          <div className="w-72 h-96 bg-gray-300/40 rounded-xl animate-pulse"></div>
          <p className="text-sm text-gray-400">{t('common.loading')}</p>
        </main>
      ) : loadError ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center p-6">
          <div className="max-w-xl w-full bg-surface rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold font-heading text-primary">{t('detail.notFound')}</h1>
            <button
              onClick={() => navigate(`/comic/${id}`)}
              className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-colors"
            >
              {t('read.backToDetail')}
            </button>
          </div>
        </main>
      ) : !isCreator ? (
        /* Katalog Kitsu — tidak menyediakan halaman komik (jujur) */
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
      ) : (
        /* Karya creator — tampilkan halaman nyata */
        <main className={`flex-1 w-full ${night ? '' : ''}`}>
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
              <BookOpen size={28} className={night ? 'text-gray-300' : 'text-primary'} aria-hidden="true" />
              <h2 className={`text-lg font-bold ${night ? 'text-gray-100' : 'text-primary'}`}>{t('read.noPages')}</h2>
              <p className={`text-sm ${night ? 'text-gray-400' : 'text-gray-600'}`}>{t('read.noPagesDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ width: `${zoom}%` }} className="mx-auto flex flex-col">
                {pages.map((url, i) => (
                  <img
                    key={`${url}-${i}`}
                    src={url}
                    alt={`${t('read.chapterLabel')} ${episode} — ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    className="w-full h-auto select-none"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Navigasi chapter (prev/next) */}
          <nav className="w-full max-w-3xl mx-auto px-4 py-8 flex items-center justify-between gap-4">
            {prevChapter ? (
              <button
                onClick={() => navigate(`/read/${id}/${prevChapter.number}`)}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <ChevronLeft size={18} aria-hidden="true" /> {t('read.prevChapter')}
              </button>
            ) : (
              <span />
            )}
            <span className={`text-sm font-semibold ${night ? 'text-gray-300' : 'text-gray-500'}`}>
              {chapterIndex >= 0 ? `${chapterIndex + 1} / ${chapters.length}` : ''}
            </span>
            {nextChapter ? (
              <button
                onClick={() => navigate(`/read/${id}/${nextChapter.number}`)}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {t('read.nextChapter')} <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <span />
            )}
          </nav>
        </main>
      )}
    </div>
  );
};
