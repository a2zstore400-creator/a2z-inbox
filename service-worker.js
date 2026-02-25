self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
    // ملف بسيط جداً لتخطي متطلبات PWA والسماح بظهور زرار التثبيت
});
