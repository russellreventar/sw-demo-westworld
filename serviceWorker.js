//Cache polyfil to support cacheAPI in all browsers
importScripts('./lib/cache-polyfill.js');

const version = 'v1';
const cacheName = 'cache-v1';

//Files to save in cache
var files = [
  './',
  './index.html',
  './src/style.css',
  './dist/app.min.js',
  './manifest.json',
  './images/favicon/android-chrome-192x192.png',
  './images/bg.png',
  './images/logo.png',
  './images/spinner.png'
];



//Adding `install` event listener
self.addEventListener('install', event => {
  console.info('SW-%s: ⚡️ Installed ', version);
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(files)
        .then(() => console.info('All files are cached'))
    })
  );
});

self.addEventListener('activate', event => {
  console.info('SW-%s: ⚡️ Activated ', version);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(cache => {
          if (cache !== cacheName) {
            console.log('Cache deleted: ', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
})

//Adding `fetch` event listener
self.addEventListener('fetch', (event) => {
  var req = event.request;
  console.info('SW-%s: ⚡️ Fetch ', version, req.url);
  event.respondWith(
    //If request is already in cache, return it
    caches.match(req).then(res => {

      if(req.method === 'PUT') {
        return fetch(req);
      }

      if(!navigator.onLine) {
        if(res) return res;
      }else {
        return fetchAndCache(req);
      }
    })
  );
});

const syncStore = {};
self.addEventListener('sync', event => {
  console.info('SW-%s: ⚡️ Sync ', version, syncStore[event.tag]);
  const {url, options} = syncStore[event.tag];
  event.waitUntil(fetch(url, options));
})

self.addEventListener('message', event => {
  console.info('SW-%s: ⚡️ Message ', version, event.data);
  if(event.data.type === 'sync') {
     const id = uuid();
     syncStore[id] = event.data
     self.registration.sync.register(id);
   }
})

function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4();
}

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
