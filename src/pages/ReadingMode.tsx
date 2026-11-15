import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Lock,
  Coins,
  SlidersHorizontal,
  X,
  Clock,
} from 'lucide-react';
import { fetchMangaDetail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme, type DarkIntensity, type ThemeMode } from '../context/ThemeContext';
import {
  isKitsuId,
  getCreatorComic,
  getChapterPages,
  type CreatorComic,
  type CreatorChapter,
} from '../services/creatorComics';
import { recordChapterView } from '../services/analytics';
import { recordChapterRead } from '../services/history';
import { isChapterUnlocked, unlockChapter, getCoinBalance } from '../services/wallet';
import { Button } from '../components/Button';

const posKey = (comicId: string, ep: string) => `komikinaja_pos_${comicId}_${ep}`;

export const ReadingMode: React.FC = () => {
  const { id, episode } = useParams<{ id: string; episode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode, darkIntensity, resolvedTheme, setMode, setDarkIntensity } = useTheme();
  const isCreator = id ? !isKitsuId(id) : false;
  const isDark = resolvedTheme === 'dark';

  // Data
  const [mangaTitle, setMangaTitle] = useState('');
  const [comic, setComic] = useState<CreatorComic | null>(null);
  const [chapters, setChapters] = useState<CreatorChapter[]>([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Status chapter premium & lock
  const [isLocked, setIsLocked] = useState(false);
  const [lockedChapter, setLockedChapter] = useState<CreatorChapter | null>(null);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // Pengaturan baca, bottom sheet, & auto-dimming (> 3 detik di mode gelap)
  const [zoom, setZoom] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
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

      const isOwner = user?.id === data.authorId;
      if (current.isPremium && !isOwner) {
        const unlocked = await isChapterUnlocked(user?.id || '', current.id);
        if (!unlocked) {
          setIsLocked(true);
          setLockedChapter(current);
          if (user?.id) {
            const bal = await getCoinBalance(user.id);
            if (!cancelled) setUserCoins(bal);
          }
          return true;
        }
      }

      setIsLocked(false);
      setLockedChapter(null);
      await recordChapterView(cid, current.id);
      await recordChapterRead({
        comicId: cid,
        title: data.title,
        cover: data.coverUrl,
        chapterId: current.id,
        chapterNumber: current.number,
        chapterTitle: current.title,
      });
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

    return () => {
      cancelled = true;
    };
  }, [id, episode, user?.id]);

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

  // Ingat posisi: simpan saat scroll (debounce) dan saat meninggalkan halaman.
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

  // Auto-dimming tombol melayang bila tidak disentuh > 3 detik di mode gelap
  useEffect(() => {
    if (!isDark) return;
    let dimTimer = window.setTimeout(() => setIsIdle(true), 3000);

    const wake = () => {
      setIsIdle(false);
      window.clearTimeout(dimTimer);
      dimTimer = window.setTimeout(() => setIsIdle(true), 3000);
    };

    window.addEventListener('pointerdown', wake, { passive: true });
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('touchstart', wake, { passive: true });
    window.addEventListener('keydown', wake);
    window.addEventListener('scroll', wake, { passive: true });

    return () => {
      window.clearTimeout(dimTimer);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('touchstart', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('scroll', wake);
    };
  }, [isDark]);

  // Tutup bottom sheet dengan tombol Escape
  useEffect(() => {
    if (!showSettings) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSettings]);

  const controlsDimmed = isDark && isIdle && !showSettings;

  const currentNumber = Number(episode);
  const chapterIndex = chapters.findIndex((c) => c.number === currentNumber);
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  const displayTitle = isCreator ? (comic?.title ?? '') : mangaTitle;
  const chapterLabel = chapterTitle
    ? `${t('read.chapterLabel')} ${episode} — ${chapterTitle}`
    : `${t('read.chapterLabel')} ${episode}`;

  const handleGoToChapter = (chapterNum: number) => {
    setLoading(true);
    restoredRef.current = false;
    navigate(`/read/${id}/${chapterNum}`);
  };

  const handleUnlock = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!lockedChapter || !comic) return;
    setUnlocking(true);
    setUnlockError('');
    const price = lockedChapter.priceCoins || 10;
    const res = await unlockChapter(
      user.id,
      comic.id,
      comic.title,
      lockedChapter.id,
      lockedChapter.number,
      price,
      comic.authorId,
    );
    setUnlocking(false);
    if (res.success) {
      setIsLocked(false);
      setUserCoins(res.newBalance);
      await recordChapterView(comic.id, lockedChapter.id);
      await recordChapterRead({
        comicId: comic.id,
        title: comic.title,
        cover: comic.coverUrl,
        chapterId: lockedChapter.id,
        chapterNumber: lockedChapter.number,
        chapterTitle: lockedChapter.title,
      });
      const { data: pageUrls } = await getChapterPages(lockedChapter.id);
      if (pageUrls) setPages(pageUrls);
    } else {
      setUnlockError(res.error || 'Gagal membuka chapter.');
    }
  };

  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const zoomIn = () => setZoom((z) => Math.min(200, z + 25));

  const pageBackgroundClass = isDark
    ? darkIntensity === 'amoled'
      ? 'bg-black'
      : 'bg-[#14161D]'
    : 'bg-background';

  const floatingBtnClass = isDark
    ? 'bg-[#1E222D]/95 text-[#F3F0EA] border-white/25 hover:bg-[#2A3040]'
    : 'bg-[#1F2544]/92 text-white border-[#1F2544] hover:bg-[#161A30]';

  return (
    <div className={`min-h-screen flex flex-col relative ${pageBackgroundClass}`}>
      {/* Topbar — selaras dengan tinggi & tipografi Navbar */}
      <header className="sticky top-0 w-full bg-[var(--color-nav)] px-4 md:px-8 py-3.5 min-h-14 flex items-center justify-between gap-2 z-50 border-b border-white/10 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-[#F4EFE6] hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center min-w-0 text-white">
          <span className="text-sm font-bold font-heading truncate max-w-44 sm:max-w-md">
            {loading ? t('common.loading') : displayTitle || t('detail.notFound')}
          </span>
          {isCreator && !loading && (
            <span className="text-xs text-gray-300 truncate max-w-44 sm:max-w-md">
              {chapterLabel}
            </span>
          )}
        </div>

        {/* Kontrol baca & tombol buka Bottom Sheet Pengaturan */}
        <div className="flex items-center gap-1.5 shrink-0 text-[#F4EFE6]">
          {isCreator && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                aria-label={t('read.zoomOut')}
                title={t('read.zoomOut')}
                className="min-w-10 min-h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-bold w-10 text-center text-white">{zoom}%</span>
              <button
                type="button"
                onClick={zoomIn}
                aria-label={t('read.zoomIn')}
                title={t('read.zoomIn')}
                className="min-w-10 min-h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label={t('read.settings')}
            aria-expanded={showSettings}
            title={t('read.settings')}
            className="min-w-11 min-h-11 px-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer text-xs font-semibold"
          >
            {isDark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            <SlidersHorizontal size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Konten */}
      {loading ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center p-6 gap-3">
          <div className="w-72 h-96 bg-surface rounded-xl animate-pulse" />
          <p className="text-sm text-ink-muted">{t('common.loading')}</p>
        </main>
      ) : isLocked && lockedChapter ? (
        /* Chapter Premium Terkunci */
        <main className="flex-1 w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-[var(--color-line)] rounded-xl p-8 flex flex-col items-center gap-5 text-center shadow-lg">
            <div className="w-14 h-14 rounded-xl bg-ink/10 flex items-center justify-center text-ink border border-[var(--color-line)]">
              <Lock size={26} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-1 items-center">
              <span className="text-[11px] font-semibold text-ink-muted bg-ink/10 px-2.5 py-0.5 rounded-md">
                Simulasi • Sandbox
              </span>
              <h1 className="text-2xl font-bold font-heading text-ink mt-1">
                Chapter Khusus Koin
              </h1>
              <p className="text-xs text-ink-muted">
                {comic?.title} — Chapter {lockedChapter.number}
              </p>
            </div>

            <div className="w-full bg-background/80 border border-[var(--color-line)] rounded-lg p-3.5 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 font-medium text-ink-muted">
                <Coins size={15} className="text-ink-muted" aria-hidden="true" />
                <span>Harga Chapter:</span>
              </div>
              <span className="font-heading font-bold text-base text-ink">
                {lockedChapter.priceCoins || 10} Koin
              </span>
            </div>

            <div className="w-full flex justify-between items-center text-xs text-ink-muted px-1">
              <span>Saldo Koin Anda:</span>
              <span className="font-bold text-ink text-sm flex items-center gap-1">
                <Coins size={13} className="text-ink-muted" />
                {userCoins} Koin
              </span>
            </div>

            {unlockError && (
              <p role="alert" className="text-red-500 text-xs w-full bg-red-500/10 p-2.5 rounded-md border border-red-500/30 font-medium">
                {unlockError}
              </p>
            )}

            <div className="w-full flex flex-col gap-2.5 mt-2">
              {userCoins >= (lockedChapter.priceCoins || 10) ? (
                <Button onClick={handleUnlock} disabled={unlocking} fullWidth>
                  <Lock size={15} aria-hidden="true" />
                  {unlocking ? 'Membuka...' : `Buka Chapter (${lockedChapter.priceCoins || 10} Koin)`}
                </Button>
              ) : (
                <Link
                  to="/wallet"
                  className="w-full min-h-11 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <Coins size={15} aria-hidden="true" />
                  Isi Saldo di Dompet Demo
                </Link>
              )}

              <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/comic/${id}`)}>
                Kembali ke Info Komik
              </Button>
            </div>
          </div>
        </main>
      ) : loadError ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center p-6">
          <div className="max-w-xl w-full bg-surface rounded-xl border border-[var(--color-line)] p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-xl bg-red-500/15 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-500" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold font-heading text-ink">{t('detail.notFound')}</h1>
            <Button onClick={() => navigate(`/comic/${id}`)}>{t('read.backToDetail')}</Button>
          </div>
        </main>
      ) : !isCreator ? (
        /* Katalog Kitsu — tidak menyediakan halaman komik (jujur) */
        <main className="flex-1 w-full flex flex-col items-center justify-center p-6">
          <div className="max-w-xl w-full bg-[var(--color-nav)] rounded-xl border border-white/15 p-8 flex flex-col items-center gap-4 text-center shadow-lg">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen size={28} className="text-white" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold font-heading text-white">{t('read.notAvailableTitle')}</h1>
            <p className="text-gray-300 text-sm leading-relaxed">{t('read.notAvailableDesc')}</p>
            <button
              type="button"
              onClick={() => navigate(`/comic/${id}`)}
              className="mt-2 min-h-11 px-6 py-2.5 bg-[#F4EFE6] text-[#1F2544] font-semibold rounded-lg hover:bg-white transition-colors flex items-center gap-2 cursor-pointer text-sm"
            >
              <AlertCircle size={16} aria-hidden="true" />
              {t('read.backToDetail')}
            </button>
          </div>
        </main>
      ) : (
        /* Karya creator — tampilkan halaman nyata + navigasi Thumb-Zone */
        <main className="flex-1 w-full pb-24">
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
              <BookOpen size={28} className="text-ink" aria-hidden="true" />
              <h2 className="text-lg font-bold font-heading text-ink">{t('read.noPages')}</h2>
              <p className="text-sm text-ink-muted">{t('read.noPagesDesc')}</p>
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

          {/* Navigasi chapter di bawah konten (kontras aman WCAG AA di Light/Dark/AMOLED) */}
          <nav
            aria-label={t('detail.chapters')}
            className="w-full max-w-3xl mx-auto px-4 py-8 flex items-center justify-between gap-4"
          >
            {prevChapter ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleGoToChapter(prevChapter.number)}
                className="min-h-12"
              >
                <ChevronLeft size={18} aria-hidden="true" /> {t('read.prevChapter')}
              </Button>
            ) : (
              <span />
            )}
            <span className="text-sm font-semibold text-ink-muted">
              {chapterIndex >= 0 ? `${chapterIndex + 1} / ${chapters.length}` : ''}
            </span>
            {nextChapter ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleGoToChapter(nextChapter.number)}
                className="min-h-12"
              >
                {t('read.nextChapter')} <ChevronRight size={18} aria-hidden="true" />
              </Button>
            ) : (
              <span />
            )}
          </nav>

          {/* Curved Ergonomic Thumb-Zone Floating Buttons (>= 48x48 px, auto-dimming > 3s saat gelap) */}
          {prevChapter && (
            <button
              type="button"
              onClick={() => handleGoToChapter(prevChapter.number)}
              onFocus={() => setIsIdle(false)}
              aria-label={`${t('read.prevChapter')} (${t('read.prevShort', { chapter: prevChapter.number })})`}
              className={`fixed left-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 min-w-12 min-h-12 px-4 py-3 rounded-r-full rounded-l-2xl border backdrop-blur-md shadow-xl flex items-center gap-1.5 text-sm font-bold cursor-pointer transition-all duration-500 ${floatingBtnClass} ${
                controlsDimmed ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <ChevronLeft size={20} aria-hidden="true" />
              <span>{t('read.prevShort', { chapter: prevChapter.number })}</span>
            </button>
          )}

          {nextChapter && (
            <button
              type="button"
              onClick={() => handleGoToChapter(nextChapter.number)}
              onFocus={() => setIsIdle(false)}
              aria-label={`${t('read.nextChapter')} (${t('read.nextShort', { chapter: nextChapter.number })})`}
              className={`fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 min-w-12 min-h-12 px-4 py-3 rounded-l-full rounded-r-2xl border backdrop-blur-md shadow-xl flex items-center gap-1.5 text-sm font-bold cursor-pointer transition-all duration-500 ${floatingBtnClass} ${
                controlsDimmed ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <span>{t('read.nextShort', { chapter: nextChapter.number })}</span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          )}
        </main>
      )}

      {/* Bottom Sheet Kustomisasi Mode Baca (Auto Dark Mode, Dark Gray vs AMOLED Black, Zoom) */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setShowSettings(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('read.settings')}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl bg-surface border-t border-x border-[var(--color-line)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl flex flex-col gap-5 text-left"
          >
            <div className="w-12 h-1.5 rounded-full bg-ink/25 mx-auto -mt-2" aria-hidden="true" />

            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
                <SlidersHorizontal size={18} aria-hidden="true" />
                {t('read.settings')}
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label={t('read.closeSettings')}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-ink/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pilihan Mode Tema */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t('read.themeSection')}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'auto', label: t('theme.auto'), icon: Clock },
                    { key: 'light', label: t('theme.light'), icon: Sun },
                    { key: 'dark', label: t('theme.dark'), icon: Moon },
                  ] as { key: ThemeMode; label: string; icon: React.ComponentType<{ size?: number }> }[]
                ).map(({ key, label, icon: Icon }) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      aria-pressed={active}
                      className={`min-h-12 px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                        active
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-background text-ink border-[var(--color-line)] hover:border-ink/40'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="truncate max-w-full">{label}</span>
                    </button>
                  );
                })}
              </div>
              {mode === 'auto' && (
                <p className="text-xs text-ink-muted">{t('theme.autoDesc')}</p>
              )}
            </div>

            {/* Pilihan Intensitas Gelap: Dark Gray vs AMOLED Black */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                {t('read.surfaceSection')}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { key: 'gray', label: t('theme.darkGray'), swatch: 'bg-[#14161D]' },
                    { key: 'amoled', label: t('theme.amoled'), swatch: 'bg-black' },
                  ] as { key: DarkIntensity; label: string; swatch: string }[]
                ).map((item) => {
                  const active = darkIntensity === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDarkIntensity(item.key)}
                      aria-pressed={active}
                      className={`min-h-12 px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                        active
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-background text-ink border-[var(--color-line)] hover:border-ink/40'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border border-white/40 shrink-0 ${item.swatch}`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom Halaman (untuk karya kreator) */}
            {isCreator && (
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line)]">
                <span className="text-sm font-bold text-ink">{t('read.zoomLabel')}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={zoomOut} aria-label={t('read.zoomOut')}>
                    <ZoomOut size={16} />
                  </Button>
                  <span className="text-sm font-bold text-ink w-12 text-center">{zoom}%</span>
                  <Button variant="outline" size="sm" onClick={zoomIn} aria-label={t('read.zoomIn')}>
                    <ZoomIn size={16} />
                  </Button>
                </div>
              </div>
            )}

            {isDark && (
              <p className="text-xs text-ink-muted bg-background/70 rounded-lg px-3 py-2 border border-[var(--color-line)]">
                {t('read.dimHint')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
