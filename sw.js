// =============================================
// SERVICE WORKER — Boutique VIP
// Permite que la app funcione sin internet
// =============================================

const CACHE_NAME = 'boutique-vip-v1';

// Archivos que se guardan en el teléfono para uso offline
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&family=Cinzel:wght@400;600&display=swap'
];

// Al instalar: guardar archivos en caché
self.addEventListener('install', evento => {
  console.log('[SW] Instalando Boutique VIP...');
  evento.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ARCHIVOS_CACHE).catch(err => {
        console.log('[SW] Algunos archivos no se cachearon:', err);
      });
    })
  );
  self.skipWaiting();
});

// Al activar: limpiar cachés antiguas
self.addEventListener('activate', evento => {
  console.log('[SW] Activado — Boutique VIP');
  evento.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Al hacer una petición: primero caché, luego internet
self.addEventListener('fetch', evento => {
  // No interceptar llamadas a la API de Claude (necesitan internet siempre)
  if (evento.request.url.includes('api.anthropic.com') ||
      evento.request.url.includes('wa.me')) {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then(respuestaCacheada => {
      // Si está en caché, usarla
      if (respuestaCacheada) return respuestaCacheada;
      // Si no, buscar en internet y guardar en caché
      return fetch(evento.request).then(respuestaRed => {
        if (!respuestaRed || respuestaRed.status !== 200) return respuestaRed;
        const copia = respuestaRed.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evento.request, copia));
        return respuestaRed;
      }).catch(() => {
        // Sin internet y sin caché: mostrar página offline básica
        if (evento.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
