/* Rimail service worker: يعمل التطبيق دون اتصال (الهيكل فقط، والرسائل تأتي من ذاكرة Firestore المحلية) */
const V = 'rimail-202611141749', SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const EXT = 'rimail-ext', EXT_HOSTS = ['www.gstatic.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'], FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
/* تخزين مكتبة Firebase ومشتقاتها مسبقًا ليبدأ التطبيق دون إنترنت */
async function precacheSdk() {
  const c = await caches.open(EXT), seen = new Set();
  const grab = async (url, depth) => {
    if (seen.has(url) || depth > 3) return; seen.add(url);
    try {
      if (!(await c.match(url, { ignoreVary: true }))) { const r = await fetch(url, { mode: 'cors' }); if (!r.ok) return; await c.put(url, r.clone()); var txt = await r.text(); }
      else var txt = await (await c.match(url, { ignoreVary: true })).clone().text();
      for (const m of txt.matchAll(/(?:from|import)\s*["']([^"']+\.js)["']/g)) { try { await grab(new URL(m[1], url).href, depth + 1); } catch {} }
    } catch {}
  };
  await Promise.all(['app', 'auth', 'firestore'].map(n => grab(FB + 'firebase-' + n + '.js', 0)));
}
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => precacheSdk().catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== EXT).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin !== location.origin) {
    if (u.hostname === 'fonts.googleapis.com') {
      e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(EXT).then(x => x.put(r, cp)); return res; }).catch(() => caches.match(r, { ignoreVary: true }).then(m => m || Response.error())));
    } else if (EXT_HOSTS.includes(u.hostname) && (/firebasejs|\/npm\/|\/s\//.test(u.pathname))) {
      e.respondWith(caches.match(r, { ignoreVary: true }).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(EXT).then(x => x.put(r, cp)); } return res; })));
    }
    return;
  }
  /* الشبكة أولًا (لتصل التحديثات فورًا)، ثم الذاكرة عند انقطاع الاتصال */
  e.respondWith(fetch(r).then(res => { if (res.ok && !/config\.js$/.test(u.pathname)) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
