// Guarda la app para que abra al instante y funcione sin conexión (solo con la estimación).
const CACHE = "aparca-girona-v7";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png",
  "js/main.js", "js/App.js", "js/util.js", "js/modelo/Disponibilidad.js", "js/modelo/ModeloPrevision.js", "js/modelo/Aparcamiento.js",
  "js/fuentes/FuenteDisponibilidad.js", "js/datos/catalogo.js", "js/datos/RepositorioSupabase.js",
  "js/vista/VistaMapa.js", "js/vista/VistaLista.js", "js/vista/VistaZonas.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.endsWith("supabase.co") || url.hostname.endsWith("tile.openstreetmap.org")) return; // avisos siempre en directo
  // Red primero para la página (siempre la versión nueva), caché si no hay conexión
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  // Librerías y teselas del mapa: caché primero
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })));
});
