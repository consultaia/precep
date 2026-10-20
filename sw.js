// Precep — funciona offline. Troque VERSAO a cada deploy da casca.
const VERSAO = 'precep-v7';
const ARQS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const comTempo = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
// cache:'reload' para não guardar um index.html velho vindo do cache HTTP (o Pages manda max-age=600)
self.addEventListener('install', e => e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO && k !== 'precep-app').map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin && !CDN.includes(u.hostname)) return; // Supabase e Worker nunca passam pelo cache
  const doCache = () => caches.match(e.request, { ignoreSearch: u.origin === location.origin }).then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
  // rede primeiro, mas com prazo: numa conexão ruim o app abre da cópia salva em vez de ficar em branco
  e.respondWith(comTempo(fetch(e.request), e.request.mode === 'navigate' ? 4000 : 8000).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); e.waitUntil(caches.open(VERSAO).then(c => c.put(e.request, cp))); }
    return r;
  }).catch(() => doCache().then(m => m || Response.error())));
});
