/**
 * Data dummy untuk konten fallback UI.
 *
 * Catatan (M2): autentikasi sudah memakai Supabase Auth, jadi kredensial
 * demo sudah dihapus dari sini.
 */
export const categories = [
  "ALL", "DRAMA", "FANTASI", "KERAJAAN", "ACTION", "ROMANCE", "SLICE OF LIFE", "HORROR", "THRILLER"
];

/**
 * Banner fallback hero. Banner dinamis dari data top manga
 * akan menggantikan ini setelah data API dimuat.
 */
export const heroBanners = [
  {
    id: 1,
    title: "Selamat datang di KomikinAja!",
    description: "Temukan ribuan judul manga, manhwa, dan manhua dari seluruh dunia. Update setiap hari!",
    cover: "https://dummyimage.com/800x400/1F2544/FFFFFF.png&text=KomikinAja",
    url: "/category"
  },
  {
    id: 2,
    title: "Jelajahi Kategori Favoritmu",
    description: "Action, romance, fantasi, horror — semua ada di sini. Cari judul favoritmu lewat halaman kategori.",
    cover: "https://dummyimage.com/800x400/212844/F4EFE6.png&text=Kategori",
    url: "/category"
  },
  {
    id: 3,
    title: "Komik dengan Rating Tertinggi",
    description: "Lihat daftar komik paling populer berdasarkan rating dari seluruh dunia.",
    cover: "https://dummyimage.com/800x400/1F2544/FFFFFF.png&text=Trending",
    url: "/trending"
  }
];

/** Poster kolom dekoratif di halaman login/register. */
export const loginColumn1 = [
  '/assets/Poster_2.jpeg',
  '/assets/Poster_7.jpeg',
  '/assets/Poster_8.jpeg',
  '/assets/Poster_4.jpeg',
  '/assets/Poster_2.jpeg',
  '/assets/Poster_7.jpeg',
  '/assets/Poster_8.jpeg',
  '/assets/Poster_4.jpeg',
];

export const loginColumn2 = [
  '/assets/Poster_3.jpeg',
  '/assets/Poster_6.jpeg',
  '/assets/Poster_5.jpeg',
  '/assets/Poster_9.jpeg',
  '/assets/Poster_3.jpeg',
  '/assets/Poster_6.jpeg',
  '/assets/Poster_5.jpeg',
  '/assets/Poster_9.jpeg',
];

export const loginColumn3 = [
  '/assets/Poster_1.jpeg',
  '/assets/Poster_10.jpeg',
  '/assets/Poster_11.jpeg',
  '/assets/Poster_12.jpeg',
  '/assets/Poster_13.jpeg',
  '/assets/Poster_1.jpeg',
  '/assets/Poster_10.jpeg',
  '/assets/Poster_11.jpeg',
  '/assets/Poster_13.jpeg',
];
