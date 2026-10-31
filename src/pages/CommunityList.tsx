import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Search } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { listCommunities, getMyCommunities, toggleJoinCommunity } from '../services/community';
import type { Community } from '../types/community';

type TabKey = 'all' | 'creator' | 'comic' | 'my';

const TABS: { key: TabKey; i18n: string }[] = [
  { key: 'all', i18n: 'community.tabAll' },
  { key: 'creator', i18n: 'community.tabCreator' },
  { key: 'comic', i18n: 'community.tabComic' },
  { key: 'my', i18n: 'community.tabMy' },
];

const CommunityCardSkeleton: React.FC = () => (
  <div className="bg-surface rounded-2xl overflow-hidden animate-pulse">
    <div className="h-28 bg-gray-300 w-full" />
    <div className="p-4 flex gap-3">
      <div className="w-14 h-14 rounded-full bg-gray-300 shrink-0 -mt-8 border-2 border-background" />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className="h-5 bg-gray-300 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  </div>
);

interface CommunityCardProps {
  community: Community;
  onToggle: (id: string) => void;
  busy: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onToggle, busy }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Cover */}
      <div className="h-28 w-full overflow-hidden bg-primary/20 relative">
        {community.coverUrl ? (
          <img
            src={community.coverUrl}
            alt=""
            className="w-full h-full object-cover opacity-80"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/10" />
        )}
        {/* Type badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm">
          {community.type === 'creator' ? t('community.officialBadge') : t('community.tabComic')}
        </span>
      </div>

      <div className="p-4 flex gap-3 flex-1">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 shrink-0 -mt-10 border-2 border-background shadow-md">
          {community.avatarUrl ? (
            <img src={community.avatarUrl} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-xl">
              {community.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <Link
            to={`/community/${community.id}`}
            className="font-bold text-primary hover:underline leading-tight line-clamp-1"
          >
            {community.name}
          </Link>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {community.description || ''}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Users size={12} aria-hidden="true" />
              {community.memberCount.toLocaleString()} {t('community.members')}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} aria-hidden="true" />
              {community.postCount} {t('community.posts')}
            </span>
          </div>
        </div>
      </div>

      {/* Join/Leave */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onToggle(community.id)}
          disabled={busy}
          aria-pressed={community.isMember}
          className={`w-full py-2 rounded-full font-bold text-sm transition-colors disabled:opacity-60 ${
            community.isMember
              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {community.isMember ? t('community.joined') : t('community.join')}
        </button>
      </div>
    </div>
  );
};

export const CommunityList: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        let data: Community[];
        if (activeTab === 'my') {
          data = user ? await getMyCommunities(user.id) : [];
        } else {
          data = await listCommunities(activeTab === 'all' ? 'all' : activeTab, user?.id);
        }
        if (!cancelled) {
          setCommunities(data);
          setError(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, user, reloadKey]);

  const handleToggle = async (communityId: string) => {
    if (!user) return;
    setBusyIds(prev => new Set(prev).add(communityId));
    try {
      const result = await toggleJoinCommunity(communityId, user.id);
      setCommunities(prev =>
        prev.map(c =>
          c.id === communityId
            ? { ...c, isMember: result.isMember, memberCount: result.memberCount }
            : c,
        ),
      );
      // Jika tab My Communities, hapus dari list jika sudah keluar
      if (activeTab === 'my' && !result.isMember) {
        setCommunities(prev => prev.filter(c => c.id !== communityId));
      }
    } finally {
      setBusyIds(prev => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
    }
  };

  const filtered = search.trim()
    ? communities.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase()),
      )
    : communities;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-3xl font-bold font-heading text-primary">{t('community.title')}</h1>
          <p className="text-gray-600 text-sm">{t('community.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-transparent focus:border-primary focus:ring-0 outline-none transition-colors text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-gray-200 overflow-x-auto hide-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setLoading(true); setSearch(''); }}
              aria-pressed={activeTab === tab.key}
              className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary -mb-[2px]'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              {t(tab.i18n)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CommunityCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-red-500 font-semibold">{t('common.loadError')}</p>
            <button
              onClick={() => { setLoading(true); setReloadKey(k => k + 1); }}
              className="px-5 py-2 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
              <Users size={28} className="text-primary" aria-hidden="true" />
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              {activeTab === 'my'
                ? 'Kamu belum bergabung dengan komunitas apapun. Gabung komunitas untuk mulai diskusi!'
                : t('common.empty')}
            </p>
            {activeTab === 'my' && (
              <button
                onClick={() => setActiveTab('all')}
                className="px-5 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-colors"
              >
                {t('community.tabAll')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <CommunityCard
                key={c.id}
                community={c}
                onToggle={handleToggle}
                busy={busyIds.has(c.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
