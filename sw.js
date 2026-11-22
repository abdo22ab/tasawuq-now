// تسوق الآن - Service Worker للعمل أوفلاين ومتوافق مع معايير PWA
const CACHE_NAME = 'tasawuq-cache-v103';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/lucide.min.js',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png'
];

// 1. التثبيت والتخزين المؤقت للملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('PWA Cache Assets warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. تفعيل وحذف الكاش القديم عند التحديث
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// 3. استراتيجية Network-First مع الرجوع للكاش عند انقطاع النت
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = req.url || '';
  if (url.includes(':5000') || url.includes(':5500') || url.includes('172.') || url.includes('192.168.') || url.includes('localhost') || url.includes('127.0.0.1')) {
    return;
  }
  // استثناء طلبات قواعد البيانات والـ API لتعمل دائماً مباشرة
  if (req.method !== 'GET' || req.url.includes('supabase.co') || req.url.includes('firebaseio.com') || req.url.includes('onesignal.com')) {
    return;
  }
  event.respondWith(
    fetch(req)
      .then(networkRes => {
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(req).then(cachedRes => {
          if (cachedRes) return cachedRes;
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// 4. استيراد كود OneSignal إن وُجد لدعم إشعارات الويب المباشرة
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {}

// 5. استقبال إشعارات الـ Web Push عند إغلاق التطبيق أو قفل الشاشة
self.addEventListener('push', function(event) {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch(e) {
    payload = { title: '🔔 تسوق الآن', body: event.data.text() };
  }
  const title = payload.title || (payload.headings && (payload.headings.ar || payload.headings.en)) || '🔔 تسوق الآن';
  const body = payload.body || payload.alert || payload.message || (payload.contents && (payload.contents.ar || payload.contents.en)) || 'وصلتك رسالة أو تنبيه جديد في تسوق الآن';
  const notifUrl = payload.url || (payload.data && payload.data.url) || '/';

  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: payload.tag || ('tasawuq_' + Date.now()),
    renotify: true,
    data: {
      url: notifUrl,
      ...(payload.data || {})
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. فتح التطبيق أو المحادثة المحددة عند النقر على الإشعار من شاشة القفل أو سطح المكتب
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          if (client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
