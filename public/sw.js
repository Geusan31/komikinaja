/**
 * Service worker KomikinAja (PWA) — ditulis tangan tanpa dependency.
 *
 * Strategi:
 *  - Navigasi (HTML) : network-first  -> selalu index.html segar saat online,
 *                       fallback cache saat offline (SPA shell).
 *  - Aset same-origin : cache-first    -> JS/CSS/gambar ber-hash bersifat imutabel.
 *  - Cross-origin     : network-only   -> Kitsu & Supabase tidak pernah di-cache
 *                       (menghindari data basi & kebocoran data pengguna).
 */

const CACHE_VERSION = 'komikinaja-v1';
const STATIC_CACHE = `komikinaja-static-${CACHE_VERSION}`;
const INDEX_CACHE_KEY = '/index.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Lewati semua request lintas-origin (Kitsu, Supabase, Google Fonts, gambar eksternal).
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman: network-first dengan fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(INDEX_CACHE_KEY, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(INDEX_CACHE_KEY)
            .then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  // Aset same-origin: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'same-origin') {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
