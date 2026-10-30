(function () {
  function renderOffline(rows) {
    const el = document.getElementById('offlineList');
    if (!rows || rows.length === 0) { el.innerHTML = '<div class="empty-state">No offline printers. &#127881;</div>'; return; }
    el.innerHTML = rows.map(r => `
      <div class="alert-card danger">
        <div>
          <div class="alert-title"><a href="printer_detail.html?id=${r.id}">${POC.escapeHtml(r.name)}</a> <span class="mono">${POC.escapeHtml(r.ip_address)}</span></div>
          <div class="alert-meta">${POC.escapeHtml([r.site, r.building, r.department].filter(Boolean).join(' — '))} · last seen ${POC.timeAgo(r.last_seen_online_at)}</div>
        </div>
        <span class="badge badge-danger">${r.consecutive_failures} failed checks</span>
      </div>
    `).join('');
  }

  function renderLowToner(rows) {
    const el = document.getElementById('lowTonerList');
    if (!rows || rows.length === 0) { el.innerHTML = '<div class="empty-state">All toner levels healthy. &#127881;</div>'; return; }
    el.innerHTML = rows.map(r => `
      <div class="alert-card warn">
        <div>
          <div class="alert-title"><a href="printer_detail.html?id=${r.id}">${POC.escapeHtml(r.name)}</a> <span class="mono">${POC.escapeHtml(r.ip_address)}</span></div>
          <div class="alert-meta">${POC.escapeHtml([r.site, r.building, r.department].filter(Boolean).join(' — '))} · ${POC.escapeHtml(r.model || '')}</div>
        </div>
        <span class="badge badge-warn">${Number(r.black_toner_pct)}% black toner</span>
      </div>
    `).join('');
  }

  function renderNeverPolled(rows) {
    const el = document.getElementById('neverPolledList');
    if (!rows || rows.length === 0) { el.innerHTML = '<div class="empty-state">Nothing pending.</div>'; return; }
    el.innerHTML = rows.map(r => `
      <div class="alert-card">
        <div>
          <div class="alert-title"><a href="printer_detail.html?id=${r.id}">${POC.escapeHtml(r.name)}</a> <span class="mono">${POC.escapeHtml(r.ip_address)}</span></div>
          <div class="alert-meta">${POC.escapeHtml(r.site || '')} · added ${POC.timeAgo(r.created_at)}</div>
        </div>
      </div>
    `).join('');
  }

  async function load() {
    try {
      const data = await POC.fetchJSON('api/alerts_data.php');
      renderOffline(data.offline);
      renderLowToner(data.low_toner);
      renderNeverPolled(data.never_polled);
    } catch (err) {
      document.getElementById('offlineList').innerHTML = `<div class="empty-state">Failed to load: ${POC.escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
