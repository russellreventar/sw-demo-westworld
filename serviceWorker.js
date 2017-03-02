importScripts('./src/js/lib/cache-polyfill.js');
const version = 'v1';
const cacheName = 'cache-v1';
const cacheFiles = [
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

// PART 2 - Handle Install & Activate Events
// ===========================================================
self.addEventListener('install', e => {
  console.info('⚡️ SW-%s: Installed', version);
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(cacheFiles)
        .then(()=>console.log('Cache added: ', cacheName))
    })
  );
})

self.addEventListener('activate', e => {
  console.info('⚡️ SW-%s: Active', version);
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(cache => {
        if (cache !== cacheName) {
          console.log('Cache deleted: ', cache);
          return caches.delete(cache);
        }
      }));
    })
  );
})

// PART 3 - Fetch
// ===========================================================
self.addEventListener('fetch', e => {
  var req = e.request;
  console.info('⚡️ SW-%s: Fetch ', version, req.url);
  e.respondWith(
    caches.match(req).then(res => {

      if(req.method === 'PUT') return fetch(req);

      if(offline()) {
        if(res) return res;
      }else{
        return fetchAndCache(req);
      }
    })
  );
});

// PART 4 - Listens for messages from App.js
// ===========================================================
// 'tagId': {
//   url: '/bandits',
//   options: {
//     method: 'GET'
//   }
// }
const syncStore = {};
self.addEventListener('message', e => {
  console.info('⚡️ SW-%s: Message ', version, e.data);
  var tag = uuid();
  syncStore[tag] = e.data;
  syncStore[tag].port = e.ports[0];
  self.registration.sync.register(tag);
})

// PART 5 - Background Sync when online
// ===========================================================
self.addEventListener('sync', e => {
  console.info('⚡️ SW-%s: Sync ', version, syncStore[e.tag]);
  const {url, options, port} = syncStore[e.tag];
  e.waitUntil(
    fetch(url, options).then(res => port.postMessage('Sync done!'))
  );
})

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

function offline(){
  return !navigator.onLine;
}
