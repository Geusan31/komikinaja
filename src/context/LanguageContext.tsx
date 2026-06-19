import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Language = 'id' | 'en';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  id: {
    'nav.recommendation': 'Rekomendasi',
    'nav.trending': 'Trending',
    'nav.category': 'Kategori',
    
    'profile.comic': 'Komik',
    'profile.favorite': 'Favorit',
    'profile.account': 'Akun',
    'profile.addComic': '+ Tambah Komik Baru',
    'profile.loginWith': 'Login dengan',
    'profile.nickname': 'Nama Panggilan',
    'profile.settings': 'Pengaturan',
    'profile.changeEmail': 'Ganti Email',
    'profile.notif': 'Notifikasi Komik Favorit',
    'profile.bestComment': 'Komentar Terbaik',
    'profile.changeRole': 'Ganti Role',
    'profile.chooseLanguage': 'Pilih Bahasa',
    'profile.promo': 'Kode Promosi',
    'profile.promoDesc': 'Silahkan klik tombol di kanan untuk mengisi Kode Promosi',
    'profile.fillPromo': 'Isi Kode Promosi',
    'profile.logout': 'Keluar',
    
    'home.heroBtn': 'Lihat Komik',
    'home.searchPlaceholder': 'Mencari...',
    'home.recommendation': 'Rekomendasi Untuk kamu!',
    'home.latestUpdate': 'Terakhir Update',
    'home.viewMore': 'Lihat Lebih Banyak'
  },
  en: {
    'nav.recommendation': 'Recommendations',
    'nav.trending': 'Trending',
    'nav.category': 'Categories',
    
    'profile.comic': 'Comics',
    'profile.favorite': 'Favorites',
    'profile.account': 'Account',
    'profile.addComic': '+ Add New Comic',
    'profile.loginWith': 'Login with',
    'profile.nickname': 'Nickname',
    'profile.settings': 'Settings',
    'profile.changeEmail': 'Change Email',
    'profile.notif': 'Favorite Comic Notifications',
    'profile.bestComment': 'Best Comments',
    'profile.changeRole': 'Change Role',
    'profile.chooseLanguage': 'Choose Language',
    'profile.promo': 'Promo Code',
    'profile.promoDesc': 'Please click the button on the right to enter a Promo Code',
    'profile.fillPromo': 'Enter Promo Code',
    'profile.logout': 'Log Out',
    
    'home.heroBtn': 'Read Comic',
    'home.searchPlaceholder': 'Searching...',
    'home.recommendation': 'Recommendations For You!',
    'home.latestUpdate': 'Latest Updates',
    'home.viewMore': 'View More'
  }
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
