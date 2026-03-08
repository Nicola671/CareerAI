// ============================================
// CareerAI — Service Worker (PWA)
// ============================================

const CACHE_NAME = 'careerai-v2';

// Archivos esenciales que se cachean al instalar
const PRECACHE_URLS = [
    '/',
    '/static/styles.css',
    '/static/app.js',
    '/static/favicon.png',
    '/static/icon-pro.png',
    '/static/icon-flash.png',
    '/static/manifest.json'
];

// ---- INSTALL: Pre-cachea los archivos esenciales ----
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-cacheando archivos esenciales');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.warn('[SW] Error durante pre-cache (no crítico):', err);
                return self.skipWaiting();
            })
    );
});

// ---- ACTIVATE: Limpia caches antiguos ----
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Eliminando cache antiguo:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ---- FETCH: Network-first para API, Cache-first para estáticos ----
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // No cachear peticiones POST, ni SSE streams, ni API calls
    if (
        event.request.method !== 'GET' ||
        url.pathname.startsWith('/api/') ||
        url.pathname.includes('/stream')
    ) {
        return; // Dejar que el navegador maneje normalmente
    }

    // Para archivos estáticos: Cache-first, luego network
    if (
        url.pathname.startsWith('/static/') ||
        url.pathname === '/' ||
        url.pathname.endsWith('.html')
    ) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Devolver cache inmediatamente, pero actualizar en background
                        const fetchPromise = fetch(event.request)
                            .then((networkResponse) => {
                                if (networkResponse && networkResponse.ok) {
                                    const responseClone = networkResponse.clone();
                                    caches.open(CACHE_NAME).then((cache) => {
                                        cache.put(event.request, responseClone);
                                    });
                                }
                                return networkResponse;
                            })
                            .catch(() => { /* Network failed, cache is fine */ });

                        return cachedResponse;
                    }

                    // No hay cache, ir a la red
                    return fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.ok) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                            }
                            return networkResponse;
                        });
                })
                .catch(() => {
                    // Si todo falla, devolver la página principal desde cache
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                })
        );
        return;
    }

    // Para Google Fonts y CDNs externos: Cache-first
    if (
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdn.jsdelivr.net')
    ) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    return cachedResponse || fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.ok) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                            }
                            return networkResponse;
                        });
                })
        );
        return;
    }
});
