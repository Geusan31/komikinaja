# PRD — KomikinAja
**Platform Baca Komik Online (Manga · Manhwa · Manhua)**

Versi: 1.0 · Tanggal: 19 Okt 2026 · Status: Draft untuk review
Tech stack saat ini: React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router v7 · Kitsu API · Deploy Vercel

---

## R — RECAP (Ringkasan)

**KomikinAja** adalah aplikasi web baca komik gratis berbahasa Indonesia yang mengintegrasikan katalog manga/manhwa/manhua dari API publik Kitsu, dengan sistem akun dua peran (**Pembaca** dan **Author**), pencarian & filter genre, halaman baca komik, serta fitur komunitas (komentar).

**Kondisi saat ini (berdasarkan analisis kode):**

| Aspek | Kondisi |
|---|---|
| Katalog | ✅ Nyata — data live dari Kitsu API, dengan retry 3× (backoff) untuk error 429/5xx, filter SFW, dan ban-list sampul tertentu |
| Halaman utama | ✅ Hero carousel auto-slide 5 detik, 4 section rekomendasi, pencarian |
| Jelajah | ✅ Trending, Kategori (8 genre + 3 opsi urutan + load more + pagination) |
| Detail komik | ⚠️ Sebagian — data dari API, tapi daftar episode & komentar masih **dummy** |
| Mode baca | ⚠️ Placeholder — gambar halaman masih dummyimage (Kitsu tidak menyediakan halaman komik) |
| Autentikasi | ⚠️ Simulasi — 2 akun dummy hard-coded + login Google palsu, sesi di sessionStorage |
| Profil & favorit | ⚠️ Sebagian — daftar "favorit/komik saya" masih mengambil list acak dari API, bukan data user sungguhan |
| Tambah komik (Author) | ⚠️ Simulasi — form submit hanya `alert()` lalu redirect |
| i18n | ⚠️ Parsial — toggle ID/EN aktif, tapi baru sebagian kecil string yang terjemah |
| Kualitas teknis | ⚠️ Tanpa test, tanpa error boundary, ada `any` di banyak tempat, beberapa elemen interaktif belum aksesibel |

**Pengguna saat ini:** wajib login (ProtectedRoute di semua halaman utama) → pilih role → baru bisa akses konten.

---

## A — ASK (Tujuan & Permintaan)

### Problem statement
Pembaca komik di Indonesia kesulitan menemukan satu tempat yang **ringan, cepat, gratis, dan berbahasa Indonesia** untuk menelusuri judul populer lintas platform (manga/manhwa/manhua). Sementara itu, tool baca komik yang ada umumnya berantakan secara UX (iklan menutupi konten, navigasi chapter membingungkan, tidak responsif) atau tidak memberi ruang bagi kreator lokal untuk menerbitkan karya.

### Goals (yang ingin dicapai)
1. **G1 — Temukan cepat:** pengguna dapat menemukan judul yang diminati dalam ≤ 30 detik lewat pencarian atau filter genre.
2. **G2 — Baca nyaman:** pengguna dapat membaca chapter dengan navigasi jelas (prev/next, zoom, posisi terakhir) tanpa kebingungan.
3. **G3 — Kembali lagi:** pengguna memiliki alasan kembali — favorit, notifikasi update, dan progres baca yang tersimpan.
4. **G4 — Kreator terlibat:** Author dapat menerbitkan karya dan memantau performanya.
5. **G5 — Kredibel & aman:** autentikasi sungguhan, data pengguna aman, konten tetap SFW.

### Non-goals (di luar lingkup)
- Tidak menjadi platform berbayar/langganan (freemium belum dipertimbangkan di v1).
- Tidak memuat/menghosting file komik bajakan — hanya metadata katalog + konten yang berlisensi/karya author sendiri.
- Tidak membangun aplikasi native mobile (web dulu, PWA boleh menyusul).

### Success metrics
| Metrik | Target |
|---|---|
| Task success — cari & buka komik | ≥ 90% pengguna berhasil tanpa bantuan |
| Task success — baca 1 chapter sampai selesai | ≥ 85% |
| SUS (System Usability Scale) | ≥ 75 |
| First Contentful Paint (4G) | < 2,5 detik |
| Pendaftaran → baca pertama | < 3 menit |
| Return user (7 hari) | ≥ 30% |

---

