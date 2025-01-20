/// original author code to cache the game so that the game is playable when user is offline 
// not useful ady 
const cacheName = 'static-v5';

addEventListener('install', event => {
  skipWaiting(); // forces the waiting service worker to become the active service worker.
  event.waitUntil(async function() {
    const cache = await caches.open(cacheName);
    await cache.addAll(['main.js', '/']); //add to cache
  }());
});

addEventListener('activate', event => { //triggered when the new service worker is activated.
  event.waitUntil(async function() {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key != cacheName) await caches.delete(key);
    }
    
    for (const client of await clients.matchAll()) {
      client.navigate(client.url);
    }
  }());
});

addEventListener('fetch', event => { //triggered when the browser makes a network request for a resource 
  event.respondWith(async function() {
    const response = await caches.match(event.request);
    if (response) return response;
    return fetch(event.request);
  }());
});