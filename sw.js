// تسوق الآن - Service Worker للعمل أوفلاين ومتوافق مع معايير PWA
const CACHE_NAME = 'tasawuq-cache-v24';
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
