/* ITOps device intelligence: sample devices only. The rows are rendered into the page
   at build time with the same markup the PHP renderer produces. */
(function () {
  const D = window.DEMO; D.app = 'itops';
  D.pages = ['index', 'scan_dashboard'];
  let tableHtml = '', stats = null;
  document.addEventListener('DOMContentLoaded', () => {
    const tb = document.getElementById('deviceTable');
    if (tb) {
      tableHtml = tb.innerHTML;
      const v = (id) => (document.getElementById(id) || {}).textContent;
      stats = { active: v('cnt-active'), online: v('cnt-st-online'), offline: v('cnt-st-offline'), removed: v('cnt-st-removed'), scanned: (v('cnt-scanned') || '').split('/')[0].trim(), total: v('totalDeviceCount'), lowRam: v('cnt-ram'), hdd: v('cnt-hdd'), legacy: v('cnt-legacy'), cFull: v('cnt-cfull') };
    }
    const form = document.getElementById('scanForm');
    if (form) form.addEventListener('submit', queueScan);
  }, true);
  D.routes.index_refresh = () => ({ tableHtml, stats });

  // ---------- scan jobs ----------
  const LABELS = { All: 'Full Inventory', ADOnly: 'AD Refresh', Logs: 'Event Logs', OU: 'Full Inventory (OU)', Computer: 'Full Inventory (Computers)', NeverScanned: 'Never Scanned', Stale: 'Stale Data' };
  const TOTALS = { All: 1284, ADOnly: 1412, Logs: 640, OU: 74, Computer: 2, NeverScanned: 9, Stale: 61 };
  const jobs = {}; let nextId = 419;
  function queueScan(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const type = fd.get('scan_type');
    let detail = { All: 'Every device in AD', ADOnly: 'All of Active Directory', NeverScanned: 'Devices with no inventory yet' }[type] || '';
    if (type === 'OU') { detail = fd.get('ou_path'); if (!detail) { flash('Select a site first.', true); return; } }
    if (type === 'Computer') { detail = (fd.get('computer_names') || '').trim(); if (!detail) { flash('Enter at least one computer name.', true); return; } }
    if (type === 'Stale') detail = `Older than ${fd.get('stale_days') || 30} days`;
    if (type === 'Logs') detail = { All: 'All devices in AD', OU: fd.get('logs_ou_path') || 'One site', Computer: fd.get('logs_computer_names') || 'Named computers' }[fd.get('logs_target')];
    const total = type === 'Computer' ? detail.split(',').length : (TOTALS[type] || 50);
    const id = nextId++;
    jobs[id] = { id, total, start: Date.now() + 2500, dur: Math.min(22000, 6000 + total * 6) };
    const tr = document.createElement('tr'); tr.dataset.jobId = id;
    tr.innerHTML = `<td>#${id}</td><td>${LABELS[type]}</td><td>${DEMO_ESC(detail)}</td><td class="js-status"><span class="status-pill" style="background:var(--fg-subtle)">Queued</span></td><td><div class="progress-wrap"><div class="js-progress-fill progress-fill" style="width:0%"></div></div> <span class="js-progress-text counts">0 / ${total}</span></td><td class="counts js-counts"><span style="color:var(--good)">&#9679;</span> 0 &nbsp;<span style="color:var(--warn)">&#9679;</span> 0 &nbsp;<span style="color:var(--danger)">&#9679;</span> 0</td><td class="counts">${D.ts(0)}</td><td>—</td>`;
    const tbody = document.querySelector('#jobsTable tbody'); tbody.insertBefore(tr, tbody.firstChild);
    flash(`Scan job #${id} queued successfully. The Scan Worker service will pick it up within a few seconds — tracking its progress below.`);
    if (typeof pollStatus === 'function') setTimeout(pollStatus, 300);
    const fast = setInterval(() => { if (typeof pollStatus === 'function') pollStatus(); const j = jobs[id]; if (Date.now() > j.start + j.dur + 1500) clearInterval(fast); }, 1000);
  }
  function DEMO_ESC(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function flash(msg, err) { const el = document.getElementById('demoFlash'); if (el) el.innerHTML = `<div class="${err ? 'flash-err' : 'flash-ok'}">${DEMO_ESC(msg)}</div>`; }
  D.routes.scan_status = (params) => (params.get('ids') || '').split(',').filter(Boolean).map(Number).map(id => {
    const j = jobs[id];
    if (!j) return { id, status: 'Completed', total_targets: 1, completed_targets: 1, online_count: 1, offline_count: 0, error_count: 0 };
    const t = Date.now() - j.start;
    if (t < 0) return { id, status: 'Queued', total_targets: j.total, completed_targets: 0, online_count: 0, offline_count: 0, error_count: 0 };
    const done = Math.min(j.total, Math.round(j.total * t / j.dur));
    const off = Math.round(done * 0.12), err = Math.round(done * 0.015);
    return { id, status: done >= j.total ? 'Completed' : 'Running', total_targets: j.total, completed_targets: done, online_count: done - off - err, offline_count: off, error_count: err };
  });
})();
