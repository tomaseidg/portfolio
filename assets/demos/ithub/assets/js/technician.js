/**
 * Technician profile page: KPI cards (each a drill-through link, same
 * pattern as the main dashboard), a 6-axis radar performance profile, and
 * a 6-month resolved-tickets + rating trend chart.
 */
(function () {
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#93a3bd';
    Chart.defaults.borderColor = '#1a2740';
  }

  const params = new URLSearchParams(window.location.search);
  const technicianName = params.get('name') || '';
  if (!technicianName) return;

  const KPI_LINK_PARAMS = {
    'Tickets Solved':      { status: ['Closed'] },
    'Customer Rating':     { rated: 'TRUE' },
    // SLA cards drill into exactly the tickets behind the number: the ones
    // resolved inside their own SLA, and the ones that went past it.
    'Within SLA':          { sla_status: 'within' },
    'SLA Breached':        { sla_status: 'breached' },
    'First Response Late': { first_response_overdue: 'TRUE' },
    'Overdue':             { overdue: 'TRUE' },
    'Reopened':            { reopened: 'TRUE' },
  };

  function ticketsLink(extra) {
    const filters = { technician: [technicianName], ...extra };
    return 'tickets.html?' + ITHub.filtersToParams(filters).toString();
  }

  function renderKpis(kpis, errorMsg) {
    const grid = document.getElementById('techKpiGrid');
    if (!grid) return;
    if (errorMsg) {
      grid.innerHTML = `<div class="empty-state">KPIs unavailable: ${ITHub.escapeHtml(errorMsg)}</div>`;
      return;
    }
    if (!kpis || kpis.length === 0) {
      grid.innerHTML = '<div class="empty-state">No data for this technician.</div>';
      return;
    }
    const accentFor = (label) => {
      if (/overdue|sla breached|first response late/i.test(label)) return 'danger';
      if (/reopened|sla usage/i.test(label)) return 'warn';
      if (/rating|overall score|within sla/i.test(label)) return 'ok';
      return '';
    };
    grid.innerHTML = kpis.map(kpi => {
      const display = kpi.format === 'number' ? Number(kpi.value).toLocaleString() : ITHub.escapeHtml(String(kpi.value));
      const label = `<div class="kpi-label">${ITHub.escapeHtml(kpi.label)}</div><div class="kpi-value">${display}</div>`;
      // Avg Resolution and Overall Score are composite/duration values with
      // no single matching ticket filter, so they render as plain (non-link) cards.
      if (kpi.link === false) {
        return `<div class="kpi-card ${accentFor(kpi.label)}" style="cursor:default;">${label}</div>`;
      }
      const href = ticketsLink(KPI_LINK_PARAMS[kpi.label] || {});
      return `<a class="kpi-card ${accentFor(kpi.label)}" href="${href}" title="View these tickets">${label}</a>`;
    }).join('');
  }

  function showChartError(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const wrap = canvas.closest('.chart-wrap') || canvas.parentElement;
    wrap.innerHTML = `<div class="empty-state">Unavailable: ${ITHub.escapeHtml(message)}</div>`;
  }

  function renderRadar(radar, errorMsg) {
    if (errorMsg || !radar) { showChartError('chartRadar', errorMsg || 'No data'); return; }
    if (typeof Chart === 'undefined') { showChartError('chartRadar', 'Chart.js failed to load.'); return; }

    const canvas = document.getElementById('chartRadar');
    if (!canvas) return;

    try {
      new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels: radar.labels,
          datasets: [{
            label: technicianName,
            data: radar.values,
            backgroundColor: 'rgba(34,211,192,.18)',
            borderColor: '#22d3c0',
            borderWidth: 2,
            pointBackgroundColor: '#22d3c0',
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0,
              max: 100,
              angleLines: { color: '#1a2740' },
              grid: { color: '#1a2740' },
              pointLabels: { color: '#93a3bd', font: { size: 11 } },
              ticks: { color: '#5f7096', backdropColor: 'transparent', stepSize: 20 },
            },
          },
        },
      });
    } catch (err) {
      showChartError('chartRadar', err.message);
    }

    // Explain exactly what each axis is measured against, right under the chart.
    if (Array.isArray(radar.captions)) {
      const captionEl = document.getElementById('radarCaptions');
      if (captionEl) {
        captionEl.innerHTML = radar.captions.map(c => `<li>${ITHub.escapeHtml(c)}</li>`).join('');
      }
    }
  }

  function renderTrend(trend, errorMsg) {
    if (errorMsg || !trend) { showChartError('chartTechTrend', errorMsg || 'No data'); return; }
    if (typeof Chart === 'undefined') { showChartError('chartTechTrend', 'Chart.js failed to load.'); return; }

    const canvas = document.getElementById('chartTechTrend');
    if (!canvas) return;

    try {
      new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: trend.labels,
          datasets: [
            {
              label: 'Tickets Resolved',
              data: trend.resolved,
              borderColor: '#22d3c0',
              backgroundColor: 'rgba(34,211,192,.15)',
              tension: 0.3,
              fill: true,
              yAxisID: 'y',
            },
            {
              label: 'Avg Rating',
              data: trend.rating,
              borderColor: '#f5a623',
              backgroundColor: 'rgba(245,166,35,.1)',
              tension: 0.3,
              spanGaps: true,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#93a3bd', font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: '#5f7096' }, grid: { color: '#1a2740' } },
            y: { position: 'left', beginAtZero: true, ticks: { color: '#5f7096' }, grid: { color: '#1a2740' } },
            y1: { position: 'right', beginAtZero: true, ticks: { color: '#5f7096' }, grid: { display: false } },
          },
        },
      });
    } catch (err) {
      showChartError('chartTechTrend', err.message);
    }
  }

  async function load() {
    try {
      const data = await ITHub.fetchJSON('api/technician_data.php?name=' + encodeURIComponent(technicianName));
      const errors = data.errors || {};
      renderKpis(data.kpis, errors.kpis);
      renderRadar(data.radar, errors.radar);
      renderTrend(data.monthly_trend, errors.monthly_trend);
    } catch (err) {
      const grid = document.getElementById('techKpiGrid');
      if (grid) grid.innerHTML = `<div class="empty-state">Failed to load: ${ITHub.escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