## C — CONTEXT (Latar Belakang & Analisis)

### C.1 Pengguna & Persona

**Persona 1 — "Rina" (Pembaca, 19 th, mahasiswa)**
- Baca komik di sela kuliah, sering di HP.
- Butuh: pencarian cepat, tahu chapter terbaru, lanjut baca dari terakhir berhenti.
- Frustrasi: sulit ingat judul, iklan berlebihan, situs tidak responsif.

**Persona 2 — "Dimas" (Author, 24 th, ilustrator freelance)**
- Ingin karyanya dibaca banyak orang tanpa repot urus hosting.
- Butuh: upload karya, lihat jumlah pembaca/follower, umpan balik pembaca.
- Frustrasi: platform besar membuat karya kecil tenggelam.

**Persona 3 — "Budi" (Pembaca kasual, 30 th, pekerja kantoran)**
- Sesekali baca, tidak mau repot daftar.
- Butuh: akses cepat, mode malam, hemat kuota.

### C.2 Perilaku & kebutuhan lintas persona
| Kebutuhan | Rina | Dimas | Budi |
|---|---|---|---|
| Akses cepat tanpa perlu tutorial | ✔ | — | ✔ |
| Notifikasi update chapter favorit | ✔ | ✔ | — |
| Simpan progres baca | ✔ | — | ✔ |
| Analitik karya | — | ✔ | — |
| Mode hemat data / ringan | ✔ | — | ✔ |

### C.3 Analisis kondisi teknis (temuan dari code review)

**Kekuatan yang sudah ada**
- Struktur rapi: `pages/`, `components/`, `context/`, `services/`, `data/` — mudah dikembangkan.
- Design system sudah terdefine di `src/index.css` (`--color-primary #1F2544`, `--color-background #F4EFE6`, `--color-surface #EAE3D2`, font Outfit).
- Loading state memakai **skeleton** (bukan spinner) → persepsi performa lebih baik.
- API service sudah tangguh: retry dengan backoff, mapping data konsisten, fallback placeholder.
- SEO lengkap (Open Graph, Twitter Card, canonical, meta description ID).
- Mobile menu sudah ada; halaman kategori punya sticky filter.

**Gap / risiko yang harus ditangani (dari kode)**
1. **Autentikasi palsu** — kredensial hard-coded di `src/data/dummy.ts`, tersimpan di `sessionStorage`, tanpa validasi server. Rentan dan tidak layak produksi.
2. **Konten baca placeholder** — `ReadingMode` menampilkan gambar dummy; `ComicDetail` memakai episode/komentar dummy (`dummyEpisodes`, `dummyComments`). UX terlihat "bohong" dan tidak ada data nyata.
3. **Favorit & "komik saya" tidak nyata** — `Profile` mengambil 8 komik acak dari API, bukan preferensi user.
4. **Fitur Author tidak berfungsi** — `AddComic` hanya simulasi; tidak ada penyimpanan.
5. **i18n setengah jadi** — toggle bahasa hanya menerjemahkan sebagian label; campur ID/EN dalam satu layar (mis. "104 Komen" tetap Indonesia).
6. **Aksesibilitas** — kartu pilih role memakai `div onClick` tanpa `role="button"`/`tabIndex`/keyboard handler; tombol zoom sudah punya `aria-label` tapi elemen lain belum; kontras teks `text-gray-300` di atas hero perlu dicek.
7. **Kualitas kode** — banyak `any`, tanpa unit test, tanpa error boundary (1 API error bisa membuat blank screen), tanpa feedback rate-limit (user hanya melihat skeleton lama).
8. **Ketergantungan API pihak ketiga** — Kitsu bisa berubah kebijakan/melakukan rate limit; perlu caching.

### C.4 Pertimbangan HCI
- **Visibility of system status:** skeleton loading sudah bagus; tambahkan indikasi "retrying" saat 429.
- **Match dengan dunia nyata:** label hybrid ID/EN harus konsisten.
- **User control & freedom:** tombol Kembali di mode baca sudah ada — pertahankan.
- **Consistency & standards:** standarisasi semua komponen pakai `Button`/`Input` yang sudah ada (form AddComic masih manual).
- **Error prevention:** form AddComic dan komentar perlu validasi + konfirmasi sebelum submit.

---

## E — EXECUTION (Rencana Pelaksanaan)

### E.1 Fitur per peran

