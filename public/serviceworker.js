// public/serviceworker.js

// Name of the current cache
const CACHE_NAME = 'vite-react-app-v1';

// URL to display when offline (make sure you create an offline.html in your public folder)
const OFFLINE_URL = '/offline.html';

// List of URLs to cache during the installation step.
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  // add other assets you want to precache here (e.g. CSS, JS, fonts)
];

// INSTALL: Cache core assets
// self.addEventListener('install', (event) => {
//   console.log('[Service Worker] Installing');
//   event.waitUntil(
//     caches.open('vite-react-app-v1').then((cache) => {
//       return cache.addAll([
//         '/',
//         '/index.html',
//         '/offline.html',
//         // other assets
//       ]);
//     })
//   );
//   self.skipWaiting(); // Force SW to activate immediately
// });

// self.addEventListener('activate', (event) => {
//   console.log('[Service Worker] Activating');
//   event.waitUntil(
//     caches.keys().then((cacheNames) =>
//       Promise.all(
//         cacheNames.map((cache) => {
//           if (cache !== 'vite-react-app-v1') {
//             console.log('[Service Worker] Deleting old cache:', cache);
//             return caches.delete(cache);
//           }
//         })
//       )
//     )
//   );
//   self.clients.claim(); // Immediately start controlling all clients
// });


// // FETCH: Serve cached content when offline and update the cache with new responses
// self.addEventListener('fetch', (event) => {
//   // Only handle GET requests.
//   if (event.request.method !== 'GET') return;
//   event.respondWith(
//     caches.match(event.request).then((cachedResponse) => {
//       // Return cached response if found.
//       if (cachedResponse) {
//         return cachedResponse;
//       }
//       // Otherwise, fetch from the network.
//       return fetch(event.request)
//         .then((networkResponse) => {
//           // If the response is invalid, just pass it through.
//           if (
//             !networkResponse ||
//             networkResponse.status !== 200 ||
//             networkResponse.type !== 'basic'
//           ) {
//             return networkResponse;
//           }
//           // Clone the response before caching it.
//           const responseToCache = networkResponse.clone();
//           caches.open(CACHE_NAME).then((cache) => {
//             cache.put(event.request, responseToCache);
//           });
//           return networkResponse;
//         })
//         .catch(() => {
//           // If network fetch fails (e.g. offline), return the offline page for navigation requests.
//           if (event.request.mode === 'navigate') {
//             return caches.match(OFFLINE_URL);
//           }
//         });
//     })
//   );
// });

// // MESSAGE: Listen for messages to control service worker behavior (e.g. skipWaiting)
// self.addEventListener('message', (event) => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
// });
