/* 离线缓存：第一次打开后，断网 / 代理失效也能打开并打卡 */
var CACHE = 'studybench-v12';
var ASSETS = ['./', './index.html', './app.js', './themes.js', './fx.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () { });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // GitHub API 一律走网络，不缓存（数据必须最新）
  if (url.hostname === 'api.github.com') return;

  if (e.request.method !== 'GET') return;

  // 代码文件（html/js）走「网络优先」：这样我更新版本后你一打开就是新版，
  // 只有断网时才退回缓存。图片等静态资源仍走缓存优先，打开更快。
  var isCode = /\.(html|js|webmanifest)$/i.test(url.pathname) ||
               url.pathname === '/' || url.pathname.endsWith('/');

  if (isCode) {
    e.respondWith(
      /* 【曾经的坑】这里原本是 fetch(e.request)，走的是默认 cache mode = default，
         会命中 GitHub Pages 的 `cache-control: max-age=600`（10 分钟）。
         后果：部署新版后用户刷新，旧 SW 把旧 HTML 从 HTTP 缓存里喂回来，
         页面还显示旧版本号，必须先等 10 分钟或强刷才生效。
         改成 cache:'no-cache'：强制带 If-None-Match 去服务器确认，
         没变才用 304 复用，变了立刻拿新的 —— 这才是真正的"网络优先"。 */
      fetch(new Request(e.request, { cache: 'no-cache' })).then(function (res) {
        if (res && res.status === 200 && url.origin === location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request, { ignoreSearch: true });
      })
    );
    return;
  }

  // 其它静态资源：先给缓存，同时后台更新
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && url.origin === location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
