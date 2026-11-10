const CACHE = "cs-coach-v4";
const FILES = ["./", "index.html", "styles.css", "app.js", "i18n.js", "lessons.js", "questions.js", "questions-more.js", "pet.js", "coach.js", "icon.svg", "manifest.webmanifest"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener("fetch", e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
