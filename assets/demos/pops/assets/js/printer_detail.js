(function () {
  const printerId = window.__PRINTER_ID;
  const charts = {};
  let period = 'week';
  let pollIntervalMinutes = 15; // overwritten from api/printers_meta.php once loaded

  function minutesAgo(value) {
    if (!value) return Infinity;
    const d = new Date(String(value).replace(' ', 'T'));
    if (isNaN(d.getTime())) return Infinity;
    return (Date.now() - d.getTime()) / 60000;
  }

  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#93a3bd';
    Chart.defaults.borderColor = '#1a2740';
  }

  function baseChartOptions(extra = {}) {
    return Object.assign({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' } },
        y: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' }, beginAtZero: true },
      },
    }, extra);
  }

  function renderOrUpdate(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    try {
      if (charts[canvasId]) { charts[canvasId].data = config.data; charts[canvasId].options = config.options; charts[canvasId].update(); return; }
      charts[canvasId] = new Chart(canvas.getContext('2d'), config);
    } catch (err) {
      canvas.closest('.chart-wrap').innerHTML = `<div class="empty-state">Unavailable: ${POC.escapeHtml(err.message)}</div>`;
    }
  }

  function statusBadge(status) {
    const map = { active: 'badge-ok', maintenance: 'badge-warn', installing: 'badge-neutral', planned: 'badge-neutral', retired: 'badge-danger' };
    return `<span class="badge ${map[status] || 'badge-neutral'}">${POC.escapeHtml(status)}</span>`;
  }

  function renderInfo(p) {
    const dot = p.status !== 'active' ? 'unknown' : (p.is_online == 1 ? 'online' : (p.is_online == 0 ? 'offline' : 'unknown'));
    // "Online" (the dot, driven by a fast ~1min reachability ping) and
    // "Last Reading" (the last SUCCESSFUL SNMP poll, every ~poll interval)
    // are two different signals. A printer can be reachable/online while
    // its SNMP poll keeps failing (bad community string, UDP 161 blocked,
    // etc.) — in which case Last Reading (and the toner/page numbers on
    // this page) can be far older than the green dot suggests.
    const stale = p.status === 'active' && p.is_online == 1 && minutesAgo(p.last_polled_at) > pollIntervalMinutes * 2;
    const staleBanner = stale ? `
      <div class="empty-state" style="background:var(--warn-dim); color:var(--warn); border-radius:8px; padding:8px 12px; margin-top:8px; text-align:left;">
        &#9888; This printer is online, but its SNMP telemetry poll has been failing
        ${p.last_poll_attempt_at ? `(last attempt ${POC.timeAgo(p.last_poll_attempt_at)})` : '(no attempt recorded yet)'}.
        The toner/page-count numbers below are from the last successful reading, not live.
        Check the SNMP community string and that UDP 161 isn't blocked for this printer.
      </div>` : '';
    document.getElementById('printerInfoPanel').innerHTML = `
      <div class="ranking-head">
        <h3><span class="status-dot ${dot}"></span>${POC.escapeHtml(p.name)} ${statusBadge(p.status)}</h3>
        <a href="printers.html" class="btn-ghost btn-sm">&larr; Back to Printers</a>
      </div>
      <div class="grid-3" style="margin-top:8px;">
        <div><small style="color:var(--text-muted);">IP Address</small><div class="mono">${POC.escapeHtml(p.ip_address)}</div></div>
        <div><small style="color:var(--text-muted);">Hostname</small><div class="mono">${POC.escapeHtml(p.hostname || '—')}</div></div>
        <div><small style="color:var(--text-muted);">Model</small><div>${POC.escapeHtml(p.model || '—')}</div></div>
        <div><small style="color:var(--text-muted);">Serial</small><div class="mono">${POC.escapeHtml(p.serial_number || '—')}</div></div>
        <div><small style="color:var(--text-muted);">Last Seen Online</small><div>${p.last_seen_online_at ? POC.formatDateTime(p.last_seen_online_at) : 'never'} <small style="color:var(--text-muted);">(connectivity ping)</small></div></div>
        <div><small style="color:var(--text-muted);">Last Reading${stale ? ' &#9888;' : ''}</small><div>${p.last_polled_at ? POC.formatDateTime(p.last_polled_at) : 'never'} <small style="color:var(--text-muted);">(SNMP toner/page poll)</small></div></div>
        <div><small style="color:var(--text-muted);">Company</small><div>${POC.escapeHtml(p.company || '—')}</div></div>
        <div><small style="color:var(--text-muted);">Cost Center</small><div>${POC.escapeHtml(p.cost_center || '—')}</div></div>
        <div><small style="color:var(--text-muted);">Start Date</small><div>${p.start_date ? POC.escapeHtml(String(p.start_date).slice(0, 10)) : '—'}</div></div>
        <div><small style="color:var(--text-muted);">Start Page</small><div>${p.start_page !== null && p.start_page !== undefined ? Number(p.start_page).toLocaleString() : '—'}</div></div>
        <div style="grid-column:1 / -1;"><small style="color:var(--text-muted);">Location</small><div>${POC.escapeHtml([p.site, p.building, p.floor, p.department].filter(Boolean).join(' — '))}</div></div>
      </div>
      ${staleBanner}
      ${p.notes ? `<p style="color:var(--text-secondary); font-size:13px; margin-bottom:0; margin-top:8px;">${POC.escapeHtml(p.notes)}</p>` : ''}
    `;
  }

  function renderKpis(printer, usage, uptimePct) {
    const grid = document.getElementById('usageKpiGrid');
    const hasBaseline = printer.start_page !== null && printer.start_page !== undefined
      && printer.total_page_count !== null && printer.total_page_count !== undefined;
    const lifetimePagesUsed = hasBaseline ? Math.max(0, Number(printer.total_page_count) - Number(printer.start_page)) : null;
    const cards = [
      { label: 'Pages Used (period)', value: usage.pages_used },
      { label: 'Counter Start', value: usage.pages_start },
      { label: 'Counter End', value: usage.pages_end },
      { label: 'Uptime %', value: uptimePct, suffix: '%' },
      { label: 'Lifetime Pages Used', value: lifetimePagesUsed },
    ];
    grid.innerHTML = cards.map(c => `
      <div class="kpi-card"><div class="kpi-label">${POC.escapeHtml(c.label)}</div>
      <div class="kpi-value">${c.value === null || c.value === undefined ? '—' : Number(c.value).toLocaleString() + (c.suffix || '')}</div></div>
    `).join('');
  }

  function renderCharts(readings) {
    const labels = readings.map(r => r.recorded_at);
    renderOrUpdate('chartPages', {
      type: 'line',
      data: { labels, datasets: [{ data: readings.map(r => r.total_page_count), borderColor: '#22d3c0', backgroundColor: 'rgba(34,211,192,.12)', fill: true, tension: 0.2, pointRadius: 0 }] },
      options: baseChartOptions(),
    });
    renderOrUpdate('chartToner', {
      type: 'line',
      data: { labels, datasets: [{ data: readings.map(r => r.black_toner_pct), borderColor: '#f5a623', backgroundColor: 'rgba(245,166,35,.12)', fill: true, tension: 0.2, pointRadius: 0 }] },
      options: baseChartOptions({ scales: { x: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' } }, y: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' }, min: 0, max: 100 } } }),
    });
  }

  function renderReadingsTable(readings) {
    const body = document.getElementById('readingsBody');
    if (!readings || readings.length === 0) { body.innerHTML = '<tr><td colspan="4" class="empty-state">No readings in this period yet.</td></tr>'; return; }
    body.innerHTML = readings.slice().reverse().map(r => `
      <tr>
        <td>${POC.formatDateTime(r.recorded_at)}</td>
        <td>K ${r.black_toner_pct ?? '—'}% / C ${r.cyan_toner_pct ?? '—'}% / M ${r.magenta_toner_pct ?? '—'}% / Y ${r.yellow_toner_pct ?? '—'}%</td>
        <td>${r.total_page_count !== null ? Number(r.total_page_count).toLocaleString() : '—'}</td>
        <td>${r.response_ms ?? '—'}</td>
      </tr>
    `).join('');
  }

  async function load() {
    try {
      const data = await POC.fetchJSON(`api/printer_history.php?id=${printerId}&period=${period}`);
      if (data.poll_interval_minutes) pollIntervalMinutes = Number(data.poll_interval_minutes);
      renderInfo(data.printer);
      renderKpis(data.printer, data.usage, data.uptime_pct);
      renderCharts(data.readings);
      renderReadingsTable(data.readings);
    } catch (err) {
      document.getElementById('printerInfoPanel').innerHTML = `<div class="empty-state">Failed to load: ${POC.escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#periodToggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#periodToggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        period = btn.dataset.period;
        load();
      });
    });
    load();
  });
})();
