// CS Coach service worker: works offline, but always tries the network first so
// updates arrive right away. It never touches localStorage, so updates can't
// erase anyone's progress.
const CACHE = "cs-coach-v50";
const FILES = ["./", "styles.css", "app.js", "account.js", "analytics.js", "i18n.js", "rank.js", "tone.js", "lessons.js", "questions.js", "questions-more.js",
  "questions-syllabus.js", "questions-extra.js", "lesson-examples.js", "glossary.js", "config.js", "ai.js", "install.js", "pet.js", "coach.js", "icon.svg", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    // always ask the server for the newest copy (skip the browser's short-term cache)
    fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then(async res => {
      // Some hosts (e.g. Cloudflare Pages) redirect /index.html to /. A redirected response can't be
      // returned for a page load (Chrome shows ERR_FAILED), so hand back a clean copy instead.
      if (res.redirected) res = new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./")))
  );
});
