// DengueCare: service worker (instalação no celular e uso sem internet)
// A página vem da rede quando há conexão (atualizações chegam sozinhas);
// sem conexão, abre a última versão guardada.
const CACHE = 'denguecare-v1';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Página: rede primeiro, cópia guardada se estiver sem internet
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(resp => {
          if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); }
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Ícones e manifesto: cópia guardada primeiro. O resto (vídeos, PDFs) passa direto.
  const escopo = self.registration.scope;
  const caminho = url.href.startsWith(escopo) ? './' + url.href.slice(escopo.length).split(/[?#]/)[0] : '';
  if (ARQUIVOS.includes(caminho)) {
    e.respondWith(caches.match(caminho).then(m => m || fetch(req)));
  }
});
