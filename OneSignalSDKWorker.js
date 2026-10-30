importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// ⚡ كاش ذكي ودائم للصور والملفات لتسريع التصفح وتوفير باقة النت بنسبة 100%
const IMAGE_CACHE = "tasawuq-images-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== IMAGE_CACHE && !k.startsWith("OneSignal")).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch(e) {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // فحص ما إذا كان الطلب صورة من أي نوع أو من خدمات الاستضافة
  const isImage =
    req.destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/i.test(url.pathname) ||
    url.hostname.includes("firebasestorage") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("cloudinary.com") ||
    url.hostname.includes("images.unsplash.com");

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        try {
          const cached = await cache.match(req);
          if (cached) return cached;
          const networkRes = await fetch(req);
          if (networkRes && (networkRes.status === 200 || networkRes.type === "opaque")) {
            cache.put(req, networkRes.clone()).catch(() => {});
          }
          return networkRes;
        } catch (err) {
          return fetch(req);
        }
      })
    );
  }
});

// التعامل مع النقر على الإشعار وفتح الشات مباشرة عند فتحه من شاشة القفل
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
