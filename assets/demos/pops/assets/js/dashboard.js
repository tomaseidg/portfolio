(function () {
  const charts = {};
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#93a3bd';
    Chart.defaults.borderColor = '#1a2740';
  }
  const PALETTE = ['#22d3c0', '#f5a623', '#f5646c', '#4ade80', '#7c9cf5', '#c084fc', '#5f7096'];
  const STATUS_COLORS = { active: '#4ade80', maintenance: '#f5a623', installing: '#7c9cf5', planned: '#5f7096', retired: '#f5646c' };

  function baseChartOptions(extra = {}) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#93a3bd', font: { family: 'Inter', size: 11 } } } },
      scales: {
        x: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' } },
        y: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' }, beginAtZero: true },
      },
    }, extra);
  }

  function renderOrUpdate(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      canvas.closest('.chart-wrap').innerHTML = '<div class="empty-state">Chart.js failed to load.</div>';
      return;
    }
    try {
      if (charts[canvasId]) {
        charts[canvasId].data = config.data;
        charts[canvasId].options = config.options;
        charts[canvasId].update();
        return;
      }
      charts[canvasId] = new Chart(canvas.getContext('2d'), config);
    } catch (err) {
      canvas.closest('.chart-wrap').innerHTML = `<div class="empty-state">Unavailable: ${POC.escapeHtml(err.message)}</div>`;
    }
  }

  function renderKpis(kpis) {
    const grid = document.getElementById('kpiGrid');
    if (!kpis || kpis.length === 0) { grid.innerHTML = '<div class="empty-state">No data.</div>'; return; }
    grid.innerHTML = kpis.map(k => {
      const accent = k.warn ? 'warn' : '';
      const val = k.value === null ? '—' : Number(k.value).toLocaleString();
      return `<div class="kpi-card ${accent}"><div class="kpi-label">${POC.escapeHtml(k.label)}</div><div class="kpi-value">${val}</div></div>`;
    }).join('');
  }

  function renderStatusChart(rows) {
    if (!rows) return;
    const labels = rows.map(r => r.status);
    const values = rows.map(r => Number(r.c));
    const colors = labels.map((l, i) => STATUS_COLORS[l] || PALETTE[i % PALETTE.length]);
    const total = values.reduce((a, b) => a + b, 0) || 1;
    renderOrUpdate('chartStatus', {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#131c2e', borderWidth: 2 }] },
      options: baseChartOptions({
        scales: undefined,
        plugins: { legend: { labels: { generateLabels(chart) {
          return chart.data.labels.map((label, i) => ({
            text: `${label}: ${values[i]} (${((values[i] / total) * 100).toFixed(1)}%)`,
            fillStyle: colors[i], strokeStyle: '#131c2e', index: i,
          }));
        } } } },
      }),
    });
  }

  function renderBySiteChart(rows) {
    if (!rows) return;
    renderOrUpdate('chartBySite', {
      type: 'bar',
      data: { labels: rows.map(r => r.site), datasets: [{ data: rows.map(r => Number(r.c)), backgroundColor: '#22d3c0' }] },
      options: baseChartOptions({ plugins: { legend: { display: false } } }),
    });
  }

  function formatEgp(value) {
    return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  }

  function renderPagesByPrinterChart(data) {
    if (!data) return;
    const wrap = document.getElementById('chartPagesByPrinterWrap');
    if (!data.labels || data.labels.length === 0) {
      if (wrap) wrap.innerHTML = '<div class="empty-state">No page readings in the last 30 days.</div>';
      return;
    }
    // One horizontal bar per printer, every printer included (no top-N
    // cap) — the row count varies with fleet size, so size the chart to
    // fit instead of cramming everything into a fixed height. Beyond
    // ~900px (set in index.html) the wrapper scrolls instead of growing
    // forever for very large fleets.
    if (wrap) {
      const rowHeight = 24;
      wrap.style.height = `${Math.max(280, data.labels.length * rowHeight + 40)}px`;
    }
    renderOrUpdate('chartPagesByPrinter', {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{ label: 'Pages Printed', data: data.values, backgroundColor: '#22d3c0' }],
      },
      options: baseChartOptions({
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${Number(ctx.parsed.x).toLocaleString()} pages` } },
        },
        scales: {
          x: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' }, beginAtZero: true },
          y: { ticks: { color: '#5f7096' }, grid: { display: false } },
        },
      }),
    });
  }

  function renderCostByCostCenterChart(data) {
    if (!data) return;
    if (!data.labels || data.labels.length === 0) {
      const canvas = document.getElementById('chartCostByCostCenter');
      if (canvas) canvas.closest('.chart-wrap').innerHTML = '<div class="empty-state">No page readings so far this month.</div>';
      return;
    }
    renderOrUpdate('chartCostByCostCenter', {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{ label: 'Cost (USD)', data: data.costs, backgroundColor: '#f5a623' }],
      },
      options: baseChartOptions({
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(ctx) {
                const pages = data.pages[ctx.dataIndex];
                return `${formatEgp(ctx.parsed.y)} — ${Number(pages).toLocaleString()} pages`;
              },
            },
          },
        },
      }),
    });
  }

  function renderAttentionList(rows) {
    const el = document.getElementById('attentionList');
    if (!rows || rows.length === 0) {
      el.innerHTML = '<li class="empty-state">Everything looks healthy. &#127881;</li>';
      return;
    }
    el.innerHTML = rows.map(r => {
      const badges = [];
      if (r.is_online == 0) badges.push('<span class="badge badge-danger">Offline</span>');
      if (r.black_toner_pct !== null && Number(r.black_toner_pct) < 15) badges.push(`<span class="badge badge-warn">Toner ${Number(r.black_toner_pct)}%</span>`);
      return `<li><div class="rank-row">
        <a class="rank-name-link" href="printer_detail.html?id=${r.id}"><span>${POC.escapeHtml(r.name)} <small class="mono">${POC.escapeHtml(r.ip_address)}</small> — ${POC.escapeHtml(r.site || '')}</span></a>
        <span>${badges.join(' ')}</span>
      </div></li>`;
    }).join('');
  }

  async function load() {
    try {
      const data = await POC.fetchJSON('api/dashboard_data.php');
      renderKpis(data.kpis);
      renderStatusChart(data.status_distribution);
      renderBySiteChart(data.by_site);
      renderPagesByPrinterChart(data.pages_by_printer_30d);
      renderCostByCostCenterChart(data.cost_by_cost_center_month);
      renderAttentionList(data.attention_list);
    } catch (err) {
      document.getElementById('kpiGrid').innerHTML = `<div class="empty-state">Failed to load: ${POC.escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
