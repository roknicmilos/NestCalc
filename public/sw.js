// Online-only service worker: it exists so the app is installable. It only handles page
// navigations (falling back to /offline.html when the network is down) and never touches
// API calls or any other request, so a failed save is never masked by a cached page.
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('nestcalc-offline-v1').then((cache) => cache.addAll([OFFLINE_URL])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
