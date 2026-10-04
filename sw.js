// Çevrimdışı kullanım: uygulama dosyaları önbellekte tutulur.
// Kendi dosyalarımız önce ağdan istenir (güncellemeler hemen gelsin), ağ yoksa önbellekten verilir.
// Google Fonts dosyaları ilk yüklemede önbelleğe alınır.
const CACHE = "gitar-v6";
const SHELL = [
  "./",
  "index.html",
  "css/app.css",
  "js/core/music.js",
  "js/core/guitar.js",
  "js/core/chords.js",
  "js/core/rhythm.js",
  "js/core/songs.js",
  "js/core/ear.js",
  "js/core/lessons.js",
  "js/app/base.js",
  "js/app/tabs.js",
  "js/app/settings.js",
  "js/app/metronome.js",
  "js/app/sap.js",
  "js/app/tuner.js",
  "js/app/chords.js",
  "js/app/rhythm.js",
  "js/app/songs.js",
  "js/app/melody.js",
  "js/app/ear.js",
  "js/app/lessons.js",
  "js/app/main.js",
  "manifest.webmanifest",
  "icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin === location.origin){
    e.respondWith(fetch(req).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match("index.html"))));
  }else if(url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    })));
  }
});
