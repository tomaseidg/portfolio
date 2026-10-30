(function () {
  function getFilters() {
    return {
      site: POC.getMultiSelectValues('site'),
      department: POC.getMultiSelectValues('department'),
      company: POC.getMultiSelectValues('company'),
      cost_center: POC.getMultiSelectValues('cost_center'),
    };
  }

  function currentParams() {
    const period = document.getElementById('r_period').value;
    const params = new URLSearchParams();
    params.set('period', period);
    if (period === 'custom') {
      params.set('from', document.getElementById('r_from').value);
      params.set('to', document.getElementById('r_to').value);
    }
    for (const [key, values] of Object.entries(getFilters())) {
      values.forEach(v => params.append(`${key}[]`, v));
    }
    return params;
  }

  function formatEgp(value) {
    return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  }

  function renderKpis(rows, totalPages, totalCostEgp) {
    const grid = document.getElementById('reportKpiGrid');
    const tracked = rows.filter(r => r.pages_used !== null).length;
    grid.innerHTML = `
      <div class="kpi-card"><div class="kpi-label">Printers in Report</div><div class="kpi-value">${rows.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">With Usable Data</div><div class="kpi-value">${tracked}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Pages Used</div><div class="kpi-value">${Number(totalPages).toLocaleString()}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Cost</div><div class="kpi-value">${formatEgp(totalCostEgp)}</div></div>
    `;
  }

  function statusBadge(status) {
    const map = { active: 'badge-ok', maintenance: 'badge-warn', installing: 'badge-neutral', planned: 'badge-neutral', retired: 'badge-danger' };
    return `<span class="badge ${map[status] || 'badge-neutral'}">${POC.escapeHtml(status)}</span>`;
  }

  function renderTable(rows) {
    const body = document.getElementById('reportBody');
    if (!rows || rows.length === 0) { body.innerHTML = '<tr><td colspan="12" class="empty-state">No printers match this filter.</td></tr>'; return; }
    body.innerHTML = rows.map(r => `
      <tr>
        <td><a href="printer_detail.html?id=${r.id}">${POC.escapeHtml(r.name)}</a></td>
        <td class="mono">${POC.escapeHtml(r.ip_address)}</td>
        <td class="mono">${POC.escapeHtml(r.serial_number || '—')}</td>
        <td>${POC.escapeHtml(r.site || '—')}</td>
        <td>${POC.escapeHtml(r.department || '—')}</td>
        <td>${POC.escapeHtml(r.company || '—')}</td>
        <td>${POC.escapeHtml(r.cost_center || '—')}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${r.pages_start !== null ? Number(r.pages_start).toLocaleString() : '—'}</td>
        <td>${r.pages_end !== null ? Number(r.pages_end).toLocaleString() : '—'}</td>
        <td><strong>${r.pages_used !== null ? Number(r.pages_used).toLocaleString() : '—'}</strong></td>
        <td>${r.cost_egp !== null && r.cost_egp !== undefined ? formatEgp(r.cost_egp) : '—'}</td>
      </tr>
    `).join('');
  }

  async function generate() {
    try {
      const params = currentParams();
      const data = await POC.fetchJSON(`api/reports_data.php?${params.toString()}`);
      renderKpis(data.rows, data.total_pages, data.total_cost_egp);
      renderTable(data.rows);
    } catch (err) {
      document.getElementById('reportBody').innerHTML = `<tr><td colspan="12" class="empty-state">Failed to load: ${POC.escapeHtml(err.message)}</td></tr>`;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    POC.initAllMultiSelects();
    const meta = await POC.fetchJSON('api/printers_meta.php');
    POC.fillMultiSelect('site', meta.sites);
    POC.fillMultiSelect('department', meta.departments);
    POC.fillMultiSelect('company', meta.companies);
    POC.fillMultiSelect('cost_center', meta.cost_centers);

    document.getElementById('r_period').addEventListener('change', (e) => {
      const isCustom = e.target.value === 'custom';
      document.getElementById('r_from_wrap').style.display = isCustom ? '' : 'none';
      document.getElementById('r_to_wrap').style.display = isCustom ? '' : 'none';
    });
    document.getElementById('applyReport').addEventListener('click', generate);
    document.getElementById('exportCsv').addEventListener('click', () => {
      DEMO.go(`api/reports_export_csv.php?${currentParams().toString()}`);
    });

    await generate();
  });
})();
