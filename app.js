/* 学习打卡 · v2
 * 本地优先 + GitHub Gist 双向同步
 * 合并策略：按日期 / 待办 id 逐个做 LWW（谁最后改谁生效），不做整份覆盖
 * 所以手机和电脑同时改也不会互相清掉
 */
(function () {
  'use strict';

  var K_DATA = 'studybench.v2';
  var K_SYNC = 'studybench.sync';
  var K_DIRTY = 'studybench.dirty';
  var GIST_FILE = 'studybench.json';
  var API = 'https://api.github.com';

  var WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  var WD_S = ['日', '一', '二', '三', '四', '五', '六'];

  /* ---------------- 工具 ---------------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function shift(n) { var d = today(); d.setDate(d.getDate() + n); return d; }
  function now() { return Date.now(); }
  function parseDay(s) { return new Date(s + 'T00:00:00'); }

  function $(id) { return document.getElementById(id); }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  function uid() { return 't' + now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------------- 配对链接 ----------------
   * 部署助手会生成 <网址>#k=<base64({g:gistId,t:token})>
   * 手机点一次就自动配好，不用手打 token
   * 读取后立刻从地址栏抹掉，避免留在浏览记录里
   */
  function fromB64u(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function consumePairLink() {
    var h = location.hash || '';
    var m = h.match(/[#&]k=([A-Za-z0-9\-_]+)/);
    if (!m) return false;
    try {
      var o = JSON.parse(fromB64u(m[1]));
      if (o && o.g && o.t) {
        syncCfg.gistId = o.g;
        syncCfg.token = o.t;
        saveSync();
        setStatus('ok', '已配对');
        try {
          history.replaceState(null, '', location.pathname + location.search);
        } catch (e) { location.hash = ''; }
        return true;
      }
    } catch (e) { }
    return false;
  }

  /* ---------------- 状态 ---------------- */
  var S = null;
  var syncCfg = { gistId: '', token: '' };

  var DEF_GOAL = 3597;       // 四级词书总量
  var DAY_MS = 86400000;

  function blank() {
    return {
      v: 2,
      u: 0,
      config: {
        goalWords: DEF_GOAL, goalU: 0, mig: 1,
        learnedWords: 0, learnedU: 0, learnedHist: [],
        dailyTarget: 50, dailyU: 0
      },
      todos: [],
      days: {}
    };
  }

  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }

  /* 快照数组清洗：按天去重（同一天只留最后一条），按时间排序，只留最近 40 条。
   * 两台设备各记一条同一天的，合并后也只算一条，不会让曲线抖。 */
  function cleanHist(arr) {
    var map = {};
    if (!Array.isArray(arr)) return [];
    arr.forEach(function (x) {
      if (!x) return;
      var t = num(x.t, 0), v = num(x.v, -1);
      if (t <= 0 || v < 0) return;
      var k = ds(new Date(t));
      var ex = map[k];
      if (!ex || t > ex.t) map[k] = { t: t, v: Math.round(v) };
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.t - b.t; })
      .slice(-40);
  }

  /* config 补齐成新结构。
   * 旧版是 {goalWords, dailyTarget, u} 一把梭，改任何一个都会顶掉另一个；
   * 现在三个字段各自带时间戳，合并时互不干扰。
   * 旧版写死的 4500 不是用户选的，首次读到就换成 3597；用 mig 标记保证只迁一次，
   * 用户之后真想填 4500 也不会被反复改回去。 */
  function normalizeConfig(c, out) {
    c = c || {};
    var legacyU = num(c.u, 0);

    var rawG = num(c.goalWords, 0);
    var g = rawG;
    if (c.mig !== 1 && (!rawG || rawG === 4500)) g = DEF_GOAL;
    if (!g || g < 100) g = DEF_GOAL;
    out.goalWords = Math.round(g);
    out.goalU = num(c.goalU, legacyU);

    out.learnedWords = Math.max(0, Math.round(num(c.learnedWords, 0)));
    out.learnedU = num(c.learnedU, 0);

    out.dailyTarget = Math.max(1, Math.round(num(c.dailyTarget, 50) || 50));
    out.dailyU = num(c.dailyU, legacyU);

    out.learnedHist = cleanHist(c.learnedHist);
    // 老数据只有「已掌握」没有历史：把那个时间点当第一条快照，好过一条都没有
    if (!out.learnedHist.length && out.learnedWords > 0 && out.learnedU > 0) {
      out.learnedHist = [{ t: out.learnedU, v: out.learnedWords }];
    }
    out.mig = 1;
    return out;
  }

  function normalize(o) {
    if (!o || typeof o !== 'object') return blank();
    var s = blank();
    s.v = 2;
    s.u = o.u || 0;
    normalizeConfig(o.config, s.config);
    if (Array.isArray(o.todos)) s.todos = o.todos.filter(function (t) { return t && t.id; });
    if (o.days && typeof o.days === 'object') {
      Object.keys(o.days).forEach(function (k) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
        var d = o.days[k] || {};
        s.days[k] = {
          words: Math.max(0, Number(d.words) || 0),
          manual: !!d.manual,
          done: Array.isArray(d.done) ? d.done.slice() : [],
          u: d.u || 0
        };
      });
    }
    return s;
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(K_DATA);
      S = raw ? normalize(JSON.parse(raw)) : blank();
    } catch (e) { S = blank(); }
  }

  function saveLocal() {
    try { localStorage.setItem(K_DATA, JSON.stringify(S)); } catch (e) { }
  }

  function markDirty() {
    try { localStorage.setItem(K_DIRTY, '1'); } catch (e) { }
  }
  function isDirty() {
    try { return localStorage.getItem(K_DIRTY) === '1'; } catch (e) { return false; }
  }
  function clearDirty() {
    try { localStorage.removeItem(K_DIRTY); } catch (e) { }
  }

  function loadSync() {
    try {
      var raw = localStorage.getItem(K_SYNC);
      if (raw) { var o = JSON.parse(raw); syncCfg.gistId = o.gistId || ''; syncCfg.token = o.token || ''; }
    } catch (e) { }
    // cfg.js 里预置的 Gist ID 作为默认值（部署助手写入），本机填过就以本机为准
    var preset = (window.SB_CONFIG && window.SB_CONFIG.gistId) || '';
    if (preset && !syncCfg.gistId) syncCfg.gistId = preset;
  }
  function saveSync() {
    try { localStorage.setItem(K_SYNC, JSON.stringify(syncCfg)); } catch (e) { }
  }

  /* root 指明这次改的是哪一块，只给对应的字段打时间戳。
   * 这样电脑改了每日目标、手机改了已掌握，两边同步不会互相顶掉。 */
  function touch(root) {
    var t = now();
    S.u = t;
    if (root === 'goal' || root === 'config') S.config.goalU = t;
    if (root === 'learned' || root === 'config') S.config.learnedU = t;
    if (root === 'target' || root === 'config') S.config.dailyU = t;
    saveLocal();
    markDirty();
  }

  /* ---------------- 日期 / 规则 ---------------- */
  function dayOf(key, create) {
    var d = S.days[key];
    if (!d) {
      if (!create) return null;
      d = { words: 0, manual: false, done: [], u: now() };
      S.days[key] = d;
    }
    if (!d.done) d.done = [];
    return d;
  }
  function peek(key) { return S.days[key] || null; }
  function isActive(key) {
    var d = peek(key);
    if (!d) return false;
    return (d.words || 0) > 0 || !!d.manual || (d.done && d.done.length > 0);
  }
  function liveTodos() {
    return S.todos.filter(function (t) { return !t.del; });
  }
  function matchRule(rule, d) {
    if (!rule) return true;
    if (rule.type === 'daily') return true;
    if (rule.type === 'weekly') return d.getDay() === Number(rule.weekday);
    if (rule.type === 'monthly') return d.getDate() === Number(rule.day);
    return false;
  }
  function todayTodos() {
    var d = today();
    return liveTodos().filter(function (t) { return matchRule(t.rule, d); });
  }
  function ruleText(rule) {
    if (!rule || rule.type === 'daily') return '每天';
    if (rule.type === 'weekly') return '每周' + WD[Number(rule.weekday)];
    if (rule.type === 'monthly') return '每月 ' + rule.day + ' 号';
    return '每天';
  }

  function streak() {
    var n = 0, c = today();
    if (!isActive(ds(c))) c.setDate(c.getDate() - 1);
    while (isActive(ds(c))) { n++; c.setDate(c.getDate() - 1); }
    return n;
  }
  function totalWords() {
    var s = 0;
    for (var k in S.days) s += (S.days[k].words || 0);
    return s;
  }
  function studyDays() {
    var n = 0;
    for (var k in S.days) if (isActive(k)) n++;
    return n;
  }
  function avg7() {
    var s = 0;
    for (var i = 0; i < 7; i++) { var d = peek(ds(shift(-i))); s += d ? d.words : 0; }
    return s / 7;
  }

  /* ---------------- 进度：以「已掌握」为准 ----------------
   * 打卡数字（新学 + 复习）会重复计算，只能用来算热力图和连续天数，
   * 不能当词书进度。进度条只认你手动填的「已掌握」。
   */
  function goalWords() { return Math.max(1, Math.round(num(S.config.goalWords, DEF_GOAL))); }
  function learned() { return Math.max(0, Math.round(num(S.config.learnedWords, 0))); }

  /* 每天最多留一条快照：同一天改几次只保留最后一次，避免曲线抖动 */
  function learnSnapshot(t, v) {
    var hist = S.config.learnedHist || [];
    var k = ds(new Date(t));
    var hit = false;
    for (var i = 0; i < hist.length; i++) {
      if (ds(new Date(hist[i].t)) === k) { hist[i] = { t: t, v: v }; hit = true; break; }
    }
    if (!hit) hist.push({ t: t, v: v });
    S.config.learnedHist = cleanHist(hist);
  }

  function setLearned(v) {
    v = Math.max(0, Math.round(num(v, 0)));
    S.config.learnedWords = v;
    learnSnapshot(now(), v);
    touch('learned');
  }

  /* 预测速度：B（实测）+ C（估算）
   * B：首尾两条快照的差值 ÷ 中间隔了几天。这是真实速度，优先用。
   * C：只有一条快照时，用「每日新学目标」顶上，并说明这是估的。
   * 都没涨（或反而掉了）就不硬算，退回 C。
   */
  function speedInfo() {
    var hist = S.config.learnedHist || [];
    if (hist.length >= 2) {
      var a = hist[0], b = hist[hist.length - 1];
      var span = (b.t - a.t) / DAY_MS;
      var gain = b.v - a.v;
      if (span >= 1 && gain > 0) {
        return { mode: 'measured', perDay: gain / span, span: Math.round(span), gain: gain };
      }
    }
    return { mode: 'estimate', perDay: Math.max(1, S.config.dailyTarget) };
  }

  /* ================= 合并 ================= */
  function mergeDays(a, b) {
    var out = {};
    var keys = {};
    Object.keys(a || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(b || {}).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) {
      var x = a && a[k], y = b && b[k];
      if (!x) { out[k] = y; return; }
      if (!y) { out[k] = x; return; }
      out[k] = ((y.u || 0) > (x.u || 0)) ? y : x;
    });
    return out;
  }

  function mergeTodos(a, b) {
    var m = {};
    var order = [];
    (a || []).forEach(function (t) {
      if (!t || !t.id) return;
      if (!m[t.id]) order.push(t.id);
      m[t.id] = t;
    });
    (b || []).forEach(function (t) {
      if (!t || !t.id) return;
      var ex = m[t.id];
      if (!ex) { order.push(t.id); m[t.id] = t; return; }
      if ((t.u || 0) > (ex.u || 0)) m[t.id] = t;
    });
    return order.map(function (id) { return m[id]; });
  }

  function mergeState(local, remote) {
    var L = normalize(local), R = normalize(remote);
    var out = blank();
    out.u = Math.max(L.u, R.u);

    // config：三个字段各按自己的时间戳取较新，别人改了目标不会把你的已掌握冲掉
    var lc = L.config, rc = R.config;
    out.config.goalWords = (rc.goalU > lc.goalU) ? rc.goalWords : lc.goalWords;
    out.config.dailyTarget = (rc.dailyU > lc.dailyU) ? rc.dailyTarget : lc.dailyTarget;
    out.config.learnedWords = (rc.learnedU > lc.learnedU) ? rc.learnedWords : lc.learnedWords;
    out.config.goalU = Math.max(lc.goalU, rc.goalU);
    out.config.dailyU = Math.max(lc.dailyU, rc.dailyU);
    out.config.learnedU = Math.max(lc.learnedU, rc.learnedU);

    // 快照两边都留着（按天去重），这样两台设备交替记录也能连出一条完整曲线
    out.config.learnedHist = cleanHist(lc.learnedHist.concat(rc.learnedHist));
    out.config.mig = 1;

    out.todos = mergeTodos(L.todos, R.todos);
    out.days = mergeDays(L.days, R.days);
    return out;
  }

  function samePayload(a, b) {
    // 只比较业务字段，忽略顶层 u
    var A = { c: [a.config.goalWords, a.config.dailyTarget, a.config.learnedWords, a.config.learnedHist], t: a.todos, d: a.days };
    var B = { c: [b.config.goalWords, b.config.dailyTarget, b.config.learnedWords, b.config.learnedHist], t: b.todos, d: b.days };
    return JSON.stringify(A) === JSON.stringify(B);
  }

  /* ================= 同步 ================= */
  var syncing = false;
  var statusKind = 'idle';   // idle | ok | warn | err | busy
  var statusText = '未连接';

  function setStatus(kind, text) {
    statusKind = kind;
    statusText = text;
    var b = $('syncBtn');
    if (!b) return;
    b.className = 'sync' + (kind === 'idle' ? '' : ' ' + kind);
    $('syncTxt').textContent = text;
  }

  function apiFetch(url, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers['Accept'] = 'application/vnd.github+json';
    opts.headers['Authorization'] = 'Bearer ' + syncCfg.token;
    opts.headers['X-GitHub-Api-Version'] = '2022-11-28';
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    opts.cache = 'no-store';
    // keepalive：页面关闭 / 锁屏时请求不会被浏览器取消（限 64KB，我们数据远小于此）
    if (opts.keepalive == null) opts.keepalive = true;
    return fetch(url, opts);
  }

  function gistIdFromInput(v) {
    v = (v || '').trim();
    // 支持粘贴整个 gist 链接
    var m = v.match(/gist\.github\.com\/[^\/]+\/([0-9a-f]+)/i);
    if (m) return m[1];
    var m2 = v.match(/([0-9a-f]{20,})/i);
    return m2 ? m2[1] : v;
  }

  function syncNow(reason, fast) {
    if (!syncCfg.gistId || !syncCfg.token) {
      setStatus('idle', '未连接');
      return Promise.resolve(false);
    }
    if (syncing) return Promise.resolve(false);

    // fast：页面正在隐藏，只有本地改动，直接推，不再拉远端做合并。
    // 目的只有一个——别让刚点的打卡丢在半路。
    if (fast) {
      clearTimeout(syncTimer);          // 取消待执行的定时同步，避免紧接着重复请求
      if (!isDirty()) return Promise.resolve(false);
      syncing = true;
      return pushGist().catch(function () {
        setStatus('warn', '离线待同步');
        return false;
      }).then(function (r) { syncing = false; return r; });
    }

    syncing = true;
    setStatus('busy', '同步中');

    var url = API + '/gists/' + encodeURIComponent(syncCfg.gistId);

    return apiFetch(url).then(function (res) {
      if (res.status === 401) throw new Error('TOKEN');
      if (res.status === 404) throw new Error('GIST');
      if (!res.ok) throw new Error('HTTP' + res.status);
      return res.json();
    }).then(function (gist) {
      var file = gist.files && gist.files[GIST_FILE];
      var remoteRaw = file && file.content ? file.content : '{}';
      if (file && file.truncated && file.raw_url) {
        return fetch(file.raw_url, { cache: 'no-store' }).then(function (r) { return r.text(); });
      }
      return remoteRaw;
    }).then(function (raw) {
      var remote;
      try { remote = normalize(JSON.parse(raw)); }
      catch (e) { remote = blank(); }

      var merged = mergeState(S, remote);
      var needPush = !samePayload(merged, remote);

      S = merged;
      saveLocal();

      if (!needPush) {
        clearDirty();
        setStatus('ok', '已同步 ' + hhmm());
        renderAll();
        return false;
      }
      return pushGist().then(function () { return true; });
    }).catch(function (err) {
      var msg = err && err.message;
      if (msg === 'TOKEN') {
        setStatus('err', 'Token 无效');
        $('syncDetail') && ($('syncDetail').textContent = 'Token 无效或已过期，请重新生成（只勾 Gists 读写）。');
      } else if (msg === 'GIST') {
        setStatus('err', 'Gist 不存在');
        $('syncDetail') && ($('syncDetail').textContent = '找不到这个 Gist：可能 ID 错了，或 Token 没有访问权限。');
      } else {
        setStatus('warn', '离线待同步');
      }
      renderAll();
      return false;
    }).then(function (r) {
      syncing = false;
      return r;
    });
  }

  function pushGist() {
    var url = API + '/gists/' + encodeURIComponent(syncCfg.gistId);
    var body = {};
    body[GIST_FILE] = { content: JSON.stringify(S) };
    return apiFetch(url, { method: 'PATCH', body: JSON.stringify({ files: body }) })
      .then(function (res) {
        if (res.status === 401) throw new Error('TOKEN');
        if (res.status === 404) throw new Error('GIST');
        if (!res.ok) throw new Error('HTTP' + res.status);
        clearDirty();
        setStatus('ok', '已同步 ' + hhmm());
        renderAll();
        return true;
      });
  }

  function hhmm() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  var syncTimer = null;
  function scheduleSync(ms) {
    if (!syncCfg.gistId || !syncCfg.token) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { syncNow('auto'); }, ms == null ? 1200 : ms);
  }

  /* ================= 渲染 ================= */
  function renderToday() {
    var t = today(), key = ds(t), d = dayOf(key, false);
    var words = d ? d.words : 0;
    var active = isActive(key);

    $('todayDate').textContent = (t.getMonth() + 1) + '月' + t.getDate() + '日 · ' + WD[t.getDay()];
    // 数字就在下面一行显示，标题不再重复一遍
    $('heroTitle').textContent = active ? '今天已记录' : '今天还没开始';
    $('streakNum').textContent = streak();

    var btn = $('checkinBtn'), txt = $('checkinTxt'), ico = $('checkinIco');
    if (active) {
      btn.classList.add('done');
      ico.textContent = '✓';
      txt.textContent = '今天已完成 · 点一下取消';
    } else {
      btn.classList.remove('done');
      ico.textContent = '';
      txt.textContent = '打卡：今天学了';
    }

    $('wordNum').textContent = words;
    var pill = $('wordPill');
    pill.textContent = '目标 ' + S.config.dailyTarget + ' 词';
    pill.classList.toggle('on', words >= S.config.dailyTarget);
    $('wordLabel').classList.toggle('done', words > 0);

    // 今日页露一手「已掌握」，省得为了看一眼进度切到回顾页
    var g = goalWords(), lw = learned();
    $('learnNum').textContent = lw.toLocaleString();
    $('learnGoal').textContent = g.toLocaleString();
    $('learnBar').style.width = Math.min(100, lw / g * 100) + '%';

    renderTodos(d);
  }

  function renderTodos(d) {
    var list = $('todoList');
    var items = todayTodos();
    var doneIds = (d && d.done) ? d.done : [];

    list.innerHTML = '';
    if (!items.length) {
      var p = document.createElement('p');
      p.className = 'hint';
      p.style.margin = '14px 0 0';
      p.textContent = '还没有其他待办。下面加一条，比如「语法 30 分钟」。';
      list.appendChild(p);
      return;
    }

    items.forEach(function (t) {
      var done = doneIds.indexOf(t.id) >= 0;
      var row = document.createElement('div');
      row.className = 'todo' + (done ? ' done' : '');
      row.innerHTML =
        '<span class="tick">✓</span>' +
        '<div class="todo-body"><div class="todo-title"></div>' +
        '<div class="todo-rule"></div></div>' +
        '<button class="todo-del" aria-label="删除">×</button>';
      row.querySelector('.todo-title').textContent = t.title;
      row.querySelector('.todo-rule').textContent = ruleText(t.rule);

      row.addEventListener('click', function (e) {
        if (e.target.classList.contains('todo-del')) return;
        var dd = dayOf(ds(today()), true);
        var i = dd.done.indexOf(t.id);
        if (i >= 0) dd.done.splice(i, 1); else dd.done.push(t.id);
        dd.u = now();
        touch();
        renderToday();
        scheduleSync();
      });

      row.querySelector('.todo-del').addEventListener('click', function (e) {
        e.stopPropagation();
        if (!confirm('删除待办「' + t.title + '」？历史打卡记录会保留。')) return;
        var target = null;
        S.todos.forEach(function (x) { if (x.id === t.id) target = x; });
        if (target) { target.del = true; target.u = now(); }
        touch();
        renderToday();
        scheduleSync();
        toast('已删除');
      });

      list.appendChild(row);
    });
  }

  function renderReview() {
    var g = goalWords(), lw = learned();
    var pct = Math.min(100, Math.round(lw / g * 100));

    $('stTotalWords').textContent = totalWords().toLocaleString();
    $('stDays').textContent = studyDays();
    $('stAvg').textContent = Math.round(avg7());

    $('pgDone').textContent = lw.toLocaleString();
    $('pgGoal').textContent = g.toLocaleString();
    $('pgLeft').textContent = '剩 ' + Math.max(0, g - lw).toLocaleString();
    $('pctPill').textContent = pct + '%';
    $('pgBar').style.width = pct + '%';

    renderForecast(g, lw);
    renderHeatmap();
    renderLast7();
  }

  /* 预测文案：说清「这个速度是哪来的」，别让估算冒充实测 */
  function renderForecast(g, lw) {
    var fc = $('forecast');
    var rest = Math.max(0, g - lw);

    if (lw <= 0) {
      fc.innerHTML = '在你的 app 里看一眼「已掌握」多少，点上面的数字填进来，这里就能算出还要多久。';
      return;
    }
    if (rest === 0) {
      fc.textContent = '这本词书已经过完了。';
      return;
    }

    var sp = speedInfo();
    var days = Math.max(1, Math.ceil(rest / sp.perDay));
    var months = Math.round(days / 30 * 10) / 10;
    var tail = days > 45 ? '（约 ' + months + ' 个月）' : '';

    if (sp.mode === 'measured') {
      fc.innerHTML = '最近 <b>' + sp.span + '</b> 天实测每天多掌握 <b>' + sp.perDay.toFixed(1) +
        '</b> 词，还差 <b>' + rest + '</b> 词，大约 <b>' + days + '</b> 天' + tail + '。';
    } else {
      fc.innerHTML = '只有一次记录，先按每天新学目标 <b>' + sp.perDay +
        '</b> 词估算，大约 <b>' + days + '</b> 天' + tail +
        '。再记一两次就能按你的真实速度算。';
    }
  }

  function levelOf(words, active) {
    if (!active) return 0;
    if (words >= 150) return 4;
    if (words >= 80) return 3;
    if (words >= 30) return 2;
    return 1;
  }

  function renderHeatmap() {
    var box = $('heatmap');
    box.innerHTML = '';
    // 列数跟着容器算，18 周在手机上只剩 2/3 宽，看上去像没画满
    var cellW = 13, gap = 3, pad = 2;
    var avail = (box.clientWidth || 320) - pad * 2;
    var WEEKS = Math.max(10, Math.min(26, Math.floor((avail + gap) / (cellW + gap))));
    var t = today();
    var end = new Date(t);
    end.setDate(end.getDate() + (6 - end.getDay()));
    var start = new Date(end);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));
    box.style.gap = gap + 'px';

    for (var w = 0; w < WEEKS; w++) {
      var col = document.createElement('div');
      col.className = 'hm-col';
      col.style.gap = gap + 'px';
      for (var i = 0; i < 7; i++) {
        var d = new Date(start);
        d.setDate(d.getDate() + w * 7 + i);
        var key = ds(d);
        var rec = peek(key);
        var future = d > t;
        var lv = levelOf(rec ? rec.words : 0, isActive(key));
        var cell = document.createElement('div');
        cell.className = 'hm-cell' + (future ? '' : (lv ? ' l' + lv : '')) + (key === ds(t) ? ' today' : '');
        cell.style.width = cellW + 'px';
        cell.style.height = cellW + 'px';
        if (future) { cell.style.visibility = 'hidden'; }
        else {
          cell.title = key + ' · ' + (rec && rec.words ? rec.words + ' 词' : (isActive(key) ? '已学习' : '无记录'));
          (function (k) { cell.addEventListener('click', function () { openSheet(k); }); })(key);
        }
        col.appendChild(cell);
      }
      box.appendChild(col);
    }
    box.scrollLeft = box.scrollWidth;
    var wk = $('hmWeeks');
    if (wk) wk.textContent = '近 ' + WEEKS + ' 周';
  }

  function renderLast7() {
    var box = $('last7');
    var rows = [];
    for (var i = 6; i >= 0; i--) {
      var d = shift(-i), key = ds(d), rec = peek(key);
      var w = rec ? rec.words : 0;
      var mark = isActive(key) ? '✓' : '·';
      rows.push('<div style="display:flex;justify-content:space-between">' +
        '<span>' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + WD_S[d.getDay()] + '</span>' +
        '<span style="color:' + (w ? 'var(--ink)' : 'var(--muted)') + ';font-variant-numeric:tabular-nums">' +
        mark + '  ' + (w ? w + ' 词' : '—') + '</span></div>');
    }
    box.innerHTML = rows.join('');
  }

  function renderSettings() {
    $('goalInput').value = goalWords();
    $('learnedInput').value = learned();
    $('targetInput').value = S.config.dailyTarget;
    $('gistInput').value = syncCfg.gistId;
    $('tokenInput').value = syncCfg.token;

    var det = $('syncDetail');
    if (!syncCfg.gistId || !syncCfg.token) {
      det.textContent = '尚未配置。配置后手机和电脑可共享同一份记录。';
    } else if (isDirty()) {
      det.textContent = '有改动还没传上去，联网后会自动重试。';
    } else {
      det.textContent = '已连接 · ' + syncCfg.gistId.slice(0, 8) + '… 手机和电脑共用这一份数据。';
    }
  }

  function renderAll() { renderToday(); renderReview(); renderSettings(); }

  /* ================= Sheet ================= */
  var sheetKey = null;

  function openSheet(key) {
    sheetKey = key;
    var rec = peek(key);
    var d = parseDay(key);
    var isToday = key === ds(today());
    $('sheetTitle').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + WD[d.getDay()];
    $('sheetSub').textContent = isToday ? '今天' : '补录 / 修改历史记录';
    $('sheetWords').value = rec ? rec.words : 0;
    $('sheetManual').checked = rec ? !!rec.manual : false;

    // 「已掌握」只对今天开放：历史那天你填不出当时的累计数，填了反而把曲线带歪
    var g = goalWords(), lw = learned();
    $('sheetLearnWrap').hidden = !isToday;
    $('sheetLearn').value = lw;
    $('sheetLearnTotal').textContent = g.toLocaleString();

    var m = $('mask');
    m.hidden = false;
    requestAnimationFrame(function () { m.classList.add('show'); });
  }
  function closeSheet() {
    var m = $('mask');
    m.classList.remove('show');
    setTimeout(function () { m.hidden = true; }, 200);
  }

  /* ================= 交互 ================= */
  function bumpStreak() {
    var el = $('streakNum');
    el.classList.add('bump');
    setTimeout(function () { el.classList.remove('bump'); }, 280);
  }

  function addWords(n) {
    var d = dayOf(ds(today()), true);
    d.words = Math.max(0, d.words + n);
    d.u = now();
    touch();
    renderAll();
    bumpStreak();
    if (n > 0) toast('+' + n + ' 词，今天共 ' + d.words + ' 词');
    else toast('已退回，今天 ' + d.words + ' 词');
    scheduleSync();
  }

  function bind() {
    $('syncBtn').addEventListener('click', function () {
      if (!syncCfg.gistId || !syncCfg.token) {
        toast('先在设置里填 Gist ID 和 Token');
        switchView('settings');
        return;
      }
      syncNow('manual').then(function (did) {
        if (!did && statusKind === 'ok') toast('已是最新');
      });
    });

    $('checkinBtn').addEventListener('click', function () {
      var key = ds(today());
      var d = dayOf(key, false);
      var active = isActive(key);
      if (!active) {
        var dd = dayOf(key, true);
        dd.manual = true;
        dd.u = now();
        touch(); renderAll(); bumpStreak();
        toast('已打卡 · 连续 ' + streak() + ' 天');
        scheduleSync();
      } else if (active && (d.words || 0) === 0 && (d.done || []).length === 0) {
        // 只有「空打卡」才允许一键取消；已经有词数的记录不让这个按钮抹掉
        d.manual = false; d.u = now();
        touch(); renderAll();
        toast('已取消今天的打卡');
        scheduleSync();
      } else {
        // 已经记了东西：不撒谎也不清空，直接把面板打开让他改
        openSheet(key);
      }
    });

    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () { addWords(Number(b.dataset.add)); });
    });

    $('undoBtn').addEventListener('click', function () { addWords(-20); });
    $('customBtn').addEventListener('click', function () { openSheet(ds(today())); });
    $('wordLabel').addEventListener('click', function () { openSheet(ds(today())); });
    $('learnRow').addEventListener('click', function () { openSheet(ds(today())); });

    var ruleSel = $('todoRule');
    ruleSel.addEventListener('change', function () {
      $('subWeekly').hidden = ruleSel.value !== 'weekly';
      $('subMonthly').hidden = ruleSel.value !== 'monthly';
    });

    function addTodo() {
      var inp = $('todoInput');
      var title = inp.value.trim();
      if (!title) { inp.focus(); return; }
      var rule = { type: ruleSel.value };
      if (rule.type === 'weekly') rule.weekday = Number($('todoWeekday').value);
      if (rule.type === 'monthly') rule.day = Number($('todoDay').value) || 1;
      S.todos.push({ id: uid(), title: title, rule: rule, u: now() });
      inp.value = '';
      touch(); renderToday();
      toast('已添加 · ' + ruleText(rule));
      scheduleSync();
    }
    $('todoAdd').addEventListener('click', addTodo);
    $('todoInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') addTodo(); });

    $('sheetCancel').addEventListener('click', closeSheet);
    $('mask').addEventListener('click', function (e) { if (e.target.id === 'mask') closeSheet(); });
    $('sheetSave').addEventListener('click', function () {
      if (!sheetKey) return;
      var d = dayOf(sheetKey, true);
      d.words = Math.max(0, parseInt($('sheetWords').value, 10) || 0);
      d.manual = $('sheetManual').checked;
      d.u = now();

      // 同一次保存里把「已掌握」也更新掉，少一次开关面板
      var isToday = sheetKey === ds(today());
      if (isToday) {
        var lv = parseInt($('sheetLearn').value, 10);
        if (!isNaN(lv) && lv >= 0) setLearned(lv);
      }

      touch(); closeSheet(); renderAll();
      toast('已保存');
      scheduleSync();
    });

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });

    $('goalInput').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!v || v < 100) { this.value = goalWords(); return; }
      S.config.goalWords = v;
      touch('goal'); renderAll(); toast('词书总量已更新');
      scheduleSync();
    });
    $('learnedInput').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v) || v < 0) { this.value = learned(); return; }
      if (v > goalWords()) { this.value = learned(); toast('不能超过词书总量'); return; }
      setLearned(v);
      renderAll(); toast('已掌握更新为 ' + v + ' 词');
      scheduleSync();
    });
    $('targetInput').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!v || v < 1) { this.value = S.config.dailyTarget; return; }
      S.config.dailyTarget = v;
      touch('target'); renderAll(); toast('每日目标已更新');
      scheduleSync();
    });

    $('saveSync').addEventListener('click', function () {
      var g = gistIdFromInput($('gistInput').value || syncCfg.gistId);
      var tk = $('tokenInput').value.trim();
      if (!g) { toast('缺少 Gist ID，可展开「手动修改 Gist ID」填写'); return; }
      if (!tk) { toast('请填 Token'); return; }
      syncCfg.gistId = g;
      syncCfg.token = tk;
      saveSync();
      setStatus('busy', '同步中');
      syncNow('save').then(function () {
        renderSettings();
      });
    });

    $('testSync').addEventListener('click', function () {
      var g = gistIdFromInput($('gistInput').value || syncCfg.gistId);
      var tk = $('tokenInput').value.trim();
      if (!g || !tk) { toast('Gist ID 和 Token 都要填'); return; }
      var bak = { gistId: syncCfg.gistId, token: syncCfg.token };
      syncCfg.gistId = g; syncCfg.token = tk;
      setStatus('busy', '测试中');
      apiFetch(API + '/gists/' + encodeURIComponent(g)).then(function (res) {
        if (res.status === 401) throw new Error('TOKEN');
        if (res.status === 404) throw new Error('GIST');
        if (!res.ok) throw new Error('HTTP' + res.status);
        return res.json();
      }).then(function (gist) {
        var f = gist.files && gist.files[GIST_FILE];
        setStatus('ok', '连接正常');
        toast(f ? '连接正常，已有数据文件' : '连接正常，首次同步会自动创建文件');
      }).catch(function (err) {
        // 测试失败要把配置还原，并把状态清干净，避免误导
        syncCfg.gistId = bak.gistId; syncCfg.token = bak.token;
        var m = err && err.message;
        if (m === 'TOKEN') { setStatus('err', 'Token 无效'); toast('Token 无效或权限不足'); }
        else if (m === 'GIST') { setStatus('err', 'Gist 不存在'); toast('找不到这个 Gist'); }
        else { setStatus('err', '连不上'); toast('网络不通，检查代理'); }
        setTimeout(function () {
          if (statusKind === 'err') {
            setStatus(syncCfg.gistId && syncCfg.token ? 'warn' : 'idle',
              syncCfg.gistId && syncCfg.token ? '待同步' : '未连接');
          }
        }, 2600);
      });
    });

    $('clearSync').addEventListener('click', function () {
      if (!confirm('断开同步？本机数据会保留，只是不再上传。')) return;
      syncCfg.gistId = ''; syncCfg.token = '';
      saveSync();
      setStatus('idle', '未连接');
      renderSettings();
      toast('已断开');
    });

    $('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'studybench-' + ds(today()) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('已导出');
    });

    $('importBtn').addEventListener('click', function () { $('fileInput').click(); });
    $('fileInput').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj || typeof obj !== 'object' || !obj.days) throw new Error('不是这个工具的备份文件');
          if (!confirm('导入会覆盖本机数据（不会删云端），确定？')) return;
          S = normalize(obj);
          saveLocal(); markDirty(); renderAll();
          toast('导入成功');
          scheduleSync();
        } catch (err) { alert('读不出来：' + err.message); }
      };
      r.readAsText(f);
      e.target.value = '';
    });

    $('clearBtn').addEventListener('click', function () {
      if (!confirm('清空这台设备上的记录？\n云端数据不受影响，下次同步会重新拉回来。')) return;
      localStorage.removeItem(K_DATA);
      S = blank(); saveLocal(); renderAll();
      toast('已清空本机');
    });

    // 页面隐藏（锁屏 / 切走 / 关标签）前立刻把改动推上去；
    // 回到前台时无条件拉一次远端，这样另一台设备的记录能马上看到
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (isDirty()) syncNow('hidden', true);
      } else {
        renderToday();
        scheduleSync(300);
      }
    });
    window.addEventListener('online', function () { scheduleSync(300); });
    window.addEventListener('pagehide', function () {
      if (isDirty()) syncNow('pagehide', true);
    });
  }

  function switchView(v) {
    document.querySelectorAll('.tab').forEach(function (x) {
      x.classList.toggle('on', x.dataset.view === v);
    });
    ['today', 'review', 'settings'].forEach(function (k) {
      $('view-' + k).hidden = (k !== v);
    });
    window.scrollTo(0, 0);
    if (v === 'review') renderReview();
    if (v === 'settings') renderSettings();
  }

  /* ================= 启动 ================= */
  loadLocal();
  loadSync();
  var paired = consumePairLink();
  bind();
  renderAll();

  if (syncCfg.gistId && syncCfg.token) {
    if (!paired) setStatus(isDirty() ? 'warn' : 'ok', isDirty() ? '待同步' : '已连接');
    scheduleSync(paired ? 200 : 400);
    if (paired) toast('已自动配对，开始同步');
  } else {
    setStatus('idle', '未连接');
  }

  // 只在 https 或 localhost 注册（file:// 与局域网 IP 不支持 SW）
  var canSW = 'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
     location.hostname === 'localhost' ||
     location.hostname === '127.0.0.1');
  if (canSW) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
})();
