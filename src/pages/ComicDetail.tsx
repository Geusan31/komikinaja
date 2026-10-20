import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import { ChevronLeft, Eye, Bookmark, BookOpen, AlertCircle, Heart, UserPlus } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { isFavorite, addFavorite, removeFavorite } from '../services/favorites';
import { isFollowing, followAuthor, unfollowAuthor, followerCount } from '../services/followers';
import { recordView } from '../services/history';
import { isKitsuId, getCreatorComic, type CreatorComic, type CreatorChapter } from '../services/creatorComics';
import { CommentSection } from '../components/CommentSection';
import type { Comic } from '../types/comic';

export const ComicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isCreator = id ? !isKitsuId(id) : false;

  const [manga, setManga] = useState<Comic | null>(null);
  const [creator, setCreator] = useState<CreatorComic | null>(null);
  const [chapters, setChapters] = useState<CreatorChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState('');

  // Mengikuti author (A2) — hanya untuk karya creator.
  const [isFollow, setIsFollow] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState('');
  const [followerTotal, setFollowerTotal] = useState<number | null>(null);

  // Muat data sesuai sumber: katalog Kitsu (numerik) atau karya creator (UUID).
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    if (isKitsuId(id)) {
      fetchMangaDetail(id).then(({ data, error: hasError }) => {
        if (cancelled) return;
        setManga(data);
        setError(hasError);
        setLoading(false);
      });
    } else {
      getCreatorComic(id).then(({ data, chapters: ch, error: hasError }) => {
        if (cancelled) return;
        setCreator(data);
        setChapters(ch);
        setError(hasError);
        setLoading(false);
      });
    }
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  // Nilai tampil terpadu untuk kedua sumber.
  const comicId = id ?? '';
  const title = isCreator ? (creator?.title ?? '') : (manga?.title ?? '');
  const realCover = isCreator
    ? (creator?.coverUrl || null)
    : (manga?.images?.webp?.large_image_url || manga?.images?.jpg?.large_image_url || null);
  const coverUrl = realCover || 'https://placehold.co/400x600';
  const synopsis = isCreator ? (creator?.description ?? '') : (manga?.synopsis ?? '');
  const authorLabel = isCreator ? (creator?.authorName ?? '') : (manga?.authors.map((a) => a.name).join(', ') ?? '');
  const genreList = isCreator
    ? (creator?.genres ?? []).map((name, i) => ({ key: `g-${i}`, name }))
    : (manga?.genres ?? []).map((g) => ({ key: String(g.mal_id), name: g.name }));
  const hasData = isCreator ? creator !== null : manga !== null;

  // Cek status favorit komik ini untuk pengguna yang login.
  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    isFavorite(id).then((fav) => {
      if (cancelled) setIsFav(fav);
    });
    return () => { cancelled = true; };
  }, [id, user]);

  // Muat status ikut & jumlah follower untuk karya creator (A2).
  useEffect(() => {
    if (!isCreator || !creator?.authorId) return;
    let cancelled = false;
    const authorId = creator.authorId;
    followerCount(authorId).then((n) => {
      if (!cancelled) setFollowerTotal(n);
    });
    if (user) {
      isFollowing(authorId).then((f) => {
        if (!cancelled) setIsFollow(f);
      });
    }
    return () => { cancelled = true; };
  }, [isCreator, creator?.authorId, user]);

  // Catat riwayat baca (tanpa setState lokal — hanya memicu tulis ke Supabase).
  useEffect(() => {
    if (!user || !comicId || !title) return;
    recordView({ comicId, title, cover: realCover });
  }, [comicId, title, realCover, user]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const handleToggleFavorite = async () => {
    if (!user || !comicId || !title) return;
    setFavBusy(true);
    setFavError('');
    if (isFav) {
      const { error: removeError } = await removeFavorite(comicId);
      if (removeError) setFavError(removeError);
      else setIsFav(false);
    } else {
      const { error: addError } = await addFavorite({ comicId, title, cover: realCover });
      if (addError) setFavError(addError);
      else setIsFav(true);
    }
    setFavBusy(false);
  };

  const handleToggleFollow = async () => {
    if (!user || !creator?.authorId) return;
    setFollowBusy(true);
    setFollowError('');
    if (isFollow) {
      const { error: unfollowErr } = await unfollowAuthor(creator.authorId);
      if (unfollowErr) setFollowError(unfollowErr);
      else {
        setIsFollow(false);
        setFollowerTotal((n) => (n === null ? n : Math.max(0, n - 1)));
      }
    } else {
      const { error: followErr } = await followAuthor(creator.authorId);
      if (followErr) setFollowError(followErr);
      else {
        setIsFollow(true);
        setFollowerTotal((n) => (n === null ? n : n + 1));
      }
    }
    setFollowBusy(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-left">
        <Navbar />
        <div className="w-full h-64 md:h-80 bg-gray-300 animate-pulse"></div>
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-32 relative z-10 flex flex-col items-center animate-pulse">
          <div className="w-48 h-72 rounded-xl bg-gray-400 mb-6 border-4 border-background"></div>
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

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-xl font-bold text-red-500">{t('detail.notFound')}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-white rounded">{t('common.back')}</button>
      </div>
    );
  }

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
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Penanda karya creator agar tidak tertukar dengan katalog Kitsu */}
        {isCreator && (
          <span className="mb-3 px-3 py-1 bg-surface text-primary text-xs font-bold rounded-full border border-primary/20">
            {t('detail.creatorBadge')}
          </span>
        )}

        {/* Title & Info */}
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary text-center mb-2">
          {title}
        </h1>
        <p className="text-gray-600 mb-4 text-center font-medium">
          {isCreator ? t('detail.creatorBy') : t('detail.author')}: {authorLabel || t('detail.unknownAuthor')}
        </p>

        {genreList.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {genreList.map((g) => (
              <span
                key={g.key}
                className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* Statistik — jujur per sumber */}
        <div className="flex items-center gap-6 mb-6 text-sm font-semibold text-gray-700">
          {isCreator ? (
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary" aria-hidden="true" />
              {t('detail.chapters')}: {chapters.length}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-primary" aria-hidden="true" />
                {t('detail.views')}: {manga?.members.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-primary" aria-hidden="true" />
                {t('detail.favorites')}: {manga?.favorites.toLocaleString()}
              </div>
            </>
          )}
        </div>

        {user && (
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favBusy}
                aria-pressed={isFav}
                className={`px-6 py-2 rounded-full font-bold border-2 transition-colors flex items-center gap-2 disabled:opacity-60 ${
                  isFav
                    ? 'bg-primary text-white border-primary'
                    : 'bg-transparent text-primary border-primary hover:bg-primary hover:text-white'
                }`}
              >
                <Heart size={18} className={isFav ? 'fill-white' : ''} aria-hidden="true" />
                {isFav ? t('detail.removeFavorite') : t('detail.addFavorite')}
              </button>

              {isCreator && creator && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  aria-pressed={isFollow}
                  className={`px-6 py-2 rounded-full font-bold border-2 transition-colors flex items-center gap-2 disabled:opacity-60 ${
                    isFollow
                      ? 'bg-surface text-primary border-primary/40'
                      : 'bg-primary text-white border-primary hover:bg-primary-hover'
                  }`}
                >
                  <UserPlus size={18} aria-hidden="true" />
                  {isFollow ? t('detail.unfollow') : t('detail.follow')}
                  {followerTotal !== null && (
                    <span className="ml-1 text-xs font-bold opacity-80">· {followerTotal}</span>
                  )}
                </button>
              )}
            </div>
            {favError && <p role="alert" className="text-red-500 text-xs">{favError}</p>}
            {followError && <p role="alert" className="text-red-500 text-xs">{followError}</p>}
          </div>
        )}

        <p className="text-center text-gray-800 leading-relaxed mb-12 max-w-3xl">
          {synopsis || t('detail.synopsisEmpty')}
        </p>

        {/* Chapter list — dua sumber */}
        <div className="w-full flex flex-col gap-3 mb-16">
          <h3 className="font-bold text-xl text-gray-700 flex items-center gap-2">
            <BookOpen size={20} className="text-primary" aria-hidden="true" />
            {t('detail.chapters')}
          </h3>

          {isCreator ? (
            chapters.length === 0 ? (
              <div className="bg-surface/70 border border-primary/10 rounded-xl p-6 flex flex-col gap-1">
                <p className="font-semibold text-primary">{t('detail.noCreatorChapters')}</p>
                <p className="text-sm text-gray-600">{t('detail.noCreatorChaptersDesc')}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {chapters.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/read/${comicId}/${c.number}`}
                      className="flex items-center justify-between bg-surface/70 hover:bg-surface border border-primary/10 rounded-xl px-5 py-4 transition-colors group"
                    >
                      <span className="font-semibold text-primary">
                        {t('detail.chapterWord')} {c.number}
                        {c.title ? ` — ${c.title}` : ''}
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-primary">
                        {t('detail.readChapter')} →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="bg-surface/70 border border-primary/10 rounded-xl p-6 flex flex-col gap-1">
              <p className="font-semibold text-primary">{t('detail.noChapters')}</p>
              <p className="text-sm text-gray-600">{t('detail.noChaptersDesc')}</p>
            </div>
          )}
        </div>

        {/* Comments — komentar nyata per komik (M3), berlaku untuk kedua sumber */}
        <CommentSection comicId={comicId} />
      </main>

      <Footer />
    </div>
  );
};
