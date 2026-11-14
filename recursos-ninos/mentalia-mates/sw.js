// Mentalia Mates · funciona sin conexión una vez abierta
const CACHE = 'mates-v0.9.1';
const FILES = ['./', './index.html', './privacidad.html', './css/mates.css', './js/app.js', './js/curriculum.js', './js/games.js', './js/games-frac.js', './js/games-addsub.js', './js/games-num.js', './js/pace.js', './manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
