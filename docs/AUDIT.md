# Audit Fondasi (M1) — KomikinAja

Tanggal audit: 19 Okt 2026. Scope: seluruh rute, komponen, context, dan service yang ada di `src/`.
Dokumen ini adalah *baseline* status fitur sebelum milestone berikutnya. Tujuannya jujur: membedakan
mana yang **benar-benar berfungsi**, mana yang **parsial**, mana yang **hanya placeholder**, dan mana
yang **belum ada** — supaya tidak ada fitur palsu yang menyamar sebagai produksi (prinsip PRD).

Legenda status:

- **Berfungsi** — alur nyata, data nyata, state & error ditangani.
- **Parsial** — sebagian jalan, sebagian terblokir ketergantungan (mis. backend Supabase di M2).
- **Placeholder** — tampil sebagai "segera hadir"/disabled, tidak menyamar jadi data.
- **Belum ada** — belum direalisasikan sama sekali.

---

## Ringkasan Verifikasi (M1)

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| Typecheck | `tsc -b` | ✅ bersih |
| Lint | `eslint .` | ✅ 0 error / 0 warning |
| Unit test | `vitest run` | ✅ 15/15 lolos |
| Build | `vite build` | ✅ sukses (306 kB / 93 kB gzip) |

---

## Status per Rute

| Rute | Komponen | Status | Catatan |
| --- | --- | --- | --- |
| `/login` | `pages/Login.tsx` | Parsial | Login mock (kredensial demo). Google login **disabled** + label "Segera hadir". Akan diganti Supabase di M2. |
| `/register` | `pages/Register.tsx` | Parsial | Sama seperti login — mock sampai Supabase M2. Google disabled. |
| `/role-selection` | `pages/RoleSelection.tsx` | Berfungsi (lokal) | Pilihan reader/author disimpan ke context/session. `div`→`button` + `aria-pressed` sudah diperbaiki. |
| `/` (Beranda) | `pages/Home.tsx` | Berfungsi | 4 section data paralel dari Kitsu, banner dinamis dari top manga, skeleton, error+retry. |
| `/category` | `pages/Category.tsx` | Berfungsi | Filter kategori, sort terstruktur (label jujur), pencarian via URL, load-more, empty state, error+retry. |
| `/trending` | `pages/Trending.tsx` | Berfungsi | Di-label ulang "Rating Tertinggi" (bukan "tren mingguan" yang menyesatkan). Skeleton + error+retry. |
| `/comic/:id` | `pages/ComicDetail.tsx` | Berfungsi (metadata) | Detail + genre + penulis dari Kitsu. Episode/komentar dummy dihapus → empty state jujur. |
| `/read/:id/:episode` | `pages/ReadingMode.tsx` | Placeholder | Kitsu tidak menyediakan halaman komik. Menampilkan "konten tidak tersedia" + tombol kembali. Baca karya creator = M3+. |
| `/profile` | `pages/Profile.tsx` | Parsial | Fetch komik acak dihapus → empty state. Edit profil & toggle notif **disabled** ("Segera hadir"). |
| `/add-comic` | `pages/AddComic.tsx` | Placeholder | Notice jujur bahwa upload butuh backend (M3). Label `htmlFor` diperbaiki. Upload cover disabled. |

---

## Status per Komponen & Infrastruktur

| Area | File | Status | Catatan |
| --- | --- | --- | --- |
| Navbar | `components/Navbar.tsx` | Parsial | `aria-label` ditambahkan. Bell notifikasi **disabled** (belum ada data notif). |
| Footer | `components/Footer.tsx` | Berfungsi | Link nyata + i18n. |
| ComicCard / Skeleton | `components/ComicCard.tsx` | Berfungsi | Dipakai di Home/Category/Trending. |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Berfungsi | Dipasang per rute; satu halaman gagal tidak mematikan aplikasi. |
| AuthContext | `context/AuthContext.tsx` | Parsial | Mock auth via `sessionStorage`. Lazy initializer (tanpa setState di effect). Ganti Supabase M2. |
| LanguageContext | `context/LanguageContext.tsx` | Berfungsi | ±130 key ID/EN, persistensi `localStorage` (`komikinaja_language`), `t(key, params)`. |
| API service | `services/api.ts` | Berfungsi | Kitsu mapping (genres/authors/favorites dari `included`), tipe lengkap, flag `error`, retry untuk 429/5xx, tanpa `any`. |
| Tipe entitas | `types/comic.ts` | Berfungsi | `Comic`, `ComicGenre`, `ComicAuthor`, `PaginatedComics` terpusat. |
| Data dummy | `data/dummy.ts` | Berfungsi (terbatas) | Hanya `loginCredentials` demo, `heroBanners` generik, `categories`. Episode/pages/comments dummy dihapus. |

---

## Label yang Diperbaiki (Anti-Placeholder Palsu)

| Sebelum (menyesatkan) | Sesudah (jujur) |
| --- | --- |
| "Trending Minggu Ini" | "Komik dengan Rating Tertinggi" |
| Sort "Berdasarkan jumlah like" | "Rating Tertinggi" (`-averageRating`) |
| Chapter/komentar dummy di detail | Empty state: "belum tersedia" |
| Halaman baca dengan gambar palsu | "Konten tidak tersedia" |

---

## Fitur Disabled ("Segera Hadir") — Menunggu Milestone Berikutnya

| Fitur | Menunggu | Milestone |
| --- | --- | --- |
| Login/Register Google | Supabase Auth | M2 |
| Login/Register email | Supabase Auth | M2 |
| Bell notifikasi | Tabel notifikasi + real-time | M4 |
| Edit profil | Supabase profiles | M2/M4 |
| Toggle notif | Prefs notifikasi | M4 |
| Upload cover / tambah komik | Supabase Storage + DB | M3 |
| Mode baca karya creator | Storage gambar + chapter | M3 |
| Komentar | Tabel komentar | M4 |
| Follow creator | Tabel follow | M4 |
| Dashboard admin/moderasi | RBAC + tabel moderasi | M5 |
| Analitik kreator | Agregasi data | M5 |

---

## Keterbatasan Teknis yang Diketahui

- **Kitsu API** = katalog metadata saja. Tidak menyediakan halaman komik/chapter/komentar. Sumber konten baca hanya untuk karya creator (M3+).
- **Auth masih mock**: `reader@komikinaja.com` / `author@komikinaja.com` dengan `password123` (lihat `data/dummy.ts`). Bukan produksi — diganti Supabase di M2.
- **EBADENGINE warning** saat `npm install` untuk eslint (Node v22.12.0) — tidak fatal, tidak mempengaruhi build/lint/test.
- **8 vulnerabilities lama** di `npm audit` — di luar scope M1, akan ditangani saat update dependency di milestone lanjutan.
- **Rule eslint ketat** (`react-hooks/set-state-in-effect`, `react-refresh/only-export-components`) sudah dipenuhi: pola fetch dipindah ke callback async + `reloadKey`, context file diberi disable terarah dengan alasan.
