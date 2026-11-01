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
  <div className="bg-surface rounded-xl border border-primary/10 p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl bg-gray-300 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-4/5" />
    </div>
    <div className="h-9 bg-gray-300 rounded-md w-full mt-2" />
  </div>
);

interface CommunityCardProps {
  community: Community;
  onToggle: (id: string) => void;
  busy: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onToggle, busy }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="bg-surface rounded-xl border border-primary/15 hover:border-primary/30 transition-all p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md">
      {/* Top Header */}
      <div className="flex items-start gap-3.5">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center">
          {community.avatarUrl ? (
            <img
              src={community.avatarUrl}
              alt={community.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-heading font-bold text-2xl text-primary">
              {community.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md">
              {community.type === 'creator' ? t('community.officialBadge') : t('community.tabComic')}
            </span>
          </div>
          <Link
            to={`/community/${community.id}`}
            className="font-heading font-bold text-lg text-primary hover:text-primary-hover hover:underline leading-snug line-clamp-1"
          >
            {community.name}
          </Link>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed flex-1">
        {community.description || 'Komunitas pembaca dan kreator komik.'}
      </p>

      {/* Meta Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-primary/10">
        <span className="flex items-center gap-1.5 font-medium">
          <Users size={13} className="text-primary/70" aria-hidden="true" />
          {community.memberCount.toLocaleString()} {t('community.members')}
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <MessageSquare size={13} className="text-primary/70" aria-hidden="true" />
          {community.postCount} {t('community.posts')}
        </span>
      </div>

      {/* Action Button */}
      {user ? (
        <button
          onClick={() => onToggle(community.id)}
          disabled={busy}
          aria-pressed={community.isMember}
          className={`w-full py-2.5 px-4 rounded-md font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer ${
            community.isMember
              ? 'bg-transparent text-primary border border-primary/30 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
        >
          {community.isMember ? t('community.joined') : t('community.join')}
        </button>
      ) : (
        <Link
          to="/login"
          className="w-full py-2.5 px-4 rounded-md font-semibold text-sm text-center bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          {t('community.join')}
        </Link>
      )}
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
        <div className="flex flex-col gap-1 text-left">
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
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-primary/15 bg-transparent focus:border-primary focus:ring-0 outline-none transition-colors text-sm text-primary placeholder-gray-400"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 border-b-2 border-primary/10 overflow-x-auto hide-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setLoading(true); setSearch(''); }}
              aria-pressed={activeTab === tab.key}
              className={`pb-3 font-heading font-bold text-sm whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
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
              className="px-5 py-2.5 border border-primary/30 text-primary font-semibold text-sm rounded-md hover:bg-primary/5 transition-colors cursor-pointer"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-surface/50 rounded-xl border border-primary/10 p-8">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users size={24} className="text-primary" aria-hidden="true" />
            </div>
            <p className="text-gray-600 text-sm max-w-sm">
              {activeTab === 'my'
                ? 'Kamu belum bergabung dengan komunitas apapun. Gabung komunitas untuk mulai diskusi!'
                : t('common.empty')}
            </p>
            {activeTab === 'my' && (
              <button
                onClick={() => setActiveTab('all')}
                className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-md hover:bg-primary-hover transition-colors cursor-pointer"
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
