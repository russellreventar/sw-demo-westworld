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
  self.skipWaiting();
  logEvent('Install');
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(cacheFiles)
        .then(() => console.log('Cache added: ', cacheName))
    })
  )
})
self.addEventListener('activate', e => {
  logEvent('Active');
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
  logEvent('Fetch', req.url);
  e.respondWith(
    caches.match(req).then(res => {
      if(offline()) {
        if(res) return res
      }else{
        return fetchAndCache(req)
      }
    })
  )
});

// PART 4 - Listens for messages from App.js
// ===========================================================
const syncStore = {};
self.addEventListener('message', e => {
  logEvent('Message', e.data)
  var tag = uuid();
  syncStore[tag] = e.data;
  syncStore[tag].port = e.ports[0];
  self.registration.sync.register(tag);
})

// PART 5 - Background Sync when online
// ===========================================================
self.addEventListener('sync', e => {
  logEvent('Sync', syncStore[e.tag])
  const {url, options, port} = syncStore[e.tag];
  e.waitUntil(
    fetch(url, options).then(res => port.postMessage('NSYNC!'))
  )
});

// Helper Functions
// -----------------------------------------------------------------
function fetchAndCache(req) {
  return fetch(req).then(res=>{
    if(res) {
      return caches.open(cacheName).then(cache=>{
        if(req.method !== 'PUT'){
          return cache.put(req, res.clone())
            .then(() => res)
        }else{
          return res;
        }
      })
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

function logEvent(eventName, log) {
  console.info(`⚡️ SW-${version}: ${eventName} `, log ? log : '');
}
