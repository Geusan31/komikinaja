import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  UserPlus,
  BookOpen,
  Users,
  AlertCircle,
  Heart,
  Trophy,
  MessageCircle,
  Coins,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComicCard } from '../components/ComicCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isFollowing, followAuthor, unfollowAuthor, followerCount } from '../services/followers';
import { listPublishedComics, type CreatorComic } from '../services/creatorComics';
import { getSupportWall, sendAuthorTip, getCoinBalance } from '../services/wallet';
import { getOrCreateCommunity } from '../services/community';
import type { SupporterLeaderboardItem, SupportMessage } from '../types/monetization';

// ---------------------------------------------------------------------------
// Simulation Badge
// ---------------------------------------------------------------------------

const SimulationBadge: React.FC = () => (
  <span className="text-[11px] font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md">
    Simulasi • Sandbox
  </span>
);

// ---------------------------------------------------------------------------
// Tip modal
// ---------------------------------------------------------------------------

const TIP_AMOUNTS = [10, 25, 50, 100, 250];

interface TipModalProps {
  creatorName: string;
  creatorId: string;
  comicId?: string;
  comicTitle?: string;
  onClose: () => void;
  onSuccess: (coins: number) => void;
}

const TipModal: React.FC<TipModalProps> = ({
  creatorName, creatorId, comicId, comicTitle, onClose, onSuccess,
}) => {
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
      comicId: comicId || null,
      comicTitle: comicTitle || null,
      coinAmount: coins,
      message: message.trim() || undefined,
      isAnonymous,
    });
    setLoading(false);
    if (result.success) {
      onSuccess(coins);
      setDone(true);
    } else {
      setError(result.error || 'Gagal mengirim tip.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-background rounded-xl border border-primary/20 p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart size={28} className="text-primary" aria-hidden="true" fill="currentColor" />
            </div>
            <p className="font-heading font-bold text-primary text-lg">Terima kasih!</p>
            <p className="text-xs text-gray-600">
              {t('tip.success', { coins })}
            </p>
            <SimulationBadge />
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 bg-primary text-white font-semibold text-sm rounded-md hover:bg-primary-hover transition-colors cursor-pointer"
            >
              {t('common.back')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-primary text-base flex items-center gap-2">
                <Heart size={16} className="text-primary" aria-hidden="true" />
                {t('tip.modalTitle', { creator: creatorName })}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer" aria-label="Tutup">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Sandbox Notice */}
            <div className="bg-surface rounded-lg border border-primary/15 p-3 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-700 leading-snug">{t('tip.modalDesc')}</p>
              <SimulationBadge />
            </div>

            {/* Balance info */}
            {balance !== null && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Saldo Anda:</span>
                <span className="font-semibold text-primary flex items-center gap-1">
                  <Coins size={13} className="text-primary/70" />
                  {balance} Koin
                </span>
              </div>
            )}

            {/* Amount selector */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">{t('tip.amountLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {TIP_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCoins(amt)}
                    className={`px-3.5 py-1.5 rounded-md font-semibold text-xs border transition-colors cursor-pointer ${
                      coins === amt
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/20 text-primary hover:border-primary/50'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                {t('tip.messageLabel')}
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('tip.messagePlaceholder')}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 text-xs border border-primary/20 rounded-md outline-none focus:border-primary transition-colors resize-none bg-background text-primary"
              />
            </div>

            {/* Anonymous */}
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="accent-primary"
              />
              {t('tip.anonymous')}
            </label>

            {error && <p role="alert" className="text-red-500 text-xs font-medium">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-primary/30 text-primary font-semibold rounded-md text-xs hover:bg-primary/5 transition-colors cursor-pointer"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !user}
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-md text-xs disabled:opacity-60 hover:bg-primary-hover transition-colors cursor-pointer"
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
// Support Wall
// ---------------------------------------------------------------------------

interface SupportWallProps {
  creatorId: string;
}

const SupportWall: React.FC<SupportWallProps> = ({ creatorId }) => {
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<SupporterLeaderboardItem[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSupportWall({ creatorId }).then(({ leaderboard: lb, recentMessages: msgs }) => {
      if (!cancelled) {
        setLeaderboard(lb);
        setMessages(msgs);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [creatorId]);

  if (loading) {
    return <div className="h-28 bg-surface rounded-xl border border-primary/10 animate-pulse" />;
  }

  return (
    <section className="bg-surface rounded-xl border border-primary/15 p-6 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
          <Trophy size={18} className="text-primary/70" aria-hidden="true" />
          {t('detail.supportWall')}
        </h3>
        <SimulationBadge />
      </div>

      {leaderboard.length === 0 && messages.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">{t('detail.noSupporters')}</p>
      ) : (
        <>
          {leaderboard.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider">
                {t('detail.topSupporters')}
              </p>
              <div className="flex flex-col gap-2">
                {leaderboard.map(item => (
                  <div
                    key={item.userId}
                    className="flex items-center gap-3 bg-background/80 rounded-lg p-3 border border-primary/10"
                  >
                    <span
                      className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 ${
                        item.rank === 1
                          ? 'bg-primary text-white'
                          : item.rank === 2
                          ? 'bg-primary/80 text-white'
                          : item.rank === 3
                          ? 'bg-primary/60 text-white'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div className="w-8 h-8 rounded-md bg-primary/10 overflow-hidden shrink-0 border border-primary/20 flex items-center justify-center">
                      {item.userAvatar ? (
                        <img src={item.userAvatar} alt={item.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-xs">{item.userName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-xs text-primary truncate">{item.userName}</p>
                      {item.recentMessage && (
                        <p className="text-[11px] text-gray-600 truncate italic">{item.recentMessage}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-primary flex items-center gap-1 shrink-0">
                      <Coins size={12} className="text-primary/70" aria-hidden="true" />
                      {item.totalCoins}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-primary/10">
              <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider">
                {t('detail.recentCheers')}
              </p>
              <div className="flex flex-col gap-2">
                {messages.slice(0, 5).map(msg => (
                  <div
                    key={msg.id}
                    className="flex gap-2.5 items-start bg-background/80 rounded-lg p-3 border border-primary/10"
                  >
                    <MessageCircle size={14} className="text-primary/50 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <span className="font-heading font-bold text-xs text-primary">{msg.donorName}</span>
                      {msg.message && (
                        <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{msg.message}</p>
                      )}
                    </div>
                    <span className="text-xs text-primary font-semibold shrink-0">+{msg.coinAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Main — Creator Public Profile
// ---------------------------------------------------------------------------

export const CreatorProfile: React.FC = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [comics, setComics] = useState<CreatorComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Follow state
  const [isFollow, setIsFollow] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [followerTotal, setFollowerTotal] = useState<number>(0);

  // Tip modal
  const [showTip, setShowTip] = useState(false);

  // Community
  const [communityId, setCommunityId] = useState<string | null>(null);

  const creatorName = comics[0]?.authorName || 'Kreator';

  useEffect(() => {
    if (!authorId) return;
    let cancelled = false;

    listPublishedComics(50).then(({ data, error: hasError }) => {
      if (cancelled) return;
      if (hasError) { setError(true); setLoading(false); return; }
      const filtered = data.filter(c => c.authorId === authorId);
      setComics(filtered);
      setLoading(false);
    });

    followerCount(authorId).then(n => { if (!cancelled) setFollowerTotal(n); });
    if (user) {
      isFollowing(authorId).then(f => { if (!cancelled) setIsFollow(f); });
    }

    getOrCreateCommunity('creator', authorId, `Official Creator`, undefined, undefined, authorId)
      .then(comm => { if (!cancelled) setCommunityId(comm.id); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [authorId, user]);

  const handleToggleFollow = async () => {
    if (!user || !authorId) return;
    setFollowBusy(true);
    if (isFollow) {
      const { error: e } = await unfollowAuthor(authorId);
      if (!e) { setIsFollow(false); setFollowerTotal(n => Math.max(0, n - 1)); }
    } else {
      const { error: e } = await followAuthor(authorId);
      if (!e) { setIsFollow(true); setFollowerTotal(n => n + 1); }
    }
    setFollowBusy(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="h-44 bg-surface rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-3/4 bg-surface rounded-md animate-pulse" />)}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <AlertCircle size={32} className="text-red-400" aria-hidden="true" />
        <p className="text-red-500 font-semibold">{t('common.loadError')}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover transition-colors cursor-pointer"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {t('common.back')}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-surface rounded-xl border border-primary/20 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-primary flex items-center justify-center text-white text-3xl font-heading font-bold shadow-sm shrink-0 border border-primary/20">
              {creatorName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md self-start">
                Kreator Resmi
              </span>
              <h1 className="font-heading font-bold text-2xl text-primary leading-tight">{creatorName}</h1>
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users size={13} className="text-primary/70" aria-hidden="true" />
                  {followerTotal.toLocaleString()} {t('profile.totalFollowers')}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen size={13} className="text-primary/70" aria-hidden="true" />
                  {comics.length} karya
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {user && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={handleToggleFollow}
                disabled={followBusy}
                aria-pressed={isFollow}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md font-semibold text-xs border transition-colors disabled:opacity-60 cursor-pointer ${
                  isFollow
                    ? 'border-primary/30 text-primary hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                    : 'bg-primary text-white border-primary hover:bg-primary-hover'
                }`}
              >
                <UserPlus size={14} aria-hidden="true" />
                {isFollow ? t('detail.unfollow') : t('detail.follow')}
              </button>

              {user.id !== authorId && (
                <button
                  onClick={() => setShowTip(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-md font-semibold text-xs border border-primary/30 text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Heart size={14} className="text-primary" aria-hidden="true" />
                  {t('detail.supportAuthor')}
                </button>
              )}

              {communityId && (
                <Link
                  to={`/community/${communityId}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-md font-semibold text-xs border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                >
                  <Users size={14} aria-hidden="true" />
                  Komunitas
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Comics Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-primary/10 pb-3">
            <h2 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
              <BookOpen size={18} className="text-primary/70" aria-hidden="true" />
              Karya Kreator
            </h2>
            <span className="text-xs text-gray-500 font-medium">{comics.length} komik dirilis</span>
          </div>

          {comics.length === 0 ? (
            <div className="text-center py-12 bg-surface/40 rounded-xl border border-primary/10 p-6">
              <p className="text-gray-600 text-xs">{t('profile.comicsEmptyDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {comics.map(c => (
                <Link key={c.id} to={`/comic/${c.id}`} className="block">
                  <ComicCard
                    title={c.title}
                    cover={c.coverUrl || 'https://placehold.co/300x450/1F2544/EAE3D2/png?text=' + encodeURIComponent(c.title.charAt(0))}
                    episode={`${c.genres.slice(0, 2).join(', ') || 'Original'}`}
                    likes="-"
                    views="-"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Support Wall */}
        {authorId && <SupportWall creatorId={authorId} />}
      </main>

      <Footer />

      {/* Tip modal */}
      {showTip && authorId && (
        <TipModal
          creatorName={creatorName}
          creatorId={authorId}
          onClose={() => setShowTip(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
