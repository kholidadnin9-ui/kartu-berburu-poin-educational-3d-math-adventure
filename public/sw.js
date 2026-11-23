const CACHE = "number-jump-v3";
const BASE = [
  "/",
  "/icon.svg",
  "/art/adventure-hero.webp",
  "/art/sky-panorama.webp",
  "/art/number-bot.webp",
  ...Array.from({ length: 5 }, (_, i) => `/art/world-${i}.webp`),
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll(BASE);
      let assets = [];
      try {
        const manifest = await (
          await fetch("/api/offline-assets", { cache: "no-store" })
        ).json();
        assets = manifest.assets.filter(
          (f) => typeof f === "string" && f.startsWith("/_next/static/"),
        );
      } catch {}
      const home = await c.match("/");
      if (home) {
        const html = await home.text();
        assets.push(
          ...[
            ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"<> ]+)"/g),
          ].map((m) => m[1]),
        );
      }
      await Promise.allSettled([...new Set(assets)].map((f) => c.add(f)));
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const k of await caches.keys())
        if (k.startsWith("number-jump-") && k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    u.origin !== self.location.origin ||
    u.pathname.startsWith("/api/") ||
    u.searchParams.has("_rsc")
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (r) => {
          if (r.ok) {
            const c = await caches.open(CACHE);
            await c.put("/", r.clone());
          }
          return r;
        })
        .catch(async () => (await caches.match("/")) || Response.error()),
    );
    return;
  }
  if (
    u.pathname.startsWith("/_next/static/") ||
    u.pathname.startsWith("/art/") ||
    u.pathname === "/icon.svg"
  )
    event.respondWith(
      caches.match(event.request).then(
        (r) =>
          r ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const cp = response.clone();
              caches.open(CACHE).then((c) => c.put(event.request, cp));
            }
            return response;
          }),
      ),
    );
});
