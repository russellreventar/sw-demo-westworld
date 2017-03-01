const version = 'v.11';

// ===========================================================
//   DEMO 1 - Log Functional Events
// ===========================================================
// self.addEventListener('install', event => {
//   console.info('⚡️ SW-%s: Installed', version);
// })
//
// self.addEventListener('activate', event => {
//   console.info('⚡️ SW-%s: Active', version);
// })

// ===========================================================
//   DEMO 1 - Log Functional Events
// ===========================================================
importScripts('./src/js/lib/cache-polyfill.js');
const cacheName = 'cache-v3';
const filesToCache = [
  './',
  './index.html',
  './src/css/style.css',
  './dist/app.min.js',
  './manifest.json',
  './src/imgs/favicon.png',
  './src/imgs/bg.png',
  './src/imgs/logo.png',
  './src/imgs/spinner.png',
  './bandits'
];

self.addEventListener('install', e => {
  console.info('⚡️ SW-%s: Installed & Cached', version);
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesToCache)
        .then(()=>console.log('All Files Cached'))
    })
  );
})

self.addEventListener('activate', e => {
  console.info('⚡️ SW-%s: Active', version);
    e.waitUntil(
      caches.keys().then(keys => {
        return Promise.all(keys.map(cache => {
            if (cache !== cacheName) {
              return caches.delete(cache);
            }
          })
        );
      })
    );
})

// ===========================================================
//   DEMO 3 - Fetch
// ===========================================================
self.addEventListener('fetch', e => {
  var req = e.request;
  console.info('SW-%s: ⚡️ Fetch ', version, req.url);
  e.respondWith(
    caches.match(req).then(res => {

      if(req.method === 'PUT') return fetch(req);

      if(!navigator.onLine) {
        if(res) return res;
      }else{
        return fetchAndCache(req);
      }
    })
  );
});

// ===========================================================
//   DEMO 3 - Sync
// ===========================================================
const syncStore = {};

self.addEventListener('sync', e => {
  console.info('SW-%s: ⚡️ Sync ', version, e.tag]);
  const {url, options} = syncStore[e.tag];
  e.waitUntil(fetch(url, options));
})
//
// self.addEventListener('message', event => {
//   console.info('SW-%s: ⚡️ Message ', version, event.data);
//   if(event.data.type === 'sync') {
//      const id = uuid();
//      syncStore[id] = event.data
//      self.registration.sync.register(id);
//    }
// })

// -----------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------

function fetchAndCache(req) {
  return fetch(req).then(res => {
    if(res) {
      return caches.open(cacheName)
        .then(cache => {
          return cache.put(req, res.clone())
        })
        .then(() => {
          return res;
        });
    }
  })
}


function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4();
}
