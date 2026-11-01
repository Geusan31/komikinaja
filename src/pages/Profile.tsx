import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { listFavorites, type FavoriteEntry } from '../services/favorites';
import { listMyComics, type CreatorComic } from '../services/creatorComics';
import { getAuthorStats, type WorkStat } from '../services/analytics';

import { BookOpen, Heart, Mail, Check, X, Settings2, Eye, BarChart3, ShieldCheck, Users, MessageSquare, Coins } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyCommunities } from '../services/community';
import { getCreatorEarningsSummary } from '../services/wallet';
import type { Community } from '../types/community';
import type { CreatorEarningsSummary } from '../types/monetization';

export const Profile: React.FC = () => {
  const { user, logout, setRole, updateProfile } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const isAuthor = user?.role === 'author';
  const isAdmin = user?.isAdmin ?? false;
  const [activeTab, setActiveTab] = useState(isAuthor ? 'KOMIK' : 'FAVORIT');

  // Data favorit sungguhan dari Supabase (hanya untuk pembaca).
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [favError, setFavError] = useState(false);

  // Karya milik author (tab KOMIK) — nyata dari tabel comics (M4).
  const [myComics, setMyComics] = useState<CreatorComic[]>([]);
  const [myComicsLoading, setMyComicsLoading] = useState(true);
  const [myComicsError, setMyComicsError] = useState(false);

  // Statistik karya author (A2) — tab ANALITIK.
  const [statWorks, setStatWorks] = useState<WorkStat[]>([]);
  const [statFollowers, setStatFollowers] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [creatorEarnings, setCreatorEarnings] = useState<CreatorEarningsSummary | null>(null);

  // Komunitas yang diikuti (tab KOMUNITAS).
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);

  // State edit nama panggilan.
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (isAuthor || activeTab !== 'FAVORIT') return;
    let cancelled = false;
    listFavorites().then(({ data, error }) => {
      if (cancelled) return;
      setFavorites(data);
      setFavError(error);
      setFavLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeTab, isAuthor]);

  // Muat karya milik author saat tab KOMIK aktif (M4).
  useEffect(() => {
    if (!isAuthor || activeTab !== 'KOMIK') return;
    let cancelled = false;
    listMyComics().then(({ data, error }) => {
      if (cancelled) return;
      setMyComics(data);
      setMyComicsError(error);
      setMyComicsLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeTab, isAuthor]);

  // Muat statistik & pendapatan saat tab ANALITIK dibuka (A2 & PRD §5.3).
  // Reset `statsLoading` dilakukan di handler klik tab (bukan di efek ini).
  useEffect(() => {
    if (!isAuthor || activeTab !== 'ANALITIK') return;
    let cancelled = false;
    getAuthorStats().then(({ works, followers, error }) => {
      if (cancelled) return;
      setStatWorks(works);
      setStatFollowers(followers);
      setStatsError(error);
      setStatsLoading(false);
    });
    if (user?.id) {
      getCreatorEarningsSummary(user.id).then((earn) => {
        if (!cancelled) setCreatorEarnings(earn);
      });
    }
    return () => { cancelled = true; };
  }, [activeTab, isAuthor, user?.id]);

  // Muat komunitas yang diikuti saat tab KOMUNITAS dibuka.
  useEffect(() => {
    if (activeTab !== 'KOMUNITAS' || !user) return;
    let cancelled = false;
    getMyCommunities(user.id).then(data => {
      if (cancelled) return;
      setMyCommunities(data);
      setCommunityLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeTab, user]);

  const showMainTab = () => {
    if (!isAuthor) setFavLoading(true);
    else setMyComicsLoading(true);
    setActiveTab(isAuthor ? 'KOMIK' : 'FAVORIT');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangeRole = async () => {
    await setRole(isAuthor ? 'reader' : 'author');
  };

  const saveName = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setNameSaving(true);
    setNameError('');
    const { error } = await updateProfile({ username: trimmed });
    setNameSaving(false);
    if (error) {
      setNameError(error);
      return;
    }
    setEditingName(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-left">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start pb-8 border-b-2 border-gray-300">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
              <img src={user?.avatar} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col text-center md:text-left gap-2 pt-2">
            <h1 className="text-2xl font-bold font-heading text-primary">{user?.name}</h1>
            <p className="text-gray-500 font-medium">@{user?.email.split('@')[0]}</p>
            <p className="text-sm text-gray-600 max-w-xl mt-2 leading-relaxed">
              {t('profile.defaultBio')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b-2 border-gray-300">
          <div className="flex gap-8">
            <button
              onClick={showMainTab}
              aria-pressed={activeTab !== 'AKUN' && activeTab !== 'ANALITIK'}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${
                activeTab !== 'AKUN' && activeTab !== 'ANALITIK'
                  ? 'text-primary border-b-4 border-primary'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {isAuthor ? t('profile.comic') : t('profile.favorite')}
            </button>
            {isAuthor && (
              <button
                onClick={() => { setStatsLoading(true); setActiveTab('ANALITIK'); }}
                aria-pressed={activeTab === 'ANALITIK'}
                className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ANALITIK'
                    ? 'text-primary border-b-4 border-primary'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <BarChart3 size={15} aria-hidden="true" />
                {t('profile.analytics')}
              </button>
            )}
            <button
              onClick={() => setActiveTab('AKUN')}
              aria-pressed={activeTab === 'AKUN'}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${
                activeTab === 'AKUN' ? 'text-primary border-b-4 border-primary' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('profile.account')}
            </button>
            <button
              onClick={() => { setCommunityLoading(true); setActiveTab('KOMUNITAS'); }}
              aria-pressed={activeTab === 'KOMUNITAS'}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors flex items-center gap-1.5 ${
                activeTab === 'KOMUNITAS' ? 'text-primary border-b-4 border-primary' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MessageSquare size={15} aria-hidden="true" />
              {t('community.tabMy')}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/wallet"
              className="px-3.5 py-2 bg-surface border border-primary/20 text-primary rounded-md text-xs font-semibold hover:bg-primary/5 transition-colors flex items-center gap-1.5"
            >
              <Coins size={14} className="text-primary/70" aria-hidden="true" />
              <span>{t('nav.wallet')}</span>
              <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded font-semibold">Demo</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="px-3.5 py-2 border border-red-500 text-red-600 rounded-md text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck size={14} aria-hidden="true" />
                {t('profile.adminDashboard')}
              </Link>
            )}
            {isAuthor && activeTab === 'KOMIK' && (
              <Link to="/add-comic" className="px-3.5 py-2 border border-primary/30 text-primary rounded-md text-xs font-semibold hover:bg-primary/5 transition-colors">
                {t('profile.addComic')}
              </Link>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'KOMUNITAS' ? (
          /* Tab KOMUNITAS — komunitas yang diikuti user */
          <div className="flex flex-col gap-4">
            {communityLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-surface rounded-xl border border-primary/10 animate-pulse" />
                ))}
              </div>
            ) : myCommunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-surface/50 rounded-xl border border-primary/10 p-8">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare size={24} className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-heading font-bold text-primary">Belum ada komunitas</h3>
                <p className="text-xs text-gray-600 max-w-sm">
                  Bergabunglah ke komunitas untuk berdiskusi dengan sesama pembaca dan kreator.
                </p>
                <Link
                  to="/community"
                  className="mt-2 px-5 py-2.5 bg-primary text-white font-semibold text-xs rounded-md hover:bg-primary-hover transition-colors"
                >
                  {t('community.tabAll')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myCommunities.map(c => (
                  <Link
                    key={c.id}
                    to={`/community/${c.id}`}
                    className="flex items-center gap-4 bg-surface hover:bg-surface/90 border border-primary/15 rounded-xl p-4 transition-colors group shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-primary/10 border border-primary/20 shrink-0 flex items-center justify-center">
                      {c.avatarUrl
                        ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                        : <span className="text-primary font-heading font-bold text-sm">{c.name.charAt(0)}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-primary group-hover:underline truncate">{c.name}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Users size={12} className="text-primary/70" aria-hidden="true" />
                          {c.memberCount.toLocaleString()} {t('community.members')}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <MessageSquare size={12} className="text-primary/70" aria-hidden="true" />
                          {c.postCount} {t('community.posts')}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary/50 group-hover:text-primary transition-colors">→</span>
                  </Link>
                ))}
                <Link
                  to="/community"
                  className="text-center text-xs text-primary font-semibold hover:underline mt-2"
                >
                  Temukan lebih banyak komunitas →
                </Link>
              </div>
            )}
          </div>
        ) : activeTab === 'AKUN' ? (
          <div className="flex flex-col gap-6">
            <AccountSection title={t('profile.loginWith')}>
              {user?.provider === 'google' ? (
                <div className="flex items-center gap-2 text-primary font-bold">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
                  Google
                </div>
              ) : (
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Mail size={20} aria-hidden="true" />
                  {user?.email}
                </div>
              )}
            </AccountSection>

            <AccountSection title={t('profile.nickname')}>
              <div className="flex justify-between items-center w-full text-sm font-bold text-primary">
                {editingName ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md outline-none focus:border-primary text-primary"
                      aria-label={t('profile.nickname')}
                    />
                    <button
                      onClick={saveName}
                      disabled={nameSaving}
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      aria-label={t('profile.save')}
                    >
                      <Check size={18} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setNewName(user?.name ?? ''); setNameError(''); }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      aria-label={t('common.back')}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{user?.name}</span>
                    <button
                      onClick={() => { setNewName(user?.name ?? ''); setEditingName(true); }}
                      className="px-4 py-1 border border-gray-400 rounded-full hover:bg-gray-200"
                    >
                      {t('profile.edit')}
                    </button>
                  </>
                )}
              </div>
              {nameError && <p role="alert" className="text-red-500 text-xs w-full mt-1">{nameError}</p>}
            </AccountSection>

            <AccountSection title={t('profile.settings')}>
              <div className="flex flex-col gap-4 w-full">
                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">Email</span>
                    <span className="text-sm text-gray-600">{user?.email}</span>
                  </div>
                  <button
                    disabled
                    title={t('common.soon')}
                    className="px-4 py-1 border border-gray-400 rounded-full opacity-50 cursor-not-allowed text-sm font-bold"
                  >
                    {t('profile.changeEmail')}
                  </button>
                </div>

                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <span className="font-medium text-gray-600">{t('profile.notif')}</span>
                  <span
                    className="w-12 h-6 bg-gray-300 rounded-full relative opacity-50"
                    aria-disabled="true"
                    title={t('common.soon')}
                  >
                    <span className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></span>
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <span className="font-medium text-gray-600">{t('profile.bestComment')}</span>
                  <span
                    className="w-12 h-6 bg-gray-300 rounded-full relative opacity-50"
                    aria-disabled="true"
                    title={t('common.soon')}
                  >
                    <span className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></span>
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <span className="font-medium text-gray-600">{t('profile.changeRole')} ({isAuthor ? 'Author → Reader' : 'Reader → Author'})</span>
                  <button onClick={handleChangeRole} className="px-4 py-1 border border-gray-400 rounded-full hover:bg-gray-200 text-sm font-bold">{t('profile.changeRole')}</button>
                </div>

                <button
                  type="button"
                  className="flex justify-between items-center pt-2 cursor-pointer group w-full text-left"
                  onClick={toggleLanguage}
                >
                  <span className="font-medium text-gray-600">{t('profile.chooseLanguage')}</span>
                  <span className="font-bold text-primary text-sm group-hover:underline">{language === 'id' ? 'Bahasa Indonesia' : 'English'} &gt;</span>
                </button>
              </div>
            </AccountSection>

            <AccountSection title={t('profile.promo')}>
              <div className="flex flex-col gap-2 w-full md:w-1/2">
                <span className="text-sm text-gray-600">{t('profile.promoDesc')}</span>
              </div>
              <div className="w-full md:w-1/2 flex justify-end">
                <button
                  disabled
                  title={t('common.soon')}
                  className="px-6 py-3 border border-gray-400 rounded-lg text-sm text-gray-500 w-full md:w-auto opacity-50 cursor-not-allowed"
                >
                  {t('profile.fillPromo')}
                </button>
              </div>
            </AccountSection>

            <div className="flex justify-center mt-8">
              <button onClick={handleLogout} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                {t('profile.logout')}
              </button>
            </div>
          </div>
        ) : activeTab === 'ANALITIK' ? (
          /* Tab ANALITIK (Author) — A2: jumlah pembaca, follower, chapter populer */
          statsLoading ? (
            <div className="flex flex-col gap-4">
              <div className="h-24 bg-gray-300 rounded-2xl animate-pulse"></div>
              <div className="h-40 bg-gray-300 rounded-xl animate-pulse"></div>
            </div>
          ) : statsError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <p className="text-sm text-red-500">{t('common.loadError')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Ringkasan follower */}
              <div className="bg-surface p-6 rounded-xl border border-primary/15 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Users size={22} className="text-primary" aria-hidden="true" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-3xl font-heading font-bold text-primary leading-none">{statFollowers}</span>
                  <span className="text-xs text-gray-600 mt-1 font-medium">{t('profile.totalFollowers')}</span>
                </div>
              </div>

              {/* Ringkasan Pendapatan Koin */}
              <div className="bg-surface border border-primary/15 p-6 rounded-xl flex flex-col gap-4 text-left shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Coins size={18} className="text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-primary text-base flex items-center gap-2">
                        {t('wallet.creatorEarnings')}
                        <span className="text-[11px] font-semibold text-primary/70 bg-primary/10 px-2 py-0.5 rounded-md">
                          Simulasi • Sandbox
                        </span>
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {t('wallet.payoutNotice')}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/wallet"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Buka Dompet →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-primary/10">
                  <div className="bg-background/80 rounded-lg p-3.5 border border-primary/10">
                    <p className="text-xs text-gray-600">{t('wallet.grossEarnings')}</p>
                    <p className="text-xl font-heading font-bold text-primary mt-1">
                      {creatorEarnings?.grossCoins ?? 0} <span className="text-xs font-normal">Koin</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Pendapatan kotor simulasi
                    </p>
                  </div>

                  <div className="bg-background/80 rounded-lg p-3.5 border border-primary/10">
                    <p className="text-xs text-gray-600">{t('wallet.platformFee')}</p>
                    <p className="text-xl font-heading font-bold text-gray-600 mt-1">
                      {creatorEarnings?.platformFeeCoins ?? 0} <span className="text-xs font-normal">Koin</span>
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">30% untuk platform</p>
                  </div>

                  <div className="bg-background/80 rounded-lg p-3.5 border border-primary/20">
                    <p className="text-xs text-primary font-semibold">{t('wallet.netEarnings')}</p>
                    <p className="text-xl font-heading font-bold text-primary mt-1">
                      {creatorEarnings?.netCoins ?? 0} <span className="text-xs font-normal">Koin</span>
                    </p>
                    <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                      ≈ Rp {(creatorEarnings?.estimatedNetIdr ?? 0).toLocaleString('id-ID')} (Simulasi)
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistik per karya */}
              <h3 className="font-bold text-lg text-primary text-left">{t('profile.workStats')}</h3>
              {statWorks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <p className="text-sm text-gray-600">{t('profile.comicsEmptyDesc')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {statWorks.map((w) => (
                    <div
                      key={w.comicId}
                      className="bg-surface/70 border border-primary/10 rounded-xl p-4 flex gap-4 items-center"
                    >
                      <Link to={`/comic/${w.comicId}`} className="w-14 h-20 rounded-md overflow-hidden bg-gray-200 shrink-0">
                        <img
                          src={w.coverUrl || 'https://placehold.co/400x600'}
                          alt={w.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                        <span className="font-bold text-primary truncate">{w.title}</span>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <Eye size={15} className="text-primary" aria-hidden="true" />
                            {t('profile.readers')}: <b className="text-primary">{w.uniqueReaders}</b>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <BookOpen size={15} className="text-primary" aria-hidden="true" />
                            {t('profile.totalReads')}: <b className="text-primary">{w.totalReads}</b>
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {t('profile.topChapter')}:{' '}
                          <b className="text-primary">
                            {w.topChapterNumber !== null
                              ? `${t('detail.chapterWord')} ${w.topChapterNumber} (${w.topChapterReads})`
                              : t('profile.noDataYet')}
                          </b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : isAuthor ? (
          /* Tab KOMIK (Author) — daftar karya nyata dari Supabase (M4) */
          myComicsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 animate-pulse">
                  <div className="aspect-3/4 w-full rounded-md bg-gray-300"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : myComicsError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <p className="text-sm text-red-500">{t('common.loadError')}</p>
            </div>
          ) : myComics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                <BookOpen size={28} className="text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-primary">{t('profile.comicsEmpty')}</h3>
              <p className="text-sm text-gray-600 max-w-sm">{t('profile.comicsEmptyDesc')}</p>
              <Link
                to="/add-comic"
                className="mt-2 px-5 py-2 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-colors"
              >
                {t('profile.addComic')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {myComics.map((c) => (
                <div key={c.id} className="flex flex-col gap-2">
                  <Link to={`/comic/${c.id}`} className="group">
                    <div className="aspect-3/4 w-full rounded-md overflow-hidden bg-gray-200 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={c.coverUrl || 'https://placehold.co/400x600'}
                        alt={c.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-primary text-sm leading-tight truncate mt-2">{c.title}</h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/add-comic?comic=${c.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-primary border border-primary/40 rounded-full px-2.5 py-1 hover:bg-primary hover:text-white transition-colors"
                    >
                      <Settings2 size={13} aria-hidden="true" /> {t('profile.manage')}
                    </Link>
                    <Link
                      to={`/comic/${c.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary transition-colors"
                    >
                      <Eye size={13} aria-hidden="true" /> {t('detail.readChapter')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Tab FAVORIT (Reader) — data sungguhan dari tabel favorites */
          <div className="flex flex-col gap-4">
            {favLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 animate-pulse">
                    <div className="aspect-3/4 w-full rounded-md bg-gray-300"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : favError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <p className="text-sm text-red-500">{t('common.loadError')}</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                  <Heart size={28} className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-primary">{t('profile.favoritesEmpty')}</h3>
                <p className="text-sm text-gray-600 max-w-sm">{t('profile.favoritesEmptyDesc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favorites.map((fav) => (
                  <Link key={fav.comicId} to={`/comic/${fav.comicId}`} className="flex flex-col gap-2 group">
                    <div className="aspect-3/4 w-full rounded-md overflow-hidden bg-gray-200 shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={fav.cover || 'https://placehold.co/400x600'}
                        alt={fav.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-primary text-sm leading-tight truncate">{fav.title}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const AccountSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-surface p-6 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
    <h3 className="font-bold text-xl text-primary w-full md:w-1/4 shrink-0">{title}</h3>
    <div className="flex-1 flex flex-col md:flex-row items-center w-full">
      {children}
    </div>
  </div>
);
