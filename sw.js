// Precep — funciona offline. Troque VERSAO a cada deploy da casca.
const VERSAO = 'precep-v2';
const ARQS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin && !CDN.includes(u.hostname)) return; // Supabase e Worker nunca passam pelo cache
  e.respondWith(fetch(e.request).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: u.origin === location.origin }).then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
