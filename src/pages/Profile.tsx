import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { Edit2, BookOpen, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout, setRole } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const isAuthor = user?.role === 'author';
  const [activeTab, setActiveTab] = useState(isAuthor ? 'KOMIK' : 'FAVORIT');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangeRole = () => {
    setRole(isAuthor ? 'reader' : 'author');
    setActiveTab(!isAuthor ? 'KOMIK' : 'FAVORIT');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-left">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start pb-8 border-b-2 border-gray-300">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
              <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <span
              title={t('common.soon')}
              className="absolute bottom-0 right-0 bg-white p-2 rounded-full border border-gray-300 shadow-sm opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              <Edit2 size={16} className="text-primary" aria-hidden="true" />
            </span>
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
              onClick={() => setActiveTab(isAuthor ? 'KOMIK' : 'FAVORIT')}
              aria-pressed={activeTab !== 'AKUN'}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${
                activeTab !== 'AKUN' ? 'text-primary border-b-4 border-primary' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {isAuthor ? t('profile.comic') : t('profile.favorite')}
            </button>
            <button
              onClick={() => setActiveTab('AKUN')}
              aria-pressed={activeTab === 'AKUN'}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${
                activeTab === 'AKUN' ? 'text-primary border-b-4 border-primary' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('profile.account')}
            </button>
          </div>

          {isAuthor && activeTab === 'KOMIK' && (
            <Link to="/add-comic" className="px-4 py-2 border-2 border-primary text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-colors mb-2">
              {t('profile.addComic')}
            </Link>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'AKUN' ? (
          <div className="flex flex-col gap-6">
            <AccountSection title={t('profile.loginWith')}>
              <div className="flex items-center gap-2 text-primary font-bold">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
                {user?.name}
              </div>
            </AccountSection>

            <AccountSection title={t('profile.nickname')}>
              <div className="flex justify-between items-center w-full text-sm font-bold text-primary">
                <span>{user?.name}</span>
                <button
                  disabled
                  title={t('common.soon')}
                  className="px-4 py-1 border border-gray-400 rounded-full opacity-50 cursor-not-allowed"
                >
                  {t('profile.edit')}
                </button>
              </div>
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
        ) : (
          /* Komik / Favorit Tab — data backend belum tersedia, tampilkan empty state jujur */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
              {isAuthor ? (
                <BookOpen size={28} className="text-primary" aria-hidden="true" />
              ) : (
                <Heart size={28} className="text-primary" aria-hidden="true" />
              )}
            </div>
            <h3 className="text-xl font-bold text-primary">
              {isAuthor ? t('profile.comicsEmpty') : t('profile.favoritesEmpty')}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm">
              {isAuthor ? t('profile.comicsEmptyDesc') : t('profile.favoritesEmptyDesc')}
            </p>
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
