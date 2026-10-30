/* Demo runtime: serves sample data to the real front-end in place of the PHP API.
   Loaded before the app's own scripts. No network calls leave the page. */
(function () {
  const DEMO = window.DEMO = window.DEMO || {};
  DEMO.routes = DEMO.routes || {};
  DEMO.pages = DEMO.pages || [];
  DEMO.app = DEMO.app || 'demo';

  const pad = (n) => String(n).padStart(2, '0');
  DEMO.ts = function (minutesAgo) {
    const d = new Date(Date.now() - minutesAgo * 60000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  DEMO.day = function (daysAgo) { return DEMO.ts(daysAgo * 1440).slice(0, 10); };
  // Small deterministic random so every visit shows the same numbers.
  let seed = 20261029;
  DEMO.rand = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  DEMO.int = function (a, b) { return a + Math.floor(DEMO.rand() * (b - a + 1)); };
  DEMO.pick = function (arr) { return arr[Math.floor(DEMO.rand() * arr.length)]; };

  function toast(msg) {
    let host = document.getElementById('__demoToast');
    if (!host) {
      host = document.createElement('div'); host.id = '__demoToast';
      host.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;display:grid;gap:8px;pointer-events:none';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'background:#0f172a;color:#e6ecf4;border:1px solid #31415e;padding:10px 16px;border-radius:10px;font:500 13px Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:420px;text-align:center';
    host.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
  DEMO.toast = toast;

  function pageOf(url) {
    const m = String(url).split('#')[0].split('?')[0].match(/([\w-]+)\.(html|php)$/);
    return m ? m[1] : null;
  }
  DEMO.go = function (url) {
    const p = pageOf(url);
    if (/\bapi\//.test(String(url))) { toast('Exports run on the live system. This demo uses sample data only.'); return; }
    if (p && DEMO.pages.includes(p)) { window.location.href = String(url).replace(/\.php/, '.html'); return; }
    toast('That page is not part of this demo.');
  };

  // Links to pages that are not in the demo (admin, sign-out, password...)
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    a.removeAttribute('target');
    const p = pageOf(href);
    if (p && DEMO.pages.includes(p)) { if (/\.php/.test(href)) { e.preventDefault(); window.location.href = href.replace(/\.php/, '.html'); } return; }
    e.preventDefault();
    toast(/logout|sign/i.test(href) ? 'Signing out is disabled in the demo.' : 'That page is not part of this demo.');
  }, true);
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.dataset && e.target.dataset.demoAllow) return;
    if (!e.defaultPrevented) { /* app handlers call preventDefault themselves */ }
  });

  window.confirm = function () { return true; };
  window.alert = function (m) { toast(String(m)); };

  // fetch -> sample data
  const realFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, opts) {
    const url = typeof input === 'string' ? input : input.url;
    const u = new URL(url, location.href);
    const m = u.pathname.match(/api\/([\w-]+)\.php$/) || u.pathname.match(/\/([\w-]+)\.php$/);
    const key = m ? m[1] : null;
    if (!key || !DEMO.routes[key]) {
      if (key) return Promise.resolve(new Response(JSON.stringify({ error: 'Not available in the demo' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
      return realFetch ? realFetch(input, opts) : Promise.reject(new Error('offline'));
    }
    let body = null;
    if (opts && opts.body) { try { body = JSON.parse(opts.body); } catch (e) { body = opts.body; } }
    const params = u.searchParams;
    return new Promise((resolve) => {
      setTimeout(() => {
        let status = 200, data;
        try { data = DEMO.routes[key](params, body, (opts && opts.method) || 'GET'); }
        catch (err) { status = 500; data = { error: err.message }; }
        if (data && data.__status) { status = data.__status; delete data.__status; }
        resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));
      }, 140);
    });
  };

  // Tell the portfolio frame which page is showing.
  function announce() {
    try {
      window.parent.postMessage({ type: 'demo-nav', app: DEMO.app, page: pageOf(location.pathname) || 'index', title: document.title, path: DEMO.pathFor ? DEMO.pathFor(location) : location.pathname.split('/').pop().replace('.html', '') + location.search }, '*');
    } catch (e) {}
  }
  window.addEventListener('DOMContentLoaded', announce);
})();
