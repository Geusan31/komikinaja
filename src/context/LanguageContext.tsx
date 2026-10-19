/* eslint-disable react-refresh/only-export-components --
   Pola React context idiomatik: Provider (komponen) dan hook useLanguage
   di file yang sama agar konteksnya mudah ditemukan. Rule ini hanya
   peduli pada fast-refresh/HMR, bukan kualitas kode. */
import React, { createContext, useContext, useState, useEffect } from 'react';

import type { ReactNode } from 'react';

type Language = 'id' | 'en';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

const STORAGE_KEY = 'komikinaja_language';

/** Export untuk unit test kelengkapan terjemahan. */
export const translations: Translations = {
  id: {
    'nav.recommendation': 'Rekomendasi',
    'nav.trending': 'Trending',
    'nav.category': 'Kategori',
    'nav.notifications': 'Notifikasi',
    'nav.menu': 'Menu',
    'nav.closeMenu': 'Tutup menu',

    'common.retry': 'Coba Lagi',
    'common.back': 'Kembali',
    'common.loading': 'Memuat...',
    'common.loadError': 'Gagal memuat data. Periksa koneksi internetmu.',
    'common.empty': 'Tidak ada data tersedia.',
    'common.soon': 'Segera hadir',
    'common.notFound': 'Tidak ditemukan',

    'home.heroBtn': 'Lihat Komik',
    'home.searchPlaceholder': 'Mencari...',
    'home.recommendation': 'Rekomendasi Untuk kamu!',
    'home.latestUpdate': 'Terakhir Update',
    'home.shounen': 'Shounen Manga Top 10',
    'home.fantasy': 'Fantasi Manga Top 10',
    'home.viewMore': 'Lihat Lebih Banyak',

    'category.title': 'Kategori',
    'category.count': '{count} Serial Ditampilkan',
    'category.sortPopular': 'Popularitas',
    'category.sortRating': 'Rating Tertinggi',
    'category.sortDate': 'Tanggal Terbaru',
    'category.notFound': "'{query}' Tidak Ditemukan",

    'trending.title': 'Komik dengan Rating Tertinggi',
    'trending.subtitle': 'Daftar komik paling tinggi ratingnya di Kitsu.',
    'trending.empty': 'Belum ada data komik populer.',

    'detail.author': 'Penulis',
    'detail.unknownAuthor': 'Tidak diketahui',
    'detail.views': 'Pembaca',
    'detail.favorites': 'Favorit',
    'detail.notFound': 'Komik tidak ditemukan.',
    'detail.chapters': 'Daftar Chapter',
    'detail.noChapters': 'Chapter belum tersedia di KomikinAja.',
    'detail.noChaptersDesc':
      'Komik dari katalog Kitsu hanya menampilkan informasi. Chapter bisa dibaca jika diterbitkan oleh creator di KomikinAja.',
    'detail.comments': 'Komentar',
    'detail.commentsSoon': 'Komentar akan tersedia setelah sistem akun dan backend terintegrasi.',
    'detail.synopsisEmpty': 'Tidak ada sinopsis tersedia.',
    'detail.addFavorite': 'Tambah ke Favorit',
    'detail.removeFavorite': 'Hapus dari Favorit',

    'read.notAvailableTitle': 'Konten chapter ini belum tersedia.',
    'read.notAvailableDesc':
      'Komik dari katalog Kitsu hanya menampilkan informasi. Kamu bisa membaca karya creator yang diterbitkan di KomikinAja.',
    'read.backToDetail': 'Kembali ke Detail Komik',

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
    'profile.edit': 'Edit',
    'profile.save': 'Simpan',
    'profile.comicsEmpty': 'Belum ada komik yang diterbitkan.',
    'profile.comicsEmptyDesc': 'Komik yang kamu terbitkan akan muncul di sini.',
    'profile.favoritesEmpty': 'Belum ada komik favorit.',
    'profile.favoritesEmptyDesc': 'Tambahkan komik ke favorit agar mudah ditemukan lagi.',
    'profile.defaultBio': 'Belum ada bio.',

    'login.title': 'Selamat Datang\nKembali!',
    'login.subtitle':
      'Masuk untuk melanjutkan bacaan favoritmu dan jelajahi ribuan koleksi manga terbaru',
    'login.remember': 'Ingat saya',
    'login.forgot': 'Lupa Sandi?',
    'login.signIn': 'Sign In',
    'login.google': 'Masuk dengan Google',
    'login.googleSoon': 'Masuk dengan Google (segera hadir)',
    'login.noAccount': 'Belum punya akun?',
    'login.registerLink': 'Buat akun baru',
    'login.error': 'Email atau password salah.',

    'register.title': 'Mulai Petualanganmu\ndi KomikinAja!',
    'register.subtitle': 'Daftar sekarang untuk akses ribuan koleksi manga, manhwa, dan manhua terpopuler.',
    'register.fullName': 'Nama Panjang',
    'register.email': 'Alamat email',
    'register.password': 'Sandi',
    'register.terms': 'Saya menyetujui Syarat & Ketentuan',
    'register.signUp': 'Sign up',
    'register.google': 'Daftar dengan Google',
    'register.googleSoon': 'Daftar dengan Google (segera hadir)',
    'register.haveAccount': 'Sudah punya akun?',
    'register.signInLink': 'Sign in',
    'register.checkEmail': 'Pendaftaran berhasil! Kami telah mengirim email konfirmasi — buka inbox kamu untuk mengaktifkan akun.',

    'role.title': 'Kamu mau jadi apa di KomikinAja?',
    'role.subtitle': 'Pilih peran yang sesuai kamu banget! Kamu bisa mengubahnya kapan saja di pengaturan.',
    'role.readerTitle': 'Pembaca',
    'role.readerDesc': 'Nikmati ribuan komik, manga, manhwa, dan manhua dari seluruh dunia.',
    'role.authorTitle': 'Author',
    'role.authorDesc': 'Publikasikan karya kamu dan bangun basis pembaca yang loyal.',
    'role.continue': 'Lanjutkan',

    'addComic.title': 'Tambah Komik Baru',
    'addComic.soonNotice':
      'Formulir ini masih tahap awal. Komik belum dapat disimpan sampai backend terintegrasi.',
    'addComic.cover': 'Sampul Komik',
    'addComic.titleField': 'Judul',
    'addComic.description': 'Deskripsi',
    'addComic.language': 'Bahasa',
    'addComic.rating': 'Rating',
    'addComic.upload': 'Unggah karya (dalam bentuk pdf)',
    'addComic.submit': 'Submit',

    'footer.tagline': 'Tempat komik buat warga Indonesia dan sekitarnya, update terus tiap hari.',
    'footer.explore': 'JELAJAHI',
    'footer.platform': 'PLATFORM',
    'footer.contact': 'Hubungi Kami',
  },
  en: {
    'nav.recommendation': 'Recommendations',
    'nav.trending': 'Trending',
    'nav.category': 'Categories',
    'nav.notifications': 'Notifications',
    'nav.menu': 'Menu',
    'nav.closeMenu': 'Close menu',

    'common.retry': 'Retry',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.loadError': 'Failed to load data. Check your internet connection.',
    'common.empty': 'No data available.',
    'common.soon': 'Coming soon',
    'common.notFound': 'Not found',

    'home.heroBtn': 'Read Comic',
    'home.searchPlaceholder': 'Searching...',
    'home.recommendation': 'Recommendations For You!',
    'home.latestUpdate': 'Latest Updates',
    'home.shounen': 'Top 10 Shounen Manga',
    'home.fantasy': 'Top 10 Fantasy Manga',
    'home.viewMore': 'View More',

    'category.title': 'Categories',
    'category.count': '{count} Series Shown',
    'category.sortPopular': 'Popularity',
    'category.sortRating': 'Highest Rating',
    'category.sortDate': 'Newest',
    'category.notFound': "'{query}' Not Found",

    'trending.title': 'Highest Rated Comics',
    'trending.subtitle': 'Comics with the highest average rating on Kitsu.',
    'trending.empty': 'No popular comics yet.',

    'detail.author': 'Author',
    'detail.unknownAuthor': 'Unknown',
    'detail.views': 'Readers',
    'detail.favorites': 'Favorites',
    'detail.notFound': 'Comic not found.',
    'detail.chapters': 'Chapter List',
    'detail.noChapters': 'Chapters are not available on KomikinAja yet.',
    'detail.noChaptersDesc':
      'Comics from the Kitsu catalog only show information. Chapters can be read when published by creators on KomikinAja.',
    'detail.comments': 'Comments',
    'detail.commentsSoon': 'Comments will be available after the account system and backend are integrated.',
    'detail.synopsisEmpty': 'No synopsis available.',
    'detail.addFavorite': 'Add to Favorites',
    'detail.removeFavorite': 'Remove from Favorites',

    'read.notAvailableTitle': 'This chapter content is not available yet.',
    'read.notAvailableDesc':
      'Comics from the Kitsu catalog only show information. You can read creator works published on KomikinAja.',
    'read.backToDetail': 'Back to Comic Detail',

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
    'profile.edit': 'Edit',
    'profile.save': 'Save',
    'profile.comicsEmpty': 'No comics published yet.',
    'profile.comicsEmptyDesc': 'Comics you publish will appear here.',
    'profile.favoritesEmpty': 'No favorite comics yet.',
    'profile.favoritesEmptyDesc': 'Add comics to favorites to find them easily later.',
    'profile.defaultBio': 'No bio yet.',

    'login.title': 'Welcome\nBack!',
    'login.subtitle': 'Log in to continue your favorite reads and explore thousands of the latest manga collections',
    'login.remember': 'Remember me',
    'login.forgot': 'Forgot Password?',
    'login.signIn': 'Sign In',
    'login.google': 'Sign in with Google',
    'login.googleSoon': 'Sign in with Google (coming soon)',
    'login.noAccount': "Don't have an account?",
    'login.registerLink': 'Create a new account',
    'login.error': 'Email or password is incorrect.',

    'register.title': 'Start Your Adventure\non KomikinAja!',
    'register.subtitle': 'Sign up now to access thousands of the most popular manga, manhwa, and manhua collections.',
    'register.fullName': 'Full Name',
    'register.email': 'Email address',
    'register.password': 'Password',
    'register.terms': 'I agree to the Terms & Conditions',
    'register.signUp': 'Sign up',
    'register.google': 'Sign up with Google',
    'register.googleSoon': 'Sign up with Google (coming soon)',
    'register.haveAccount': 'Already have an account?',
    'register.signInLink': 'Sign in',
    'register.checkEmail': "Registration successful! We've sent a confirmation email — open your inbox to activate your account.",

    'role.title': 'What do you want to be on KomikinAja?',
    'role.subtitle': 'Pick the role that suits you best! You can change it anytime in settings.',
    'role.readerTitle': 'Reader',
    'role.readerDesc': 'Enjoy thousands of comics, manga, manhwa, and manhua from around the world.',
    'role.authorTitle': 'Author',
    'role.authorDesc': 'Publish your work and build a loyal readership.',
    'role.continue': 'Continue',

    'addComic.title': 'Add New Comic',
    'addComic.soonNotice':
      'This form is still in early stage. Comics cannot be saved until the backend is integrated.',
    'addComic.cover': 'Comic Cover',
    'addComic.titleField': 'Title',
    'addComic.description': 'Description',
    'addComic.language': 'Language',
    'addComic.rating': 'Rating',
    'addComic.upload': 'Upload your work (PDF)',
    'addComic.submit': 'Submit',

    'footer.tagline': 'Comics for Indonesians and neighbors, updated every day.',
    'footer.explore': 'EXPLORE',
    'footer.platform': 'PLATFORM',
    'footer.contact': 'Contact Us',
  },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'id';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'id';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  /**
   * Ambil terjemahan berdasarkan key. `params` untuk placeholder
   * sederhana, mis. t('category.count', { count: 12 }) → "12 Serial Ditampilkan".
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations.id[key] || key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replace(`{${name}}`, String(value));
      }
    }
    return text;
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
