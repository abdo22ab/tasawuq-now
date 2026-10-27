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

  const url = new URL(req.url);

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
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const networkRes = await fetch(req);
          if (networkRes && (networkRes.status === 200 || networkRes.type === "opaque")) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (err) {
          return cached || new Response("", { status: 408 });
        }
      })
    );
  }
});
