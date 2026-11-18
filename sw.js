// بيخلّي البرنامج يفتح حتى من غير نت. غيّر رقم النسخة لو عايز تجبر التحديث.
const CACHE = 'mkb-v13-1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;           // طلبات الحفظ على الدرايف (POST) بتعدّي مباشرة
  const url = new URL(req.url);

  // ملفات الموقع نفسه: الشبكة أولاً (عشان التحديثات تظهر)، ولو مفيش نت من الكاش
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // مكتبات وخطوط خارجية (إكسيل، Tajawal): من الكاش لو موجودة، وإلا من الشبكة وتتخزن
  if (url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
