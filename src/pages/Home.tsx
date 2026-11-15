import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComicCard, ComicSkeleton } from '../components/ComicCard';
import { Button } from '../components/Button';
import { heroBanners } from '../data/dummy';
import { Search, ChevronLeft, ChevronRight, AlertCircle, BookOpen, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchManga, fetchTopManga } from '../services/api';
import { getPersonalizedRecommendations } from '../services/recommend';
import { listHistory, type HistoryEntry } from '../services/history';
import { listPublishedComics, type CreatorComic } from '../services/creatorComics';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { Comic } from '../types/comic';

interface SectionState {
  mangas: Comic[];
  loading: boolean;
  error: boolean;
}

interface HeroSlide {
  id: string;
  title: string;
  description: string;
  cover: string;
  url: string;
  ctaLabel: string;
  isContinue: boolean;
  detailUrl?: string;
}

const emptySection: SectionState = { mangas: [], loading: true, error: false };

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rekomendasi, setRekomendasi] = useState<SectionState>(emptySection);
  const [terakhirUpdate, setTerakhirUpdate] = useState<SectionState>(emptySection);
  const [shounen, setShounen] = useState<SectionState>(emptySection);
  const [fantasi, setFantasi] = useState<SectionState>(emptySection);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [topBanners, setTopBanners] = useState<HeroSlide[]>(() =>
    heroBanners.map((b) => ({
      id: `fallback-${b.id}`,
      title: b.title,
      description: b.description,
      cover: b.cover,
      url: b.url,
      ctaLabel: '',
      isContinue: false,
    })),
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [creatorWorks, setCreatorWorks] = useState<CreatorComic[]>([]);
  const navigate = useNavigate();

  // Gabungkan Dynamic Hero Banner "Lanjutkan Membaca" sebagai slide prioritas utama jika ada riwayat
  const heroSlides = useMemo<HeroSlide[]>(() => {
    const fallbackCta = t('home.heroBtn');
    const secondary = topBanners.map((b) => ({
      ...b,
      ctaLabel: b.ctaLabel || fallbackCta,
    }));

    if (history.length === 0) return secondary;

    const latest = history[0];
    const hasChapter = latest.lastChapterNumber !== null;
    const continueSlide: HeroSlide = {
      id: `continue-${latest.comicId}`,
      title: latest.title,
      description: hasChapter
        ? latest.lastChapterTitle
          ? t('home.resumeComicDescNamed', {
              chapter: latest.lastChapterNumber as number,
              title: latest.lastChapterTitle,
            })
          : t('home.resumeComicDesc', { chapter: latest.lastChapterNumber as number })
        : t('home.resumeViewDesc'),
      cover: latest.cover || secondary[0]?.cover || 'https://placehold.co/400x600',
      url: hasChapter ? `/read/${latest.comicId}/${latest.lastChapterNumber}` : `/comic/${latest.comicId}`,
      ctaLabel: hasChapter
        ? t('home.resumeChapter', { chapter: latest.lastChapterNumber as number })
        : t('home.continueReading'),
      isContinue: true,
      detailUrl: hasChapter ? `/comic/${latest.comicId}` : undefined,
    };

    return [continueSlide, ...secondary];
  }, [history, topBanners, t]);

  const activeBannerIdx = currentBanner < heroSlides.length ? currentBanner : 0;
  const activeSlide = heroSlides[activeBannerIdx];
  const hasContinueBanner = history.length > 0;

  // Auto-slide banner — berhenti di slide 0 jika Continue Reading aktif agar tidak berpindah saat user mau klik (< 5 dtk)
  useEffect(() => {
    if (hasContinueBanner && activeBannerIdx === 0) return;
    const timer = window.setInterval(() => {
      setCurrentBanner((c) => (c >= heroSlides.length - 1 ? 0 : c + 1));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasContinueBanner, activeBannerIdx, heroSlides.length]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev >= heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev <= 0 ? heroSlides.length - 1 : prev - 1));
  };

  // Muat semua data paralel — tidak perlu berurutan.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPersonalizedRecommendations(6),
      fetchTopManga(6),
      fetchManga(1, '', 6),
      fetchManga(1, 'shounen', 6),
      fetchManga(1, 'fantasy', 6),
    ]).then(([rec, bannerTop, update, shounenData, fantasiData]) => {
      if (cancelled) return;

      setRekomendasi({ mangas: rec.data, loading: false, error: rec.error });

      if (bannerTop.data.length >= 3) {
        const dynamicBanners: HeroSlide[] = bannerTop.data.slice(0, 3).map((manga, idx) => ({
          id: `top-${manga.mal_id}`,
          title: manga.title,
          description: manga.synopsis || 'Komik populer yang wajib kamu baca di KomikinAja!',
          cover:
            manga.images?.webp?.large_image_url ||
            manga.images?.webp?.image_url ||
            manga.images?.jpg?.image_url ||
            heroBanners[idx]?.cover,
          url: `/comic/${manga.mal_id}`,
          ctaLabel: '',
          isContinue: false,
        }));
        setTopBanners(dynamicBanners);
      }

      setTerakhirUpdate({ mangas: update.data, loading: false, error: update.error });
      setShounen({ mangas: shounenData.data, loading: false, error: shounenData.error });
      setFantasi({ mangas: fantasiData.data, loading: false, error: fantasiData.error });
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setRekomendasi(emptySection);
    setTerakhirUpdate(emptySection);
    setShounen(emptySection);
    setFantasi(emptySection);
    setReloadKey((k) => k + 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Ambil riwayat baca untuk Dynamic Hero Banner & section "Lanjutkan membaca".
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listHistory(6).then(({ data }) => {
      if (cancelled) return;
      setHistory(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  // Muat karya creator agar berdampingan dengan katalog Kitsu (M4).
  useEffect(() => {
    let cancelled = false;
    listPublishedComics(6).then(({ data }) => {
      if (cancelled) return;
      setCreatorWorks(data);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-10 md:gap-12">
        {/* Dynamic Hero Banner — Prioritas Continue Reading saat ada riwayat */}
        <section
          aria-label={activeSlide?.isContinue ? t('home.continueBadge') : t('nav.recommendation')}
          className="relative w-full rounded-3xl overflow-hidden bg-[var(--color-nav)] text-white p-6 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 min-h-[300px] md:min-h-[400px] border border-white/10 shadow-md"
        >
          <div
            className="w-full md:w-1/2 flex flex-col items-start text-left z-10"
            key={`text-${activeSlide?.id}`}
          >
            {activeSlide?.isContinue && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-300/20 text-amber-200 border border-amber-300/30 text-xs font-bold mb-3">
                <BookOpen size={14} aria-hidden="true" />
                {t('home.continueBadge')}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading mb-3 leading-tight drop-shadow-md text-white line-clamp-2">
              {activeSlide?.title}
            </h1>
            <p className="text-gray-200 text-sm md:text-base mb-6 max-w-md line-clamp-2 md:line-clamp-3 drop-shadow">
              {activeSlide?.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={activeSlide?.url || '#'}
                className="inline-flex items-center justify-center gap-2 min-h-12 bg-[#F4EFE6] text-[#1F2544] px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors shadow-sm text-sm md:text-base"
              >
                {activeSlide?.isContinue && <Play size={16} className="fill-current" aria-hidden="true" />}
                {activeSlide?.ctaLabel}
              </Link>
              {activeSlide?.detailUrl && (
                <Link
                  to={activeSlide.detailUrl}
                  className="inline-flex items-center justify-center min-h-12 px-4 py-3 rounded-lg font-semibold text-sm text-[#F4EFE6] border border-white/30 hover:bg-white/10 transition-colors"
                >
                  {t('home.viewDetail')}
                </Link>
              )}
            </div>
          </div>

          {/* Hero Carousel Display */}
          <div className="w-full md:w-1/2 flex items-center justify-center gap-3 md:gap-4 z-10 pb-4 md:pb-0">
            <button
              type="button"
              onClick={prevBanner}
              aria-label="Banner sebelumnya"
              className="p-2.5 min-w-11 min-h-11 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors bg-black/25 backdrop-blur-sm text-white cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <Link
              to={activeSlide?.url || '#'}
              className="relative w-40 h-56 sm:w-52 sm:h-76 md:w-60 md:h-88 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/15"
              key={`img-${activeSlide?.id}`}
            >
              <img
                src={activeSlide?.cover}
                alt={activeSlide?.title || 'Hero Cover'}
                className="w-full h-full object-cover"
              />
            </Link>
            <button
              type="button"
              onClick={nextBanner}
              aria-label="Banner berikutnya"
              className="p-2.5 min-w-11 min-h-11 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors bg-black/25 backdrop-blur-sm text-white cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroSlides.map((slide, idx) => (
              <button
                type="button"
                key={slide.id}
                onClick={() => setCurrentBanner(idx)}
                aria-label={`Ke banner ${idx + 1}`}
                aria-current={activeBannerIdx === idx}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  activeBannerIdx === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Decorative background blur */}
          <div
            className="absolute top-0 right-0 w-full md:w-2/3 h-full opacity-35 blur-3xl scale-150 pointer-events-none transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${activeSlide?.cover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </section>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={20} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-[var(--color-line)] bg-surface text-ink placeholder:text-ink-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </form>

        {/* Lanjutkan membaca — langsung menuju chapter terakhir jika tersedia */}
        {history.length > 0 && (
          <div className="flex flex-col gap-4 text-left">
            <h2 className="text-2xl font-bold font-heading text-ink">{t('home.continueReading')}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {history.map((h) => {
                const targetUrl =
                  h.lastChapterNumber !== null
                    ? `/read/${h.comicId}/${h.lastChapterNumber}`
                    : `/comic/${h.comicId}`;
                return (
                  <Link key={h.comicId} to={targetUrl} className="w-32 sm:w-36 shrink-0">
                    <ComicCard
                      title={h.title}
                      cover={h.cover || 'https://placehold.co/400x600'}
                      episode={
                        h.lastChapterNumber !== null
                          ? t('home.resumeChapter', { chapter: h.lastChapterNumber })
                          : undefined
                      }
                      badge={
                        h.lastChapterNumber !== null
                          ? t('home.chapterShort', { chapter: h.lastChapterNumber })
                          : undefined
                      }
                      hideStats
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Karya Kreator — karya author berdampingan dengan katalog Kitsu (M4) */}
        {creatorWorks.length > 0 && (
          <div className="flex flex-col gap-4 text-left">
            <h2 className="text-2xl font-bold font-heading text-ink">{t('home.creatorWorks')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {creatorWorks.map((c) => (
                <Link key={c.id} to={`/comic/${c.id}`}>
                  <ComicCard
                    title={c.title}
                    cover={c.coverUrl || 'https://placehold.co/400x600'}
                    badge={t('detail.creatorBadge')}
                    hideStats
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        <Section title={t('home.recommendation')} section={rekomendasi} onRetry={handleRetry} />
        <Section title={t('home.latestUpdate')} section={terakhirUpdate} onRetry={handleRetry} />
        <Section title={t('home.shounen')} section={shounen} onRetry={handleRetry} />
        <Section title={t('home.fantasy')} section={fantasi} onRetry={handleRetry} />

        <div className="flex justify-center mt-4">
          <Link to="/category" className="text-ink font-bold hover:underline flex items-center gap-1">
            {t('home.viewMore')}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Sub-component for sections
const Section: React.FC<{
  title: string;
  section: SectionState;
  onRetry: () => void;
}> = ({ title, section, onRetry }) => {
  const { t } = useLanguage();
  const { mangas, loading, error } = section;

  return (
    <div className="flex flex-col gap-6 text-left min-h-50">
      <h2 className="text-2xl font-bold font-heading text-ink">{title}</h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ComicSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 bg-surface/60 border border-[var(--color-line)] rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-500 font-semibold">
            <AlertCircle size={20} aria-hidden="true" />
            {t('common.loadError')}
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </div>
      ) : mangas.length === 0 ? (
        <p className="text-ink-muted text-sm">{t('common.empty')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mangas.map((manga) => (
            <Link to={`/comic/${manga.mal_id}`} key={manga.mal_id}>
              <ComicCard
                title={manga.title}
                cover={manga.images?.webp?.image_url || manga.images?.jpg?.image_url || ''}
                episode={manga.chapters ? `Chapters: ${manga.chapters}` : 'Ongoing'}
                likes={(manga.score || 0).toString()}
                views={(manga.members || 0).toLocaleString()}
                isNew={manga.status === 'Publishing'}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
