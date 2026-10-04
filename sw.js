const CACHE = 'kakogames-shell-v8-20261004';
const APP_SHELL = [
  './',
  './index.html',
  './KAKOGAMES_V7_OFFLINE_APP_SALA_LOCAL.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];
const FIREBASE = [
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(APP_SHELL.map(async u => {
      try { await cache.add(u); } catch (_) {}
    }));
    await Promise.allSettled(FIREBASE.map(async u => {
      try {
        const r = await fetch(u, {mode:'no-cors', cache:'reload'});
        await cache.put(u, r);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
function isFirebase(u) {
  return u.origin === 'https://www.gstatic.com' && u.pathname.includes('/firebasejs/');
}
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const firebase = isFirebase(url);
  if (!same && !firebase) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(req); }
      catch (_) {
        const c = await caches.match('./index.html') || await caches.match('./KAKOGAMES_V7_OFFLINE_APP_SALA_LOCAL.html') || await caches.match('./');
        return c || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(req, {ignoreVary:true});
    if (cached) {
      fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) caches.open(CACHE).then(c => c.put(req, r.clone())).catch(()=>{}); }).catch(()=>{});
      return cached;
    }
    try {
      const r = await fetch(req);
      if (r && (r.ok || r.type === 'opaque')) {
        const c = await caches.open(CACHE);
        await c.put(req, r.clone());
      }
      return r;
    } catch (_) {
      return Response.error();
    }
  })());
});
