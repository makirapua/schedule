const CACHE = 'schedule-v3';
const ASSETS = ['./index.html', './manifest.json', './icon-192.svg'];

// インストール時にキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 古いキャッシュ削除
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// オフライン対応
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// 通知受信
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: '📅 スケジュール', body: '予定を確認しよう！' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './icon-192.svg',
    badge: './icon-192.svg',
    vibrate: [200, 100, 200],
    tag: 'schedule-reminder',
    renotify: true,
    data: { url: './index.html' }
  }));
});

// 通知タップでアプリを開く
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const client of list) {
      if ('focus' in client) return client.focus();
    }
    return clients.openWindow('./index.html');
  }));
});

// メインスレッドからのメッセージ（リマインダー予約）
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFY') {
    const { title, body } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.svg',
      vibrate: [200, 100, 200],
      tag: 'schedule-reminder',
      renotify: true,
    });
  }
});
