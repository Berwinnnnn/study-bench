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

  function blank() {
    return {
      v: 2,
      u: 0,
      config: { goalWords: 4500, dailyTarget: 50, u: 0 },
      todos: [],
      days: {}
    };
  }

  function normalize(o) {
    if (!o || typeof o !== 'object') return blank();
    var s = blank();
    s.v = 2;
    s.u = o.u || 0;
    if (o.config) {
      s.config.goalWords = Number(o.config.goalWords) || 4500;
      s.config.dailyTarget = Number(o.config.dailyTarget) || 50;
      s.config.u = o.config.u || 0;
    }
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

  function touch(root) {
    S.u = now();
    if (root === 'config') S.config.u = now();
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
    // config：取较新
    if ((R.config.u || 0) > (L.config.u || 0)) {
      out.config = { goalWords: R.config.goalWords, dailyTarget: R.config.dailyTarget, u: R.config.u };
    } else {
      out.config = { goalWords: L.config.goalWords, dailyTarget: L.config.dailyTarget, u: L.config.u };
    }
    out.todos = mergeTodos(L.todos, R.todos);
    out.days = mergeDays(L.days, R.days);
    return out;
  }

  function samePayload(a, b) {
    // 只比较业务字段，忽略顶层 u
    var A = { c: [a.config.goalWords, a.config.dailyTarget], t: a.todos, d: a.days };
    var B = { c: [b.config.goalWords, b.config.dailyTarget], t: b.todos, d: b.days };
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

  function syncNow(reason) {
    if (!syncCfg.gistId || !syncCfg.token) {
      setStatus('idle', '未连接');
      return Promise.resolve(false);
    }
    if (syncing) return Promise.resolve(false);
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
    $('heroTitle').textContent = active
      ? (words > 0 ? '今天已背 ' + words + ' 词' : '今天已完成')
      : '今天还没开始';
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
    var tw = totalWords();
    var goal = S.config.goalWords || 4500;
    var pct = Math.min(100, Math.round(tw / goal * 100));

    $('stTotalWords').textContent = tw.toLocaleString();
    $('stDays').textContent = studyDays();
    $('stAvg').textContent = Math.round(avg7());

    $('pgDone').textContent = tw.toLocaleString();
    $('pgGoal').textContent = goal.toLocaleString();
    $('pgLeft').textContent = '剩 ' + Math.max(0, goal - tw).toLocaleString();
    $('pctPill').textContent = pct + '%';
    $('pgBar').style.width = pct + '%';

    var a = avg7();
    var fc = $('forecast');
    if (a < 1) {
      fc.textContent = '还没有足够数据估算。先背几天，这里会自己算出来。';
    } else {
      var rest = Math.max(0, goal - tw);
      if (rest === 0) {
        fc.textContent = '四级词表已经过完了。';
      } else {
        var days = Math.ceil(rest / a);
        fc.innerHTML = '按最近 7 天平均 <b>' + a.toFixed(1) + '</b> 词/天，大约还需 <b>' +
          days + '</b> 天（约 ' + (Math.round(days / 30 * 10) / 10) + ' 个月）。';
      }
    }

    renderHeatmap();
    renderLast7();
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
    var WEEKS = 18;
    var t = today();
    var end = new Date(t);
    end.setDate(end.getDate() + (6 - end.getDay()));
    var start = new Date(end);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));

    for (var w = 0; w < WEEKS; w++) {
      var col = document.createElement('div');
      col.className = 'hm-col';
      for (var i = 0; i < 7; i++) {
        var d = new Date(start);
        d.setDate(d.getDate() + w * 7 + i);
        var key = ds(d);
        var rec = peek(key);
        var future = d > t;
        var cell = document.createElement('div');
        cell.className = 'hm-cell' +
          (future ? '' : (levelOf(rec ? rec.words : 0, isActive(key)) ? ' l' + levelOf(rec ? rec.words : 0, isActive(key)) : '')) +
          (key === ds(t) ? ' today' : '');
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
    $('goalInput').value = S.config.goalWords;
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
    $('sheetTitle').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + WD[d.getDay()];
    $('sheetSub').textContent = key === ds(today()) ? '今天' : '补录 / 修改历史记录';
    $('sheetWords').value = rec ? rec.words : 0;
    $('sheetManual').checked = rec ? !!rec.manual : false;
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
      } else if ((d.words || 0) === 0 && d.done.length === 0) {
        d.manual = false; d.u = now();
        touch(); renderAll();
        toast('已取消今天的打卡');
        scheduleSync();
      } else {
        toast('今天已经记录了，要改点上面的数字');
      }
    });

    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () { addWords(Number(b.dataset.add)); });
    });

    $('undoBtn').addEventListener('click', function () { addWords(-20); });
    $('customBtn').addEventListener('click', function () { openSheet(ds(today())); });
    $('wordLabel').addEventListener('click', function () { openSheet(ds(today())); });

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
      touch(); closeSheet(); renderAll();
      toast('已保存');
      scheduleSync();
    });

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });

    $('goalInput').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!v || v < 100) { this.value = S.config.goalWords; return; }
      S.config.goalWords = v;
      touch('config'); renderReview(); toast('目标已更新');
      scheduleSync();
    });
    $('targetInput').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!v || v < 1) { this.value = S.config.dailyTarget; return; }
      S.config.dailyTarget = v;
      touch('config'); renderToday(); toast('每日目标已更新');
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

    // 回到前台 / 联网时补同步
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        renderToday();
        if (isDirty() || statusKind === 'warn') scheduleSync(300);
      }
    });
    window.addEventListener('online', function () { scheduleSync(300); });
    window.addEventListener('beforeunload', function () {
      if (isDirty()) scheduleSync(0);
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
