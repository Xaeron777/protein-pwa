const CACHE = 'protein-app-v1';

const ASSETS = [
  '/protein-pwa/',
  '/protein-pwa/index.html',
  '/protein-pwa/about.html',
  '/protein-pwa/todolist.html',
  '/protein-pwa/feedback.html',
  '/protein-pwa/offline.html',
  '/protein-pwa/style.css',
  '/protein-pwa/script.js',
  '/protein-pwa/manifest.json',
  '/protein-pwa/icons/icon-192.png',
  '/protein-pwa/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      )
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') {
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).catch(() => caches.match('/protein-pwa/offline.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(req, clone));
        return response;
      });
    })
  );
});


self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Возвращайтесь снова!', {
      body: data.body || 'Мы скучаем по вам! Загляните в приложение.',
      icon: '/protein-pwa/icons/icon-192.png',
      badge: '/protein-pwa/icons/icon-192.png',
      data: { url: data.url || '/protein-pwa/' }
    })
  );
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data ? event.notification.data.url : '/protein-pwa/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windows) => {
      for (const win of windows) {
        if (win.url === url) return win.focus();
      }
      return clients.openWindow(url);
    })
  );
});


self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TEST_PUSH') {
    self.registration.showNotification(event.data.title || 'Возвращайтесь снова!', {
      body: event.data.body || 'Мы скучаем по вам! Загляните в приложение.',
      icon: '/protein-pwa/icons/icon-192.png',
      badge: '/protein-pwa/icons/icon-192.png',
      data: { url: '/protein-pwa/' }
    });
  }
});