// YSRCP NRI Wing – service worker: works offline (incl. the member card) and loads fast.
// Pages: network first, fall back to the saved copy. Static files: saved copy first, refreshed in the background.
// The API (/api/…) is never cached – member data always comes fresh from the server.
const CACHE = "nri-wing-v1";
const SHELL = ["/", "/index.html", "/css/style.css", "/js/api.js", "/js/data.js", "/js/main.js", "/js/meet-wall-data.js", "/js/world-geo.js",
  "/manifest.webmanifest", "/images/icon-192.png", "/images/jagan-cm-office.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return; // always live
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("/index.html", copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match("/index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const fresh = fetch(req).then((res) => {
      if (res.ok && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.host))) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => hit);
    return hit || fresh;
  }));
});
