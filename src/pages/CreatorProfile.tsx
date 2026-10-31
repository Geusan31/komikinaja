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
  AlertTriangle,
  Coins,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isFollowing, followAuthor, unfollowAuthor, followerCount } from '../services/followers';
import { listPublishedComics, type CreatorComic } from '../services/creatorComics';
import { getSupportWall, sendAuthorTip, getCoinBalance } from '../services/wallet';
import { getOrCreateCommunity } from '../services/community';
import type { SupporterLeaderboardItem, SupportMessage } from '../types/monetization';

// ---------------------------------------------------------------------------
// DEMO badge
// ---------------------------------------------------------------------------

const DemoBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-400 text-amber-700 text-[10px] font-bold tracking-wider">
    <AlertTriangle size={10} aria-hidden="true" />
    DEMO
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
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        {done ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Heart size={32} className="text-green-500" aria-hidden="true" fill="currentColor" />
            </div>
            <p className="font-bold text-primary text-lg">Terima kasih!</p>
            <p className="text-sm text-gray-600">
              {t('tip.success', { coins })}
            </p>
            <DemoBadge />
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-primary text-white font-bold rounded-full">
              {t('common.back')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-primary text-base flex items-center gap-2">
                <Heart size={16} className="text-red-500" aria-hidden="true" />
                {t('tip.modalTitle', { creator: creatorName })}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Tutup">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* DEMO notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <DemoBadge />
              <p className="text-xs text-amber-700">{t('tip.modalDesc')}</p>
            </div>

            {/* Balance info */}
            {balance !== null && (
              <p className="text-xs text-gray-500 text-right">
                {t('detail.yourBalance', { balance })}
              </p>
            )}

            {/* Amount selector */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">{t('tip.amountLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {TIP_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCoins(amt)}
                    className={`px-4 py-1.5 rounded-full font-bold text-sm border-2 transition-colors ${
                      coins === amt
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/20 text-primary hover:border-primary'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                {t('tip.messageLabel')}
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('tip.messagePlaceholder')}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors resize-none bg-background"
              />
            </div>

            {/* Anonymous */}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="accent-primary"
              />
              {t('tip.anonymous')}
            </label>

            {error && <p role="alert" className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-300 font-bold rounded-full text-sm"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !user}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-full text-sm disabled:opacity-60 hover:bg-primary/90 transition-colors"
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

  const rankEmoji = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  if (loading) {
    return <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />;
  }

  return (
    <section className="bg-surface rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="font-bold text-primary flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" aria-hidden="true" />
          {t('detail.supportWall')}
        </h3>
        <DemoBadge />
      </div>

      {leaderboard.length === 0 && messages.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t('detail.noSupporters')}</p>
      ) : (
        <>
          {leaderboard.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t('detail.topSupporters')}
              </p>
              <div className="flex flex-col gap-2">
                {leaderboard.map(item => (
                  <div
                    key={item.userId}
                    className="flex items-center gap-3 bg-background/60 rounded-xl px-3 py-2"
                  >
                    <span className="text-lg w-6 text-center">{rankEmoji(item.rank)}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0">
                      {item.userAvatar
                        ? <img src={item.userAvatar} alt={item.userName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">{item.userName.charAt(0)}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-primary truncate">{item.userName}</p>
                      {item.recentMessage && (
                        <p className="text-xs text-gray-500 truncate italic">{item.recentMessage}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1 shrink-0">
                      <Coins size={12} aria-hidden="true" />
                      {item.totalCoins}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t('detail.recentCheers')}
              </p>
              <div className="flex flex-col gap-2">
                {messages.slice(0, 5).map(msg => (
                  <div
                    key={msg.id}
                    className="flex gap-2 items-start bg-background/60 rounded-xl px-3 py-2"
                  >
                    <MessageCircle size={14} className="text-primary/40 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-primary">{msg.donorName}</span>
                      {msg.message && (
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{msg.message}</p>
                      )}
                    </div>
                    <span className="text-xs text-amber-600 font-bold shrink-0">+{msg.coinAmount}</span>
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
// Comic card mini
// ---------------------------------------------------------------------------

const ComicCardMini: React.FC<{ comic: CreatorComic }> = ({ comic }) => (
  <Link to={`/comic/${comic.id}`} className="group flex flex-col gap-2">
    <div className="aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-200 shadow-sm transition-transform duration-300 group-hover:scale-105">
      <img
        src={comic.coverUrl || 'https://placehold.co/300x450/1F2544/EAE3D2/png?text=' + encodeURIComponent(comic.title.charAt(0))}
        alt={comic.title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
    <p className="font-bold text-primary text-xs leading-tight truncate">{comic.title}</p>
  </Link>
);

// ---------------------------------------------------------------------------
// Main — Creator Public Profile
// Disambiguate: this receives authorId from URL param
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

  // Creator info (derived from first comic)
  const creatorName = comics[0]?.authorName || 'Kreator';

  useEffect(() => {
    if (!authorId) return;
    let cancelled = false;

    // Load all published comics and filter by authorId
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

    // Create/get community for this creator
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
        <div className="w-full h-48 bg-gray-300 animate-pulse" />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />)}
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
        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-primary text-white font-bold rounded-full">
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Cover */}
      <div className="w-full h-44 md:h-52 relative overflow-hidden bg-gradient-to-br from-primary to-primary/60">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white flex items-center gap-1 text-sm font-bold bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/50 z-10"
        >
          <ChevronLeft size={18} aria-hidden="true" />
          {t('common.back')}
        </button>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 -mt-10 relative z-10">

        {/* Profile card */}
        <div className="bg-background border border-primary/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-background shadow-md shrink-0 -mt-10">
              {creatorName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-2xl text-primary leading-tight">{creatorName}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Users size={14} aria-hidden="true" />
                  {followerTotal.toLocaleString()} {t('profile.totalFollowers')}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} aria-hidden="true" />
                  {comics.length} karya
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {user && (
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleToggleFollow}
                disabled={followBusy}
                aria-pressed={isFollow}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm border-2 transition-colors disabled:opacity-60 ${
                  isFollow
                    ? 'bg-surface text-primary border-primary/30'
                    : 'bg-primary text-white border-primary hover:bg-primary/90'
                }`}
              >
                <UserPlus size={16} aria-hidden="true" />
                {isFollow ? t('detail.unfollow') : t('detail.follow')}
              </button>

              {user.id !== authorId && (
                <button
                  onClick={() => setShowTip(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm border-2 border-amber-400 text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  <Heart size={16} aria-hidden="true" />
                  {t('detail.supportAuthor')}
                </button>
              )}

              {communityId && (
                <Link
                  to={`/community/${communityId}`}
                  className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Users size={16} aria-hidden="true" />
                  Komunitas
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Comics grid */}
        <section>
          <h2 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
            <BookOpen size={18} aria-hidden="true" />
            Karya
          </h2>
          {comics.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('profile.comicsEmptyDesc')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {comics.map(c => <ComicCardMini key={c.id} comic={c} />)}
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
