const CACHE_PREFIX = "yozora-app-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const PRECACHE_URLS = [
  "/",
  "/about.html",
  "/404.html",
  "/offline.html",
  "/styles.css?v=23",
  "/app.js?v=17",
  "/asset/Yozora-pfp/femini%20one.jpg",
  "/asset/Yozora-pfp/menly-one.png",
  "/asset/image/Handsig-icon.png",
  "/asset/image/discord-avatar-apple-touch-icon.png",
  "/asset/image/discord-avatar-favicon-16.png",
  "/asset/image/discord-avatar-favicon-32.png",
  "/asset/image/favicon.png",
  "/asset/image/pig%20pixel.png",
  "/asset/logo-icon/X.png",
  "/asset/logo-icon/discord.png",
  "/asset/logo-icon/facebook.png",
  "/asset/logo-icon/github.png",
  "/asset/logo-icon/steam.png",
  "/asset/logo-icon/tiktok.png",
  "/asset/project/beta-logo.webp",
  "/asset/project/fukidashi-logo.webp",
  "/asset/project/ramnuker-logo.webp",
  "/asset/project/zora-logo.webp"
];
const STATIC_FILE = /\.(?:html|css|js|png|jpe?g|webp|svg|ico|woff2?)$/i;
const LIVE_API_PATHS = new Set(["/api/yozora"]);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function isLiveEndpoint(pathname) {
  return LIVE_API_PATHS.has(pathname) || pathname.startsWith("/api/");
}

function cachePageKey(pathname) {
  return new URL(pathname, self.location.origin).href;
}

async function cacheSuccessfulStaticResponse(request, response) {
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    isLiveEndpoint(url.pathname) ||
    !response.ok ||
    !STATIC_FILE.test(url.pathname)
  ) return;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function cachedNotFound() {
  const cache = await caches.open(CACHE_NAME);
  const page = await cache.match("/404.html");
  if (!page) return Response.error();
  return new Response(await page.arrayBuffer(), {
    status: 404,
    statusText: "Not Found",
    headers: page.headers
  });
}

async function handleNavigation(request, url) {
  try {
    const response = await fetch(request);
    if (response.status === 404 && url.pathname !== "/404.html") return cachedNotFound();

    if (response.ok) {
      const pagePath = url.pathname === "/index.html" ? "/" : url.pathname;
      const cache = await caches.open(CACHE_NAME);
      await cache.put(cachePageKey(pagePath), response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedPage = await cache.match(cachePageKey(url.pathname), { ignoreSearch: true });
    if (cachedPage) return cachedPage;
    const offlinePage = await cache.match("/offline.html");
    if (offlinePage) return offlinePage;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || isLiveEndpoint(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request, url));
    return;
  }

  if (!STATIC_FILE.test(url.pathname)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      await cacheSuccessfulStaticResponse(request, response);
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(request) || Response.error();
    }
  })());
});
