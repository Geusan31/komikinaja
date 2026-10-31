import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import {
  ChevronLeft,
  Eye,
  Bookmark,
  BookOpen,
  AlertCircle,
  Heart,
  UserPlus,
  Lock,
  Unlock,
  AlertTriangle,
  Trophy,
  Coins,
  X,
  MessageCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { isFavorite, addFavorite, removeFavorite } from '../services/favorites';
import { isFollowing, followAuthor, unfollowAuthor, followerCount } from '../services/followers';
import { recordView } from '../services/history';
import { isKitsuId, getCreatorComic, type CreatorComic, type CreatorChapter } from '../services/creatorComics';
import { getOrCreateCommunity } from '../services/community';
import {
  isChapterUnlocked,
  unlockChapter,
  getCoinBalance,
  sendAuthorTip,
  getSupportWall,
} from '../services/wallet';
import { CommentSection } from '../components/CommentSection';
import type { Comic } from '../types/comic';
import type { SupporterLeaderboardItem, SupportMessage } from '../types/monetization';

// ---------------------------------------------------------------------------
// DEMO badge
// ---------------------------------------------------------------------------

const DemoBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[10px] font-bold tracking-wider">
    <AlertTriangle size={10} aria-hidden="true" />
    DEMO
  </span>
);

// ---------------------------------------------------------------------------
// Unlock modal for premium chapters
// ---------------------------------------------------------------------------

interface UnlockModalProps {
  chapter: CreatorChapter;
  comicId: string;
  comicTitle: string;
  creatorId?: string;
  onClose: () => void;
  onUnlocked: () => void;
}

