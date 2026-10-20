import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  listAllUsers,
  setUserBan,
  listAllComics,
  setComicHidden,
  type AdminUser,
  type AdminComic,
} from '../services/admin';
import { ShieldBan, ShieldCheck, EyeOff, Eye, Users, BookOpen, AlertCircle } from 'lucide-react';

export const Admin: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [comics, setComics] = useState<AdminComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Muat dua daftar moderasi secara paralel.
  useEffect(() => {
    let cancelled = false;
    Promise.all([listAllUsers(), listAllComics()]).then(([u, c]) => {
      if (cancelled) return;
      setUsers(u.data);
      setComics(c.data);
      setError(u.error || c.error);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleBan = async (target: AdminUser) => {
    setBusyId(target.id);
    setActionError('');
    const { error: err } = await setUserBan(target.id, !target.isBanned);
    if (err) setActionError(err);
    setBusyId(null);
    setReloadKey((k) => k + 1);
  };

  const handleHide = async (comic: AdminComic) => {
    setBusyId(comic.id);
    setActionError('');
    const { error: err } = await setComicHidden(comic.id, !comic.hidden);
    if (err) setActionError(err);
    setBusyId(null);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-left">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-heading text-primary">{t('admin.title')}</h1>
          <p className="text-sm text-gray-600">{t('admin.subtitle')}</p>
        </header>

        {actionError && (
          <p role="alert" className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {actionError}
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="h-8 bg-gray-300 rounded w-1/4 animate-pulse"></div>
            <div className="h-40 bg-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-40 bg-gray-300 rounded-xl animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 font-semibold">
            <AlertCircle size={20} aria-hidden="true" />
            {t('common.loadError')}
          </div>
        ) : (
          <>
            {/* ===================== Daftar blokir pengguna ===================== */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Users size={20} aria-hidden="true" />
                {t('admin.usersTitle')}
              </h2>
              <div className="bg-surface/70 border border-primary/10 rounded-xl divide-y divide-primary/10">
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-primary truncate">
                          {u.username}
                          {isSelf && <span className="ml-2 text-xs font-bold text-gray-400">({t('admin.you')})</span>}
                        </span>
                        <span className="text-xs text-gray-500">
                          {u.role ?? t('admin.noRole')} · {u.isAdmin ? t('admin.roleAdmin') : t('admin.roleUser')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBan(u)}
                        disabled={busyId === u.id || isSelf}
                        title={isSelf ? t('admin.cannotBanSelf') : undefined}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                          u.isBanned
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {u.isBanned ? <ShieldCheck size={15} aria-hidden="true" /> : <ShieldBan size={15} aria-hidden="true" />}
                        {u.isBanned ? t('admin.unban') : t('admin.ban')}
                      </button>
                    </div>
                  );
                })}
                {users.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-500">{t('common.empty')}</p>
                )}
              </div>
            </section>

            {/* ===================== Moderasi konten ===================== */}
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <BookOpen size={20} aria-hidden="true" />
                {t('admin.comicsTitle')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {comics.map((c) => (
                  <div key={c.id} className="bg-surface/70 border border-primary/10 rounded-xl p-4 flex gap-4 items-center">
                    <div className="w-16 h-24 rounded-md overflow-hidden bg-gray-200 shrink-0">
                      <img
                        src={c.coverUrl || 'https://placehold.co/400x600'}
                        alt={c.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <span className="font-bold text-primary truncate">{c.title}</span>
                      <span className="text-xs text-gray-500">{t('admin.by')} {c.authorName}</span>
                      <span className={`text-xs font-bold ${c.hidden ? 'text-amber-600' : 'text-green-600'}`}>
                        {c.hidden ? t('admin.hidden') : t('admin.visible')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleHide(c)}
                        disabled={busyId === c.id}
                        className={`mt-1 self-start px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                          c.hidden
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {c.hidden ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
                        {c.hidden ? t('admin.show') : t('admin.hide')}
                      </button>
                    </div>
                  </div>
                ))}
                {comics.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-full">{t('admin.noComics')}</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};
