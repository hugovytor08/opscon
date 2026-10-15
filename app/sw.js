const CACHE = 'meu-espaco-shell-v15';
const SHELL = [
  './', './index.html', './styles.css', './ui.js', './domain.js', './storage.js', './sync.js', './supabase.js', './config.js',
  './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './ui.css', './design-system.css', './dashboard.js', './import-draft.js', './import-review.js', './import-schema.js',
  './house-map.js', './house-map-data.js', './assets/apartamento-real/casa-isometrica.svg',
  './assets/ref-casa.png', './assets/ref-compras.png', './assets/ref-projetos.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  // Existing tabs keep their coherent shell; the new version activates on close.
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('meu-espaco-shell-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  // Auth callbacks add query parameters to the same static shell. They must
  // still open from cache if the preview or connection is unavailable.
  event.respondWith(caches.match(event.request, { ignoreSearch: event.request.mode === 'navigate' }).then(cached => cached || fetch(event.request)));
});