const UnlockModal: React.FC<UnlockModalProps> = ({
  chapter, comicId, comicTitle, creatorId, onClose, onUnlocked,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCoinBalance(user.id).then(b => setBalance(b));
  }, [user]);

  const insufficient = balance !== null && balance < chapter.priceCoins;

  const handleUnlock = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const result = await unlockChapter(
      user.id, comicId, comicTitle, chapter.id, chapter.number, chapter.priceCoins, creatorId,
    );
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => { onUnlocked(); onClose(); }, 1000);
    } else {
      setError(result.error || 'Gagal membuka chapter.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-primary">{t('detail.unlockConfirmTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Tutup">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <Unlock size={40} className="text-green-500" aria-hidden="true" />
            <p className="font-bold text-green-600">Chapter berhasil dibuka!</p>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
              <DemoBadge />
              <p className="text-xs text-amber-700">{t('wallet.demoNotice')}</p>
            </div>

            <p className="text-sm text-gray-700">
              {t('detail.unlockConfirmDesc', {
                chapter: chapter.number,
                coins: chapter.priceCoins,
              })}
            </p>

            {balance !== null && (
              <p className="text-sm font-semibold text-primary">
                {t('detail.yourBalance', { balance })}
              </p>
            )}

            {error && (
              <div className="text-red-500 text-sm bg-red-50 rounded-xl p-3">
                {error}
                {insufficient && (
                  <Link to="/wallet" className="block mt-1 font-bold underline text-primary">
                    {t('detail.goToWallet')}
                  </Link>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-300 font-bold rounded-full text-sm hover:bg-gray-100"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleUnlock}
                disabled={loading || insufficient}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-full text-sm disabled:opacity-50 hover:bg-primary/90"
              >
                {loading ? '...' : t('detail.confirmUnlock', { coins: chapter.priceCoins })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tip / Support Author modal
// ---------------------------------------------------------------------------

const TIP_AMOUNTS = [10, 25, 50, 100];

interface TipModalProps {
  creatorName: string;
  creatorId: string;
  comicId: string;
  comicTitle: string;
  onClose: () => void;
}

const TipModal: React.FC<TipModalProps> = ({ creatorName, creatorId, comicId, comicTitle, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [coins, setCoins] = useState(25);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCoinBalance(user.id).then(b => setBalance(b));
  }, [user]);

  const handleSend = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const result = await sendAuthorTip({
      donorUserId: user.id,
      donorName: user.name || user.email,
      donorAvatar: user.avatar || null,
      creatorId,
      comicId,
      comicTitle,
      coinAmount: coins,
      message: message.trim() || undefined,
      isAnonymous,
    });
    setLoading(false);
    if (result.success) {
      setDone(true);
    } else {
      setError(result.error || 'Gagal mengirim dukungan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <Heart size={28} className="text-red-500" fill="currentColor" aria-hidden="true" />
            </div>
            <p className="font-bold text-primary">{t('tip.success', { coins })}</p>
            <DemoBadge />
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-primary text-white font-bold rounded-full text-sm">
              {t('common.back')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primary text-base">{t('tip.modalTitle', { creator: creatorName })}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Tutup">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <DemoBadge />
              <p className="text-xs text-amber-700">{t('tip.modalDesc')}</p>
            </div>

            {balance !== null && (
              <p className="text-xs text-gray-500 text-right">{t('detail.yourBalance', { balance })}</p>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{t('tip.amountLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {TIP_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCoins(amt)}
                    className={`px-4 py-1.5 rounded-full font-bold text-sm border-2 transition-colors ${
                      coins === amt ? 'bg-primary text-white border-primary' : 'border-primary/20 text-primary hover:border-primary'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('tip.messagePlaceholder')}
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary resize-none bg-background"
            />

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="accent-primary" />
              {t('tip.anonymous')}
            </label>

            {error && <p role="alert" className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-300 font-bold rounded-full text-sm">
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !user}
                className="flex-1 py-2.5 bg-amber-500 text-white font-bold rounded-full text-sm disabled:opacity-60 hover:bg-amber-600"
              >
                {loading ? '...' : t('tip.sendBtn', { coins })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Support Wall (mini version for ComicDetail)
// ---------------------------------------------------------------------------

const SupportWallMini: React.FC<{ creatorId: string; comicId?: string; refreshKey: number }> = ({
  creatorId, comicId, refreshKey,
}) => {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<SupporterLeaderboardItem[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSupportWall({ creatorId, comicId }).then(({ leaderboard: lb, recentMessages: msgs }) => {
      if (!cancelled) { setLeaderboard(lb); setMessages(msgs); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [creatorId, comicId, refreshKey]);

  if (loading) return <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />;

  return (
    <div className="bg-surface/70 border border-primary/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-primary flex items-center gap-2 text-base">
          <Trophy size={16} className="text-amber-500" aria-hidden="true" />
          {t('detail.supportWall')}
        </h3>
        <DemoBadge />
      </div>

      {leaderboard.length === 0 && messages.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">{t('detail.noSupporters')}</p>
      ) : (
        <>
          {leaderboard.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('detail.topSupporters')}</p>
              {leaderboard.map(item => (
                <div key={item.userId} className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2">
                  <span className="text-sm w-5">{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}</span>
                  <div className="w-7 h-7 rounded-full bg-primary/10 overflow-hidden shrink-0">
                    {item.userAvatar
                      ? <img src={item.userAvatar} alt={item.userName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">{item.userName.charAt(0)}</div>
                    }
                  </div>
                  <span className="flex-1 font-semibold text-sm text-primary truncate">{item.userName}</span>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Coins size={11} aria-hidden="true" /> {item.totalCoins}
                  </span>
                </div>
              ))}
            </div>
          )}
          {messages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('detail.recentCheers')}</p>
              {messages.slice(0, 3).map(msg => (
                <div key={msg.id} className="flex gap-2 bg-background/60 rounded-lg px-3 py-2">
                  <MessageCircle size={12} className="text-primary/40 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-primary">{msg.donorName}</span>
                    {msg.message && <p className="text-xs text-gray-600 truncate">{msg.message}</p>}
                  </div>
                  <span className="text-xs text-amber-600 font-bold shrink-0">+{msg.coinAmount}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chapter list item — handles free/premium/unlocked state
// ---------------------------------------------------------------------------

interface ChapterItemProps {
  chapter: CreatorChapter;
  comicId: string;
  comicTitle: string;
  creatorId?: string;
  userId?: string;
}

const ChapterItem: React.FC<ChapterItemProps> = ({ chapter, comicId, comicTitle, creatorId, userId }) => {
  const { t } = useLanguage();
  const [unlocked, setUnlocked] = useState(!chapter.isPremium);
  const [showUnlock, setShowUnlock] = useState(false);

  useEffect(() => {
    if (!chapter.isPremium || !userId) return;
    let cancelled = false;
    isChapterUnlocked(userId, chapter.id).then(u => { if (!cancelled) setUnlocked(u); });
    return () => { cancelled = true; };
  }, [chapter.id, chapter.isPremium, userId]);

  const canRead = !chapter.isPremium || unlocked;

  return (
    <>
      <li>
        {canRead ? (
          <Link
            to={`/read/${comicId}/${chapter.number}`}
            className="flex items-center justify-between bg-surface/70 hover:bg-surface border border-primary/10 rounded-xl px-5 py-4 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-primary">
                {t('detail.chapterWord')} {chapter.number}
                {chapter.title ? ` — ${chapter.title}` : ''}
              </span>
              {chapter.isPremium && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                  <Unlock size={10} aria-hidden="true" />
                  Terbuka
                </span>
              )}
              {!chapter.isPremium && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold">
                  {t('detail.freeChapter')}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 group-hover:text-primary">{t('detail.readChapter')} →</span>
          </Link>
        ) : (
          <button
            onClick={() => setShowUnlock(true)}
            className="w-full flex items-center justify-between bg-surface/40 hover:bg-surface/70 border border-primary/10 rounded-xl px-5 py-4 transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-primary/70">
                {t('detail.chapterWord')} {chapter.number}
                {chapter.title ? ` — ${chapter.title}` : ''}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-[10px] font-bold">
                <Lock size={10} aria-hidden="true" />
                {t('detail.premiumChapter')}
              </span>
            </div>
            <span className="flex items-center gap-1 text-sm font-bold text-amber-600 group-hover:text-amber-700 shrink-0">
              <Coins size={14} aria-hidden="true" />
              {t('detail.unlockPrice', { coins: chapter.priceCoins })}
            </span>
          </button>
        )}
      </li>
      {showUnlock && (
        <UnlockModal
          chapter={chapter}
          comicId={comicId}
          comicTitle={comicTitle}
          creatorId={creatorId}
          onClose={() => setShowUnlock(false)}
          onUnlocked={() => setUnlocked(true)}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Main ComicDetail page
// ---------------------------------------------------------------------------

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

  // Follow state
  const [isFollow, setIsFollow] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState('');
  const [followerTotal, setFollowerTotal] = useState<number | null>(null);

  // Community link
  const [communityId, setCommunityId] = useState<string | null>(null);

  // Tip modal
  const [showTip, setShowTip] = useState(false);
  const [tipRefreshKey, setTipRefreshKey] = useState(0);

  // Load comic data
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

  // Derived values
  const comicId = id ?? '';
  const title = isCreator ? (creator?.title ?? '') : (manga?.title ?? '');
  const realCover = isCreator
    ? (creator?.coverUrl || null)
    : (manga?.images?.webp?.large_image_url || manga?.images?.jpg?.large_image_url || null);
  const coverUrl = realCover || 'https://placehold.co/400x600';
  const synopsis = isCreator ? (creator?.description ?? '') : (manga?.synopsis ?? '');
  const authorLabel = isCreator ? (creator?.authorName ?? '') : (manga?.authors.map(a => a.name).join(', ') ?? '');
  const genreList = isCreator
    ? (creator?.genres ?? []).map((name, i) => ({ key: `g-${i}`, name }))
    : (manga?.genres ?? []).map(g => ({ key: String(g.mal_id), name: g.name }));
  const hasData = isCreator ? creator !== null : manga !== null;

  // Favorite
  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    isFavorite(id).then(fav => { if (!cancelled) setIsFav(fav); });
    return () => { cancelled = true; };
  }, [id, user]);

  // Follow
  useEffect(() => {
    if (!isCreator || !creator?.authorId) return;
    let cancelled = false;
    followerCount(creator.authorId).then(n => { if (!cancelled) setFollowerTotal(n); });
    if (user) isFollowing(creator.authorId).then(f => { if (!cancelled) setIsFollow(f); });
    return () => { cancelled = true; };
  }, [isCreator, creator?.authorId, user]);

  // Reading history
  useEffect(() => {
    if (!user || !comicId || !title) return;
    recordView({ comicId, title, cover: realCover });
  }, [comicId, title, realCover, user]);

  // Community link
  useEffect(() => {
    if (!hasData || !comicId || !title) return;
    let cancelled = false;
    const type = isCreator ? 'creator' : 'comic';
    const targetId = isCreator ? (creator?.authorId || comicId) : comicId;
    const name = isCreator ? `Official ${authorLabel || title}` : `${title} Community`;
    getOrCreateCommunity(type, targetId, name, undefined, undefined, isCreator ? creator?.authorId : undefined)
      .then(comm => { if (!cancelled) setCommunityId(comm.id); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, comicId, isCreator]);

  const handleRetry = () => { setLoading(true); setError(false); setReloadKey(k => k + 1); };

  const handleToggleFavorite = async () => {
    if (!user || !comicId || !title) return;
    setFavBusy(true);
    setFavError('');
    if (isFav) {
      const { error: e } = await removeFavorite(comicId);
      if (e) setFavError(e); else setIsFav(false);
    } else {
      const { error: e } = await addFavorite({ comicId, title, cover: realCover });
      if (e) setFavError(e); else setIsFav(true);
    }
    setFavBusy(false);
  };

  const handleToggleFollow = async () => {
    if (!user || !creator?.authorId) return;
    setFollowBusy(true);
    setFollowError('');
    if (isFollow) {
      const { error: e } = await unfollowAuthor(creator.authorId);
      if (e) setFollowError(e);
      else { setIsFollow(false); setFollowerTotal(n => n === null ? n : Math.max(0, n - 1)); }
    } else {
      const { error: e } = await followAuthor(creator.authorId);
      if (e) setFollowError(e);
      else { setIsFollow(true); setFollowerTotal(n => n === null ? n : n + 1); }
    }
    setFollowBusy(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col text-left">
        <Navbar />
        <div className="w-full h-64 md:h-80 bg-gray-300 animate-pulse" />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-32 relative z-10 flex flex-col items-center animate-pulse">
          <div className="w-48 h-72 rounded-xl bg-gray-400 mb-6 border-4 border-background" />
          <div className="w-3/4 h-10 bg-gray-300 rounded mb-4" />
          <div className="w-1/2 h-6 bg-gray-300 rounded mb-8" />
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="w-20 h-6 bg-gray-300 rounded-full" />)}
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
          <button onClick={handleRetry} className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90">
            {t('common.retry')}
          </button>
          <button onClick={() => navigate(-1)} className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white">
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
        <img src={coverUrl} alt="" className="w-full h-full object-cover opacity-40 blur-sm scale-110" />
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

        {isCreator && (
          <span className="mb-3 px-3 py-1 bg-surface text-primary text-xs font-bold rounded-full border border-primary/20">
            {t('detail.creatorBadge')}
          </span>
        )}

        <h1 className="text-3xl md:text-4xl font-bold font-heading text-primary text-center mb-2">
          {title}
        </h1>

        {/* Author link → creator profile */}
        <p className="text-gray-600 mb-4 text-center font-medium">
          {isCreator ? t('detail.creatorBy') : t('detail.author')}:{' '}
          {isCreator && creator?.authorId ? (
            <Link
              to={`/creator/${creator.authorId}`}
              className="font-bold text-primary hover:underline"
            >
              {authorLabel || t('detail.unknownAuthor')}
            </Link>
          ) : (
            <span>{authorLabel || t('detail.unknownAuthor')}</span>
          )}
        </p>

        {genreList.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {genreList.map(g => (
              <span key={g.key} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
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

        {/* Action buttons */}
        {user && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Favorite */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favBusy}
                aria-pressed={isFav}
                className={`px-6 py-2 rounded-full font-bold border-2 transition-colors flex items-center gap-2 disabled:opacity-60 ${
                  isFav ? 'bg-primary text-white border-primary' : 'bg-transparent text-primary border-primary hover:bg-primary hover:text-white'
                }`}
              >
                <Heart size={18} className={isFav ? 'fill-white' : ''} aria-hidden="true" />
                {isFav ? t('detail.removeFavorite') : t('detail.addFavorite')}
              </button>

              {/* Follow — hanya untuk karya kreator */}
              {isCreator && creator && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  aria-pressed={isFollow}
                  className={`px-6 py-2 rounded-full font-bold border-2 transition-colors flex items-center gap-2 disabled:opacity-60 ${
                    isFollow ? 'bg-surface text-primary border-primary/40' : 'bg-primary text-white border-primary hover:bg-primary/90'
                  }`}
                >
                  <UserPlus size={18} aria-hidden="true" />
                  {isFollow ? t('detail.unfollow') : t('detail.follow')}
                  {followerTotal !== null && <span className="ml-1 text-xs font-bold opacity-80">· {followerTotal}</span>}
                </button>
              )}

              {/* Support Author — hanya untuk karya kreator, bukan diri sendiri */}
              {isCreator && creator && user.id !== creator.authorId && (
                <button
                  type="button"
                  onClick={() => setShowTip(true)}
                  className="px-6 py-2 rounded-full font-bold border-2 border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
                >
                  <Heart size={18} aria-hidden="true" />
                  {t('detail.supportAuthor')}
                </button>
              )}
            </div>
            {favError && <p role="alert" className="text-red-500 text-xs">{favError}</p>}
            {followError && <p role="alert" className="text-red-500 text-xs">{followError}</p>}
          </div>
        )}

        {/* Community link */}
        {communityId && (
          <Link
            to={`/community/${communityId}`}
            className="mb-6 px-6 py-2 rounded-full font-bold border-2 border-primary/30 text-primary/80 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Lihat Komunitas
          </Link>
        )}

        {/* Synopsis */}
        <p className="text-center text-gray-800 leading-relaxed mb-10 max-w-3xl">
          {synopsis || t('detail.synopsisEmpty')}
        </p>

        {/* Chapter list */}
        <div className="w-full flex flex-col gap-3 mb-10">
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
                {chapters.map(c => (
                  <ChapterItem
                    key={c.id}
                    chapter={c}
                    comicId={comicId}
                    comicTitle={title}
                    creatorId={creator?.authorId}
                    userId={user?.id}
                  />
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

        {/* Support Wall — hanya untuk karya kreator */}
        {isCreator && creator?.authorId && (
          <div className="w-full mb-10">
            <SupportWallMini
              creatorId={creator.authorId}
              comicId={comicId}
              refreshKey={tipRefreshKey}
            />
          </div>
        )}

        {/* Comments */}
        <CommentSection comicId={comicId} />
      </main>

      <Footer />

      {/* Tip modal */}
      {showTip && isCreator && creator && (
        <TipModal
          creatorName={authorLabel || 'Kreator'}
          creatorId={creator.authorId}
          comicId={comicId}
          comicTitle={title}
          onClose={() => { setShowTip(false); setTipRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
};
