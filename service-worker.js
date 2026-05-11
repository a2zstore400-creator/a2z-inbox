/**
 * A2Z Mail — Service Worker
 * عند رفع إصدار الكاش (مثلاً v2 → v3) يُحذف الكاش القديم ويُحمَّل inbox.html من الشبكة من جديد.
 */
const CACHE_NAME = 'a2z-inbox-v2';

function precacheRequests() {
    const scope = self.registration.scope;
    const urls = [
        new URL('inbox.html', scope).href,
        new URL('manifest.json', scope).href,
    ];
    return urls.map((url) => new Request(url, { cache: 'reload' }));
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(precacheRequests()))
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.warn('Service Worker precache:', err);
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // صفحات HTML: الشبكة أولاً مع إعادة تحميل، ثم احتياط من الكاش (للعمل دون اتصال جزئياً)
    if (url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request, { cache: 'reload' })
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    }
});