**Pembaca (Reader)**
| # | Fitur | Prioritas |
|---|---|---|
| F1 | Login/Register (email + Google) sungguhan | **Must** |
| P1 | Pencarian + filter genre + urutkan (populer/rating/tanggal) | Must *(sudah ada, poles)* |
| P2 | Katalog trending & rekomendasi personal | Should |
| P3 | Simpan favorit & notifikasi update chapter | Must |
| P4 | Mode baca: zoom, prev/next chapter, ingat posisi, mode malam | Must |
| P5 | Komentar & like per chapter | Should |
| P6 | Riwayat baca | Could |

**Author**
| # | Fitur | Prioritas |
|---|---|---|
| A1 | Upload & terbitkan karya (judul, deskripsi, genre, cover, chapter) | Must |
| A2 | Dashboard karya: jumlah pembaca, follower, chapter populer | Should |
| A3 | Edit/hapus karya & jadwal rilis | Could |
| A4 | Balas komentar pembaca | Could |

**Admin (internal)**
| # | Fitur | Prioritas |
|---|---|---|
| S1 | Moderasi konten & ban-list (lanjutan dari mekanisme ban-list yang sudah ada) | Should |
| S2 | Manajemen user/role | Could |

### E.2 Non-functional requirements
- **Performa:** lazy-load route (`React.lazy`), caching respons API (localStorage/IndexedDB dengan TTL), `loading="lazy"` untuk gambar sampul.
- **Keamanan:** pindahkan auth ke backend (mis. Supabase/Firebase), jangan pernah hard-code kredensial di klien, sanitasi input komentar, HTTPS-only cookie.
- **Aksesibilitas:** semua kontrol interaktif keyboard-operable, `aria-label` lengkap, kontras ≥ 4.5:1, uji dengan screen reader.
- **i18n:** selesaikan seluruh string ID/EN (target: 100% terjemah) — manfaatkan kerangka yang sudah ada di `LanguageContext`.
- **Responsif:** uji 360px–1440px; mode baca harus nyaman di portrait HP.
- **Reliabilitas:** error boundary per route, pesan "coba lagi saat ini" saat API down, offline fallback.

### E.3 Arsitektur & data (target)

```
Frontend (React SPA, sudah ada)
   │
   ├── Kitsu API (katalog metadata — sudah terintegrasi)
   │
   └── Backend BaaS (baru: auth, DB, storage)
         ├── tabel: users, comics, chapters, favorites,
         │          comments, reading_progress, analytics
         └── storage: cover & halaman komik (untuk karya author)
```

### E.4 Milestone
| Milestone | Isi | Durasi |
|---|---|---|
| **M1 — Fondasi** | Error boundary, perapian `any` → tipe, i18n lengkap, perbaikan aksesibilitas, test dasar | 2 minggu |
| **M2 — Akun nyata** | Backend auth (email + Google), migrasi dari sessionStorage, profil & favorit sungguhan | 3 minggu |
| **M3 — Baca & komunitas** | Mode baca dengan konten berlisensi/karya author, progres baca, komentar nyata | 4 minggu |
| **M4 — Ekosistem author** | Upload karya, dashboard analitik, moderasi | 4 minggu |
| **M5 — Growth** | PWA, notifikasi push, rekomendasi berbasis riwayat | 3 minggu |

### E.5 Risiko & mitigasi
| Risiko | Dampak | Mitigasi |
|---|---|---|
| Perubahan/rate limit Kitsu API | Katalog kosong | Caching + fallback ke data lokal; siapkan API cadangan |
| Isu hak cipta konten komik | Legal | Hanya metadata + konten berlisensi/karya author; lanjutkan mekanisme ban-list |
| Scope creep fitur author | Keterlambatan | Kunci prioritas MoSCoW di E.1; fitur Could ditunda |
| Autentikasi baru mengubah banyak kode | Regresi | Adapter pattern di `AuthContext` agar interface tetap sama |

### E.6 Pertanyaan terbuka (perlu keputusan)
1. Pakai BaaS mana — **Supabase**, **Firebase**, atau backend custom?
2. Sumber konten chapter untuk katalog populer: hanya karya author, atau ada perjanjian lisensi tertentu?
3. Apakah notifikasi update chapter cukup via email, atau butuh push notification?
4. Target utama rilis: mobile web dulu, atau desktop setara?
