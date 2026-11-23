/* 学习打卡 · v3 —— 21 套主题版
 *
 * 相对 v2 的变化：
 * 1. 主题从 1 套扩到 21 套，只改 <body data-s>，所有样式由 themes.js 提供
 * 2. 主题选择写进 config.theme + 独立时间戳 themeU，随 Gist 双端同步
 * 3. 渲染层按新版式重写；数据 / 同步 / 合并 / 预测逻辑与 v2 完全一致
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
  var DEF_GOAL = 3597;
  var DAY_MS = 86400000;

  /* ---------------- 工具 ---------------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ds(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function shift(n) { var d = today(); d.setDate(d.getDate() + n); return d; }
  function now() { return Date.now(); }
  function parseDay(s) { return new Date(s + 'T00:00:00'); }
  function $(id) { return document.getElementById(id); }
  function num(v, d) { var n = Number(v); return isFinite(n) ? n : d; }

  /* 感知亮度：判断这个底色算深色还是浅色，用于 color-scheme 与防闪色缓存 */
  function luminance(hex) {
    var s = String(hex || '').trim();
    var m = s.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return 255;
    return 0.2126 * parseInt(m[1], 16) + 0.7152 * parseInt(m[2], 16) + 0.0722 * parseInt(m[3], 16);
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  function uid() { return 't' + now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------------- 配对链接 ---------------- */
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
      v: 3,
      u: 0,
      config: {
        goalWords: DEF_GOAL, goalU: 0, mig: 1,
        learnedWords: 0, learnedU: 0, learnedHist: [],
        dailyTarget: 50, dailyU: 0,
        theme: 's01', themeU: 0
      },
      todos: [],
      days: {}
    };
  }

  /* 快照数组清洗：按天去重，按时间排序，只留最近 40 条 */
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
    if (!out.learnedHist.length && out.learnedWords > 0 && out.learnedU > 0) {
      out.learnedHist = [{ t: out.learnedU, v: out.learnedWords }];
    }
    out.mig = 1;

    /* 主题：非法 id 一律退回 s01，保证不会因为数据脏了而白屏 */
    var tid = String(c.theme || '');
    out.theme = themeById(tid) ? tid : 's01';
    out.themeU = num(c.themeU, 0);
    return out;
  }

  function normalize(o) {
    if (!o || typeof o !== 'object') return blank();
    var s = blank();
    s.v = 3;
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

  function markDirty() { try { localStorage.setItem(K_DIRTY, '1'); } catch (e) { } }
  function isDirty() { try { return localStorage.getItem(K_DIRTY) === '1'; } catch (e) { return false; } }
  function clearDirty() { try { localStorage.removeItem(K_DIRTY); } catch (e) { } }

  function loadSync() {
    try {
      var raw = localStorage.getItem(K_SYNC);
      if (raw) { var o = JSON.parse(raw); syncCfg.gistId = o.gistId || ''; syncCfg.token = o.token || ''; }
    } catch (e) { }
    var preset = (window.SB_CONFIG && window.SB_CONFIG.gistId) || '';
    if (preset && !syncCfg.gistId) syncCfg.gistId = preset;
  }
  function saveSync() {
    try { localStorage.setItem(K_SYNC, JSON.stringify(syncCfg)); } catch (e) { }
  }

  /* root 指明这次改的是哪一块，只给对应字段打时间戳 */
  function touch(root) {
    var t = now();
    S.u = t;
    if (root === 'goal' || root === 'config') S.config.goalU = t;
    if (root === 'learned' || root === 'config') S.config.learnedU = t;
    if (root === 'target' || root === 'config') S.config.dailyU = t;
    if (root === 'theme') S.config.themeU = t;
    saveLocal();
    markDirty();
  }

  /* ================= 主题 ================= */
  var TH = window.SB_THEMES || { base: '', skel: '', list: [] };
  var THEMES = TH.list || [];
  var THEME_MAP = {};
  THEMES.forEach(function (t) { THEME_MAP[t.id] = t; });

  function themeById(id) { return THEME_MAP[id] || null; }

  /* 生成某个主题的 CSS 变量块 + 该主题的所有样式 */
  function themeBlock(t) {
    var c = t.c;
    return '[data-s="' + t.id + '"]{'
      + '--bg:' + c.bg + ';--sur:' + c.sur + ';--ink:' + c.ink + ';--ink2:' + c.ink2
      + ';--mut:' + c.mut + ';--line:' + c.line + ';--ac:' + c.ac + ';--acd:' + c.acd
      + ';--acl:' + c.acl + ';--alt:' + c.alt + ';--onac:' + c.onac
      + ';--fam:' + t.f.fam + ';--num:' + t.f.num + ';--nwt:' + t.f.w + ';--nlsp:' + t.f.lsp
      + ';--r:' + t.r + ';--bd:' + t.bd + ';--sh:' + t.sh + ';--br:' + t.br
      + ';--bbd:' + t.bbd + ';--bsh:' + t.bsh + ';--pill:' + t.pill
      + ';--ckr:' + t.ckr + ';--std:' + t.std + ';--nfs:' + t.nfs + ';--bls:' + t.bls
      + '}'
      + (t.css || '')
      + (t.l1 || '') + (t.l2 || '') + (t.l3 || '') + (t.l4 || '') + (t.l5 || '');
  }

  var themeStyleEl = null;
  var currentThemeId = null;

  function applyTheme(id, skipSave) {
    var t = themeById(id) || THEMES[0];
    if (!t) return;

    if (!themeStyleEl) {
      themeStyleEl = document.createElement('style');
      themeStyleEl.id = 'theme-css';
      document.head.appendChild(themeStyleEl);
    }
    /* 只保留当前这一套：单主题 css 约 8KB，比全部 21 套 180KB 轻得多 */
    themeStyleEl.textContent = themeBlock(t);

    /* 主题挂在 <html> 上：变量、底色和整份主题样式都在这一层，
       body 只做继承。这样首帧（<head> 里的防闪色脚本）和切换后
       走的是同一条取值路径，不会出现两套颜色打架。 */
    document.documentElement.setAttribute('data-s', t.id);
    var c = t.c;

    /* 同步 meta theme-color，让手机浏览器地址栏跟着变色 */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', c.bg);

    /* 深色主题下让原生控件（滚动条、输入框光标、下拉）跟着变深 */
    document.documentElement.style.colorScheme = luminance(c.bg) < 128 ? 'dark' : 'light';

    currentThemeId = t.id;

    if (!skipSave && S && S.config.theme !== t.id) {
      S.config.theme = t.id;
      touch('theme');
      scheduleSync();
    }

    renderThemePickers();
    renderThemeNow();
    syncHeroAlign();
  }

  /* 主题可能把 hero 改成右对齐 / 居中，徽章与快捷加词会挤在同一行的右侧。
     这里做一次真实碰撞检测：量准两者的矩形，只有真正叠到「会压住文字」的程度
     才把快捷组下移一行。用实测值判断，不按主题 id 硬编码。 */
  function syncHeroAlign() {
    var hero = document.querySelector('.phero');
    if (!hero) return;
    hero.classList.remove('fend');
    var stk = hero.querySelector('.pstk');
    var qk = hero.querySelector('.pquick');
    if (!stk || !qk) return;

    var a = stk.getBoundingClientRect();
    var b = qk.getBoundingClientRect();
    /* 水平交叠超过 8px 且纵向也交叠，才算真的压住了 */
    var ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    var oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 8 && oy > 4) hero.classList.add('fend');
  }

  function renderThemeNow() {
    var t = themeById(currentThemeId) || THEMES[0];
    var el = $('themeNow');
    if (el && t) el.textContent = '当前 ' + t.no + ' ' + t.name;
  }

  function renderThemePickers() {
    /* 设置页里的小色板：7 列，21 套刚好 3 行 */
    var grid = $('themeGrid');
    if (grid) {
      var html = '';
      THEMES.forEach(function (t) {
        html += '<i data-th="' + t.id + '" class="' + (t.id === currentThemeId ? 'on' : '')
          + '" style="--tc:' + t.key + '" title="' + t.no + ' ' + t.name + '"></i>';
      });
      grid.innerHTML = html;
    }
    /* 换风格面板：3 列，带色带与名称 */
    var g2 = $('thGrid');
    if (g2) {
      var h2 = '';
      THEMES.forEach(function (t) {
        h2 += '<div class="th-item ' + (t.id === currentThemeId ? 'on' : '') + '" data-th="' + t.id + '">'
          + '<div class="th-sw">'
          + '<i style="background:' + t.c.bg + '"></i>'
          + '<i style="background:' + t.c.sur + '"></i>'
          + '<i style="background:' + t.c.ac + '"></i>'
          + '<i style="background:' + t.c.alt + '"></i>'
          + '<i style="background:' + t.c.ink + '"></i>'
          + '</div>'
          + '<div class="th-nm">' + t.name + '</div>'
          + '<div class="th-no">' + t.no + '</div>'
          + '</div>';
      });
      g2.innerHTML = h2;
    }
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

  function goalWords() { return Math.max(1, Math.round(num(S.config.goalWords, DEF_GOAL))); }
  function learned() { return Math.max(0, Math.round(num(S.config.learnedWords, 0))); }

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

    var lc = L.config, rc = R.config;
    out.config.goalWords = (rc.goalU > lc.goalU) ? rc.goalWords : lc.goalWords;
    out.config.dailyTarget = (rc.dailyU > lc.dailyU) ? rc.dailyTarget : lc.dailyTarget;
    out.config.learnedWords = (rc.learnedU > lc.learnedU) ? rc.learnedWords : lc.learnedWords;
    out.config.goalU = Math.max(lc.goalU, rc.goalU);
    out.config.dailyU = Math.max(lc.dailyU, rc.dailyU);
    out.config.learnedU = Math.max(lc.learnedU, rc.learnedU);

    /* 主题也按自己的时间戳取较新，改主题不会把别的设置冲掉 */
    out.config.theme = (rc.themeU > lc.themeU) ? rc.theme : lc.theme;
    out.config.themeU = Math.max(lc.themeU, rc.themeU);

    out.config.learnedHist = cleanHist(lc.learnedHist.concat(rc.learnedHist));
    out.config.mig = 1;

    out.todos = mergeTodos(L.todos, R.todos);
    out.days = mergeDays(L.days, R.days);
    return out;
  }

  function samePayload(a, b) {
    var A = { c: [a.config.goalWords, a.config.dailyTarget, a.config.learnedWords,
      a.config.learnedHist, a.config.theme], t: a.todos, d: a.days };
    var B = { c: [b.config.goalWords, b.config.dailyTarget, b.config.learnedWords,
      b.config.learnedHist, b.config.theme], t: b.todos, d: b.days };
    return JSON.stringify(A) === JSON.stringify(B);
  }

  /* ================= 同步 ================= */
  var syncing = false;
  var statusKind = 'idle';

  function setStatus(kind, text) {
    statusKind = kind;
    var b = $('syncBtn');
    if (!b) return;
    b.textContent = text;
    b.style.color = kind === 'err' ? '#B23B3B' : (kind === 'ok' ? 'var(--acd)' : 'var(--mut)');
  }

  function apiFetch(url, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers['Accept'] = 'application/vnd.github+json';
    opts.headers['Authorization'] = 'Bearer ' + syncCfg.token;
    opts.headers['X-GitHub-Api-Version'] = '2022-11-28';
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    opts.cache = 'no-store';
    if (opts.keepalive == null) opts.keepalive = true;
    return fetch(url, opts);
  }

  function gistIdFromInput(v) {
    v = (v || '').trim();
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

    if (fast) {
      clearTimeout(syncTimer);
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
        var d1 = $('syncDetail');
        if (d1) d1.textContent = 'Token 无效或已过期，请重新生成（只勾 Gists 读写）。';
      } else if (msg === 'GIST') {
        setStatus('err', 'Gist 不存在');
        var d2 = $('syncDetail');
        if (d2) d2.textContent = '找不到这个 Gist：可能 ID 错了，或 Token 没有访问权限。';
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

  function fmtNum(n) { return Number(n).toLocaleString('en-US'); }

  /* ================= 渲染：今日 ================= */
  var WEEK_H = [42, 68, 55, 90, 36, 74, 100];

  function renderWeek() {
    var box = $('pweek');
    if (!box) return;
    /* 最近 7 天的真实词数，归一化到 10%–100% */
    var vals = [], max = 1;
    for (var i = 6; i >= 0; i--) {
      var rec = peek(ds(shift(-i)));
      var w = rec ? (rec.words || 0) : 0;
      vals.push(w);
      if (w > max) max = w;
    }
    var any = vals.some(function (v) { return v > 0; });
    var html = '';
    vals.forEach(function (v, i) {
      var h = v > 0 ? Math.max(12, Math.round(v / max * 100)) : 0;
      html += '<i' + (i === 6 ? ' class="on"' : '') + '>'
        + '<b style="--hp:' + (h || 100) + '%"></b></i>';
    });
    box.innerHTML = html;
    box.setAttribute('data-empty', any ? '' : '1');
    /* 空状态：柱子退成一条基线 + 一行说明，比留一片黑更有信息 */
    var tip = $('weekTip');
    if (tip) tip.style.display = any ? 'none' : 'block';
  }

  function renderTodos() {
    var list = $('todoList');
    if (!list) return;
    var items = todayTodos();
    var key = ds(today());
    var d = peek(key);
    var doneIds = (d && d.done) ? d.done : [];

    if (!items.length) {
      list.innerHTML = '<p class="plt-empty">还没有其他待办。下面加一条，比如「语法 30 分钟」。</p>';
      return;
    }

    list.innerHTML = '';
    items.forEach(function (t) {
      var done = doneIds.indexOf(t.id) >= 0;
      var row = document.createElement('div');
      row.className = 'pit' + (done ? ' on' : '');
      row.innerHTML = '<span class="pck"></span>'
        + '<span class="ptt"></span>'
        + '<span class="ptg"></span>';
      row.querySelector('.ptt').textContent = t.title;
      row.querySelector('.ptg').textContent = ruleText(t.rule);

      /* 长按删除，单击勾选 */
      var pressTimer = null, longPressed = false;
      function startPress() {
        longPressed = false;
        pressTimer = setTimeout(function () {
          longPressed = true;
          if (!confirm('删除待办「' + t.title + '」？历史打卡记录会保留。')) return;
          var target = null;
          S.todos.forEach(function (x) { if (x.id === t.id) target = x; });
          if (target) { target.del = true; target.u = now(); }
          touch();
          renderToday();
          scheduleSync();
          toast('已删除');
        }, 620);
      }
      function endPress() { clearTimeout(pressTimer); }
      row.addEventListener('pointerdown', startPress);
      row.addEventListener('pointerup', endPress);
      row.addEventListener('pointercancel', endPress);

      row.addEventListener('click', function () {
        if (longPressed) { longPressed = false; return; }
        var dd = dayOf(ds(today()), true);
        var i = dd.done.indexOf(t.id);
        if (i >= 0) dd.done.splice(i, 1); else dd.done.push(t.id);
        dd.u = now();
        touch();
        renderToday();
        scheduleSync();
      });

      list.appendChild(row);
    });
  }

  function renderToday() {
    var t = today(), key = ds(t), d = peek(key);
    var words = d ? (d.words || 0) : 0;
    var active = isActive(key);
    var st = streak();

    var dt = $('todayDate');
    if (dt) dt.textContent = (t.getMonth() + 1) + '月' + t.getDate() + '日 · ' + WD[t.getDay()];

    var lab = $('heroLabel');
    if (lab) lab.textContent = active ? '今天已背' : '今天还没开始';

    var wn = $('wordNum');
    if (wn) wn.textContent = words;

    var sp = $('streakPill');
    if (sp) sp.textContent = '连续 ' + st + ' 天';

    var btn = $('checkinBtn');
    if (btn) {
      if (active) {
        btn.classList.add('done');
        btn.textContent = '今天已完成 · 点一下修改';
      } else {
        btn.classList.remove('done');
        btn.textContent = '打卡';
      }
    }

    var g = goalWords(), lw = learned();
    var lt = $('learnTxt');
    if (lt) lt.textContent = fmtNum(lw) + ' / ' + fmtNum(g);
    var lb = $('learnBar');
    if (lb) lb.style.width = Math.min(100, lw / g * 100) + '%';

    var s1 = $('stStreak'); if (s1) s1.textContent = st;
    var s2 = $('stAvg'); if (s2) s2.textContent = Math.round(avg7());

    /* 还需天数：有实测速度用实测，否则不硬编一个数 */
    var s3 = $('stLeft');
    if (s3) {
      var rest = Math.max(0, g - lw);
      if (lw <= 0) { s3.textContent = '—'; }
      else if (rest === 0) { s3.textContent = '0'; }
      else {
        var spi = speedInfo();
        s3.textContent = Math.max(1, Math.ceil(rest / spi.perDay));
      }
    }

    renderWeek();
    renderTodos();
    /* 数字变了（0 → 1,180 等）会改变 hero 的宽度，碰撞结论要重算 */
    syncHeroAlign();
  }

  /* ================= 渲染：回顾 ================= */
  function renderReview() {
    var g = goalWords(), lw = learned();
    var pct = Math.min(100, Math.round(lw / g * 100));

    var a = $('rvTotal'); if (a) a.textContent = fmtNum(totalWords());
    var b = $('rvDays'); if (b) b.textContent = studyDays();
    var c = $('rvAvg'); if (c) c.textContent = Math.round(avg7());

    var d1 = $('rvDone'); if (d1) d1.textContent = fmtNum(lw);
    var d2 = $('rvGoal'); if (d2) d2.textContent = fmtNum(g);
    var d3 = $('rvLeft'); if (d3) d3.textContent = '剩 ' + fmtNum(Math.max(0, g - lw));
    var d4 = $('rvPct'); if (d4) d4.textContent = pct + '%';
    var d5 = $('rvBar'); if (d5) d5.style.width = pct + '%';

    renderForecast(g, lw);
    renderHeatmap();
    renderLast7();
  }

  function renderForecast(g, lw) {
    var fc = $('rvForecast');
    if (!fc) return;
    var rest = Math.max(0, g - lw);

    if (lw <= 0) {
      fc.textContent = '在你的 app 里看一眼「已掌握」多少，点下来填进来，这里就能算出还要多久。';
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
    if (!box) return;
    box.innerHTML = '';

    var cellW = 13, gap = 4, pad = 2;
    var avail = (box.clientWidth || 340) - pad * 2;
    var WEEKS = Math.max(8, Math.min(26, Math.floor((avail + gap) / (cellW + gap))));
    var t = today();
    var end = new Date(t);
    end.setDate(end.getDate() + (6 - end.getDay()));
    var start = new Date(end);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));
    box.style.gap = gap + 'px';

    for (var w = 0; w < WEEKS; w++) {
      var col = document.createElement('div');
      col.className = 'phm-c';
      col.style.gap = gap + 'px';
      for (var i = 0; i < 7; i++) {
        var d = new Date(start);
        d.setDate(d.getDate() + w * 7 + i);
        var key = ds(d);
        var rec = peek(key);
        var future = d > t;
        var lv = levelOf(rec ? rec.words : 0, isActive(key));
        var cell = document.createElement('div');
        if (future) {
          cell.className = 'hm-cell';
          cell.style.cssText = 'width:' + cellW + 'px;height:' + cellW + 'px;' +
            'border-radius:3px;background:var(--line);visibility:hidden;flex:none';
        } else {
          cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'phm-cell' + (lv ? ' l' + lv : '') + (key === ds(t) ? ' td' : '');
          cell.style.width = cellW + 'px';
          cell.style.height = cellW + 'px';
          cell.title = key + ' · ' + (rec && rec.words ? rec.words + ' 词' : (isActive(key) ? '已学习' : '无记录'));
          (function (k) { cell.addEventListener('click', function () { openSheet(k); }); })(key);
        }
        col.appendChild(cell);
      }
      box.appendChild(col);
    }
    var wk = $('rvWeeks');
    if (wk) wk.textContent = '近 ' + WEEKS + ' 周';
  }

  function renderLast7() {
    var box = $('rvLast7');
    if (!box) return;
    var rows = [];
    for (var i = 6; i >= 0; i--) {
      var d = shift(-i), key = ds(d), rec = peek(key);
      var w = rec ? (rec.words || 0) : 0;
      var mark = isActive(key) ? '✓' : '·';
      rows.push('<div><span>' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + WD_S[d.getDay()] + '</span>'
        + '<b' + (w ? '' : ' class="dim"') + '>' + mark + '  ' + (w ? w + ' 词' : '—') + '</b></div>');
    }
    box.innerHTML = rows.join('');
  }

  /* ================= 渲染：设置 ================= */
  function renderSettings() {
    var gi = $('goalInput'); if (gi) gi.value = goalWords();
    var li = $('learnedInput'); if (li) li.value = learned();
    var ti = $('targetInput'); if (ti) ti.value = S.config.dailyTarget;
    var gs = $('gistInput'); if (gs) gs.value = syncCfg.gistId;
    var tk = $('tokenInput'); if (tk) tk.value = syncCfg.token;

    var det = $('syncDetail');
    if (det) {
      if (!syncCfg.gistId || !syncCfg.token) {
        det.textContent = '尚未配置。配置后手机和电脑可共享同一份记录。';
      } else if (isDirty()) {
        det.textContent = '有改动还没传上去，联网后会自动重试。';
      } else {
        det.textContent = '已连接 · ' + syncCfg.gistId.slice(0, 8) + '… 手机和电脑共用这一份数据。';
      }
    }
    renderThemePickers();
    renderThemeNow();
  }

  function renderAll() { renderToday(); renderReview(); renderSettings(); }

  /* ================= 弹窗 ================= */
  var sheetKey = null;

  function openSheet(key) {
    sheetKey = key;
    var rec = peek(key);
    var d = parseDay(key);
    var isToday = key === ds(today());
    var st = $('sheetTitle');
    if (st) st.textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + WD[d.getDay()];
    var ss = $('sheetSub');
    if (ss) ss.textContent = isToday ? '今天' : '补录 / 修改历史记录';
    var sw = $('sheetWords');
    if (sw) sw.value = rec ? (rec.words || 0) : 0;

    var g = goalWords(), lw = learned();
    var wrap = $('sheetLearnWrap');
    if (wrap) wrap.hidden = !isToday;
    var sl = $('sheetLearn');
    if (sl) sl.value = lw;
    var slt = $('sheetLearnTotal');
    if (slt) slt.textContent = fmtNum(g);

    var mi = $('sheetManualIco');
    if (mi) mi.classList.toggle('on', !!(rec && rec.manual));

    var m = $('mask'), s = $('sheet');
    if (m) m.classList.add('show');
    if (s) s.classList.add('show');
    drawClock();
  }
  function closeSheet() {
    var m = $('mask'), s = $('sheet');
    if (m) m.classList.remove('show');
    if (s) s.classList.remove('show');
  }

  /* ================= 重复规则浮层 ================= */
  var curRule = { type: 'daily', weekday: 3, day: 1 };

  function rulePreview() {
    if (curRule.type === 'daily') return '每天';
    if (curRule.type === 'weekly') return '每周' + WD_S[curRule.weekday];
    return '每月 ' + curRule.day + ' 号';
  }

  function syncRuleUI() {
    var segs = document.querySelectorAll('#prepSeg span');
    segs.forEach(function (s) { s.classList.toggle('on', s.dataset.rule === curRule.type); });

    var prep = $('prep');
    if (prep) {
      prep.classList.remove('mode-w', 'mode-m');
      if (curRule.type === 'weekly') prep.classList.add('mode-w');
      if (curRule.type === 'monthly') prep.classList.add('mode-m');
    }
    var wds = document.querySelectorAll('#prepWd span');
    wds.forEach(function (s) { s.classList.toggle('on', Number(s.dataset.wd) === curRule.weekday); });

    var dn = $('prepDayNum');
    if (dn) dn.textContent = curRule.day;

    var hint = $('prepHint');
    if (hint) hint.textContent = rulePreview();

    var rb = $('ruleBtn');
    if (rb) rb.textContent = rulePreview() + ' ▾';
  }

  function closePrep() {
    var box = $('paddBox');
    if (box) box.classList.remove('open');
  }

  /* ================= 交互 ================= */
  function bumpStreak() {
    var el = $('streakPill');
    if (!el) return;
    el.style.transform = 'scale(1.12)';
    setTimeout(function () { el.style.transform = ''; }, 220);
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

  /* 打卡动效：每套主题一套专属动画，数据用当下的真实值。
     动效缺失（fx.js 没加载 / 该主题没配）时静默跳过，不影响打卡。
     取 currentThemeId 而不是 S.config.theme：前者是「此刻真正渲染的」，
     后者要等 touch() 落盘才更新，预览态下会拿到旧值。 */
  function fxCheckin() {
    if (!window.SB_FX) return;
    var key = ds(today()), d = peek(key) || {};
    window.SB_FX.play(currentThemeId || S.config.theme, {
      words: d.words || 0,
      streak: streak(),
      pct: Math.min(100, Math.round(learned() / goalWords() * 100))
    });
  }

  function switchView(v) {
    document.querySelectorAll('.tab').forEach(function (x) {
      x.classList.toggle('on', x.dataset.view === v);
    });
    ['today', 'review', 'settings'].forEach(function (k) {
      var el = $('view-' + k);
      if (el) el.hidden = (k !== v);
    });
    window.scrollTo(0, 0);
    if (v === 'review') renderReview();
    if (v === 'settings') renderSettings();
  }

  function drawClock() {
    var d = new Date();
    var el = $('clock');
    if (el) el.textContent = d.getHours() + ':' + pad(d.getMinutes());
  }

  function bind() {
    /* 顶部同步按钮 */
    var sb = $('syncBtn');
    if (sb) sb.addEventListener('click', function () {
      if (!syncCfg.gistId || !syncCfg.token) {
        toast('先在设置里填 Gist ID 和 Token');
        switchView('settings');
        return;
      }
      syncNow('manual').then(function (did) {
        if (!did && statusKind === 'ok') toast('已是最新');
      });
    });

    /* 打卡 */
    var cb = $('checkinBtn');
    if (cb) cb.addEventListener('click', function () {
      var key = ds(today());
      var d = peek(key);
      var active = isActive(key);
      if (!active) {
        var dd = dayOf(key, true);
        dd.manual = true;
        dd.u = now();
        touch(); renderAll(); bumpStreak();
        fxCheckin();
        toast('已打卡 · 连续 ' + streak() + ' 天');
        scheduleSync();
      } else if (active && (d.words || 0) === 0 && (d.done || []).length === 0) {
        d.manual = false; d.u = now();
        touch(); renderAll();
        toast('已取消今天的打卡');
        scheduleSync();
      } else {
        openSheet(key);
      }
    });

    /* 快捷加词 */
    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () { addWords(Number(b.dataset.add)); });
    });
    var ub = $('undoBtn');
    if (ub) ub.addEventListener('click', function () { addWords(-20); });
    var cbt = $('customBtn');
    if (cbt) cbt.addEventListener('click', function () { openSheet(ds(today())); });

    /* 主题选择：设置页小色板 + 换风格面板 */
    document.addEventListener('click', function (e) {
      var th = e.target.closest('[data-th]');
      if (th) {
        applyTheme(th.dataset.th);
        toast('已换到 ' + (themeById(th.dataset.th) || {}).name);
        return;
      }
    });
    var tb = $('themeBtn');
    if (tb) tb.addEventListener('click', function () {
      var p = $('thPanel'), m = $('thMask');
      if (p) p.classList.add('show');
      if (m) m.classList.add('show');
    });
    function closeThemePanel() {
      var p = $('thPanel'), m = $('thMask');
      if (p) p.classList.remove('show');
      if (m) m.classList.remove('show');
    }
    var tc = $('thClose'); if (tc) tc.addEventListener('click', closeThemePanel);
    var tm = $('thMask'); if (tm) tm.addEventListener('click', closeThemePanel);

    /* 重复规则浮层 */
    var rb = $('ruleBtn');
    if (rb) rb.addEventListener('click', function (e) {
      e.stopPropagation();
      var box = $('paddBox');
      var open = box.classList.contains('open');
      document.querySelectorAll('.padd').forEach(function (x) { x.classList.remove('open'); });
      if (!open) box.classList.add('open');
    });

    document.querySelectorAll('#prepSeg span').forEach(function (s) {
      s.addEventListener('click', function (e) {
        e.stopPropagation();
        curRule.type = s.dataset.rule;
        syncRuleUI();
      });
    });
    document.querySelectorAll('#prepWd span').forEach(function (s) {
      s.addEventListener('click', function (e) {
        e.stopPropagation();
        curRule.weekday = Number(s.dataset.wd);
        syncRuleUI();
      });
    });
    var dm = $('dayMinus');
    if (dm) dm.addEventListener('click', function (e) {
      e.stopPropagation();
      curRule.day = curRule.day <= 1 ? 31 : curRule.day - 1;
      syncRuleUI();
    });
    var dp = $('dayPlus');
    if (dp) dp.addEventListener('click', function (e) {
      e.stopPropagation();
      curRule.day = curRule.day >= 31 ? 1 : curRule.day + 1;
      syncRuleUI();
    });

    /* 点空白收起浮层 */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.padd')) closePrep();
    });

    /* 添加待办 */
    function addTodo() {
      var inp = $('todoInput');
      var title = inp.value.trim();
      if (!title) { inp.focus(); return; }
      var rule = { type: curRule.type };
      if (rule.type === 'weekly') rule.weekday = curRule.weekday;
      if (rule.type === 'monthly') rule.day = curRule.day;
      S.todos.push({ id: uid(), title: title, rule: rule, u: now() });
      inp.value = '';
      touch(); renderToday(); closePrep();
      toast('已添加 · ' + ruleText(rule));
      scheduleSync();
    }
    var ta = $('todoAdd');
    if (ta) ta.addEventListener('click', addTodo);
    var tin = $('todoInput');
    if (tin) tin.addEventListener('keydown', function (e) { if (e.key === 'Enter') addTodo(); });

    /* 弹窗 */
    var sc = $('sheetCancel'); if (sc) sc.addEventListener('click', closeSheet);
    var mk = $('mask'); if (mk) mk.addEventListener('click', closeSheet);
    var smw = $('sheetManualWrap');
    if (smw) smw.addEventListener('click', function () {
      var i = $('sheetManualIco');
      if (i) i.classList.toggle('on');
    });

    var sv = $('sheetSave');
    if (sv) sv.addEventListener('click', function () {
      if (!sheetKey) return;
      var d = dayOf(sheetKey, true);
      d.words = Math.max(0, parseInt($('sheetWords').value, 10) || 0);
      var ico = $('sheetManualIco');
      d.manual = !!(ico && ico.classList.contains('on'));
      d.u = now();

      var isToday = sheetKey === ds(today());
      if (isToday) {
        var lv = parseInt($('sheetLearn').value, 10);
        if (!isNaN(lv) && lv >= 0) setLearned(lv);
      }

      touch(); closeSheet(); renderAll();
      toast('已保存');
      scheduleSync();
    });

    /* 底部切换 */
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });

    /* 设置项 */
    var gi = $('goalInput');
    if (gi) gi.addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!v || v < 100) { this.value = goalWords(); return; }
      S.config.goalWords = v;
      touch('goal'); renderAll(); toast('词书总量已更新');
      scheduleSync();
    });
    var li = $('learnedInput');
    if (li) li.addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (isNaN(v) || v < 0) { this.value = learned(); return; }
      if (v > goalWords()) { this.value = learned(); toast('不能超过词书总量'); return; }
      setLearned(v);
      renderAll(); toast('已掌握更新为 ' + v + ' 词');
      scheduleSync();
    });
    var ti = $('targetInput');
    if (ti) ti.addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (!v || v < 1) { this.value = S.config.dailyTarget; return; }
      S.config.dailyTarget = v;
      touch('target'); renderAll(); toast('每日目标已更新');
      scheduleSync();
    });

    /* 云同步 */
    var ss = $('saveSync');
    if (ss) ss.addEventListener('click', function () {
      var gEl = $('gistInput'), tEl = $('tokenInput');
      var g = gistIdFromInput((gEl && gEl.value) || syncCfg.gistId);
      var tk = ((tEl && tEl.value) || '').trim();
      if (!g) { toast('缺少 Gist ID'); return; }
      if (!tk) { toast('请填 Token'); return; }
      syncCfg.gistId = g;
      syncCfg.token = tk;
      saveSync();
      setStatus('busy', '同步中');
      syncNow('save').then(function () { renderSettings(); });
    });

    var ts = $('testSync');
    if (ts) ts.addEventListener('click', function () {
      var gEl = $('gistInput'), tEl = $('tokenInput');
      var g = gistIdFromInput((gEl && gEl.value) || syncCfg.gistId);
      var tk = ((tEl && tEl.value) || '').trim();
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

    var cs = $('clearSync');
    if (cs) cs.addEventListener('click', function () {
      if (!confirm('断开同步？本机数据会保留，只是不再上传。')) return;
      syncCfg.gistId = ''; syncCfg.token = '';
      saveSync();
      setStatus('idle', '未连接');
      renderSettings();
      toast('已断开');
    });

    /* 导入导出 */
    var eb = $('exportBtn');
    if (eb) eb.addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'studybench-' + ds(today()) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('已导出');
    });

    var ib = $('importBtn');
    if (ib) ib.addEventListener('click', function () { $('fileInput').click(); });
    var fi = $('fileInput');
    if (fi) fi.addEventListener('change', function (e) {
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
          applyTheme(S.config.theme, true);
          toast('导入成功');
          scheduleSync();
        } catch (err) { alert('读不出来：' + err.message); }
      };
      r.readAsText(f);
      e.target.value = '';
    });

    var clb = $('clearBtn');
    if (clb) clb.addEventListener('click', function () {
      if (!confirm('清空这台设备上的记录？\n云端数据不受影响，下次同步会重新拉回来。')) return;
      localStorage.removeItem(K_DATA);
      S = blank(); saveLocal(); renderAll();
      applyTheme(S.config.theme, true);
      toast('已清空本机');
    });

    /* 前后台切换 */
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

    /* 横竖屏或窗口尺寸变化时，热力图列数要跟着重算 */
    var rzTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(rzTimer);
      rzTimer = setTimeout(function () {
        var rv = $('view-review');
        if (rv && !rv.hidden) renderHeatmap();
      }, 180);
    });
  }

  /* ================= 启动 ================= */
  loadLocal();
  loadSync();
  var paired = consumePairLink();
  bind();

  /* 对外暴露：给自动化验收与调试用，不影响正常运行 */
  window.applyThemePublic = function (id) { applyTheme(id, true); };
  window.switchViewPublic = switchView;
  window.openSheetPublic = function () { openSheet(ds(today())); };
  window.renderAllPublic = renderAll;
  window.SB_DEBUG = {
    state: function () { return S; },
    theme: function () { return currentThemeId; },
    streak: streak, addWords: addWords
  };

  /* 主题先落地，再渲染内容，避免一帧无样式 */
  applyTheme(S.config.theme, true);
  renderAll();
  drawClock();
  syncRuleUI();
  setInterval(drawClock, 30000);

  if (syncCfg.gistId && syncCfg.token) {
    if (!paired) setStatus(isDirty() ? 'warn' : 'ok', isDirty() ? '待同步' : '已连接');
    scheduleSync(paired ? 200 : 400);
    if (paired) toast('已自动配对，开始同步');
  } else {
    setStatus('idle', '未连接');
  }

  var canSW = 'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
     location.hostname === 'localhost' ||
     location.hostname === '127.0.0.1');
  if (canSW) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
})();
