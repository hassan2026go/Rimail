/* Rimail service worker: يعمل التطبيق دون اتصال (الهيكل فقط، والرسائل تأتي من ذاكرة Firestore المحلية) */
const V = 'rimail-202610292222', SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  /* الشبكة أولًا (لتصل التحديثات فورًا)، ثم الذاكرة عند انقطاع الاتصال */
  e.respondWith(fetch(r).then(res => { if (res.ok && !/config\.js$/.test(u.pathname)) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
