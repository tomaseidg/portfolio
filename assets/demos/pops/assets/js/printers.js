(function () {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
  let currentPage = 1;
  let canEdit = false;
  let canDelete = false;
  let printersById = {};
  let pollIntervalMinutes = 15; // overwritten from api/printers_meta.php once loaded

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function getFilters() {
    return {
      site: POC.getMultiSelectValues('site'),
      building: POC.getMultiSelectValues('building'),
      department: POC.getMultiSelectValues('department'),
      company: POC.getMultiSelectValues('company'),
      cost_center: POC.getMultiSelectValues('cost_center'),
      status: POC.getMultiSelectValues('status'),
      search: document.getElementById('f_search').value.trim(),
    };
  }

  function filtersToParams(filters, extra = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) value.forEach(v => params.append(`${key}[]`, v));
      else if (value !== '' && value != null) params.set(key, value);
    }
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    return params;
  }

  async function loadMeta() {
    const data = await POC.fetchJSON('api/printers_meta.php');
    POC.fillMultiSelect('site', data.sites);
    POC.fillMultiSelect('building', data.buildings);
    POC.fillMultiSelect('department', data.departments);
    POC.fillMultiSelect('company', data.companies);
    POC.fillMultiSelect('cost_center', data.cost_centers);
    POC.fillMultiSelect('status', ['active', 'installing', 'maintenance', 'planned', 'retired']);
    canEdit = !!data.can_edit;
    canDelete = !!data.can_delete;
    if (data.poll_interval_minutes) pollIntervalMinutes = Number(data.poll_interval_minutes);
    document.getElementById('addPrinterBtn').style.display = canEdit ? '' : 'none';
  }

  function minutesAgo(value) {
    if (!value) return Infinity;
    const d = new Date(String(value).replace(' ', 'T'));
    if (isNaN(d.getTime())) return Infinity;
    return (Date.now() - d.getTime()) / 60000;
  }

  /**
   * "Online" (the dot) and "telemetry is current" (toner/page count) are
   * TWO DIFFERENT SIGNALS from two different checks: the dot is driven by
   * a lightweight reachability ping that runs ~every minute; the toner/page
   * numbers come from a much slower full SNMP poll (every ${pollIntervalMinutes}
   * min) that can silently keep failing (wrong SNMP community string, UDP
   * 161 blocked, etc.) for a printer that's perfectly reachable otherwise.
   * A printer can therefore show a green "online" dot while its toner/page
   * data is stuck on an old reading. Flag that case explicitly instead of
   * letting the green dot imply the numbers next to it are current.
   */
  function isTelemetryStale(p) {
    if (p.status !== 'active' || p.is_online != 1) return false;
    return minutesAgo(p.last_polled_at) > pollIntervalMinutes * 2;
  }

  function staleWarningHtml(p) {
    if (!isTelemetryStale(p)) return '';
    const attempted = p.last_poll_attempt_at ? `last attempt ${POC.timeAgo(p.last_poll_attempt_at)}` : 'no attempt recorded yet';
    const title = `Printer is online, but the SNMP telemetry poll (toner/page count) has been failing — ${attempted}. ` +
      `The numbers shown are from the last successful reading, not live. Check the SNMP community string and that UDP 161 isn't blocked for this printer.`;
    return ` <span class="badge badge-warn" title="${POC.escapeHtml(title)}">&#9888; stale</span>`;
  }

  function liveDot(p) {
    if (p.status !== 'active') return '<span class="status-dot unknown" title="Not tracked (status is not Active)"></span>';
    if (p.is_online === null || p.is_online === undefined) return '<span class="status-dot unknown" title="Never polled yet"></span>';
    return p.is_online == 1
      ? `<span class="status-dot online" title="Network reachable — last seen ${POC.timeAgo(p.last_seen_online_at)}. (This is connectivity only, not proof the toner/page data is current.)"></span>`
      : `<span class="status-dot offline" title="Offline"></span>`;
  }

  function statusBadge(status) {
    const map = { active: 'badge-ok', maintenance: 'badge-warn', installing: 'badge-neutral', planned: 'badge-neutral', retired: 'badge-danger' };
    return `<span class="badge ${map[status] || 'badge-neutral'}">${POC.escapeHtml(status)}</span>`;
  }

  function tonerCell(p) {
    if (p.status !== 'active') return '<span class="empty-state" style="padding:0;">—</span>';
    const fmt = (v) => v === null || v === undefined ? '—' : `${Number(v)}%`;
    const cls = (v) => v !== null && v !== undefined && Number(v) < 15 ? 'badge-danger' : 'badge-neutral';
    const parts = [`<span class="badge ${cls(p.black_toner_pct)}">K ${fmt(p.black_toner_pct)}</span>`];
    if (p.cyan_toner_pct !== null || p.magenta_toner_pct !== null || p.yellow_toner_pct !== null) {
      parts.push(`<span class="badge badge-neutral">C ${fmt(p.cyan_toner_pct)}</span>`);
      parts.push(`<span class="badge badge-neutral">M ${fmt(p.magenta_toner_pct)}</span>`);
      parts.push(`<span class="badge badge-neutral">Y ${fmt(p.yellow_toner_pct)}</span>`);
    }
    return parts.join(' ') + staleWarningHtml(p);
  }

  function renderTable(rows) {
    const body = document.getElementById('printersBody');
    printersById = {};
    if (!rows || rows.length === 0) { body.innerHTML = '<tr><td colspan="16" class="empty-state">No printers found.</td></tr>'; return; }
    rows.forEach(p => { printersById[p.id] = p; });

    body.innerHTML = rows.map(p => `
      <tr>
        <td>${liveDot(p)}</td>
        <td><a href="printer_detail.html?id=${p.id}">${POC.escapeHtml(p.name)}</a></td>
        <td class="mono">${POC.escapeHtml(p.ip_address)}</td>
        <td>${POC.escapeHtml(p.model || '—')}</td>
        <td class="mono">${POC.escapeHtml(p.serial_number || '—')}</td>
        <td>${POC.escapeHtml(p.site || '—')}</td>
        <td>${POC.escapeHtml([p.building, p.floor].filter(Boolean).join(' / ') || '—')}</td>
        <td>${POC.escapeHtml(p.department || '—')}</td>
        <td>${POC.escapeHtml(p.company || '—')}</td>
        <td>${POC.escapeHtml(p.cost_center || '—')}</td>
        <td>${statusBadge(p.status)}</td>
        <td>${tonerCell(p)}</td>
        <td>${p.total_page_count !== null ? Number(p.total_page_count).toLocaleString() : '—'}</td>
        <td>${p.last_polled_at ? POC.timeAgo(p.last_polled_at) : '<span class="empty-state" style="padding:0;">never</span>'}${isTelemetryStale(p) ? ' <span class="badge badge-warn" title="Online, but SNMP polling is failing — this is not a live reading.">&#9888;</span>' : ''}</td>
        <td>${POC.escapeHtml(p.added_by_name || '—')}</td>
        <td class="admin-actions">
          ${canEdit ? `<button class="link-btn" data-action="edit" data-id="${p.id}">Edit</button>` : ''}
          ${canDelete ? `<button class="link-btn" data-action="delete" data-id="${p.id}">Delete</button>` : ''}
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === 'edit') openPrinterModal(printersById[id]);
        if (btn.dataset.action === 'delete') deletePrinter(id);
      });
    });
  }

  function renderPagination(totalPages, page) {
    const el = document.getElementById('printersPagination');
    if (totalPages <= 1) { el.innerHTML = ''; return; }
    const buttons = [`<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">&#8249; Prev</button>`];
    const start = Math.max(1, page - 2), end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p++) buttons.push(`<button class="${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`);
    buttons.push(`<button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">Next &#8250;</button>`);
    el.innerHTML = buttons.join('');
    el.querySelectorAll('button[data-page]').forEach(btn => btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); loadTable(); }));
  }

  async function loadTable() {
    try {
      const perPage = document.getElementById('printerPerPage').value;
      const params = filtersToParams(getFilters(), { page: currentPage, per_page: perPage });
      const data = await POC.fetchJSON(`api/printers_data.php?${params.toString()}`);
      renderTable(data.rows);
      renderPagination(data.total_pages, data.page);
      const from = data.total === 0 ? 0 : (data.page - 1) * data.per_page + 1;
      const to = Math.min(data.total, data.page * data.per_page);
      document.getElementById('printersSummary').textContent = `Showing ${from}-${to} of ${data.total.toLocaleString()} printers`;
    } catch (err) {
      document.getElementById('printersBody').innerHTML = `<tr><td colspan="16" class="empty-state">Failed to load: ${POC.escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function refreshAll() { currentPage = 1; await loadTable(); }

  async function deletePrinter(id) {
    const p = printersById[id];
    if (!confirm(`Delete printer "${p ? p.name : id}"? This also deletes its full history and cannot be undone.`)) return;
    try { await postJSON('api/printer_delete.php', { id }); await refreshAll(); }
    catch (err) { alert(err.message); }
  }

  function openPrinterModal(printer = null) {
    document.getElementById('printerModalTitle').textContent = printer ? 'Edit Printer' : 'Add Printer';
    document.getElementById('printerModalError').style.display = 'none';
    document.getElementById('pf_id').value = printer ? printer.id : '';
    document.getElementById('pf_name').value = printer ? printer.name : '';
    document.getElementById('pf_ip').value = printer ? printer.ip_address : '';
    document.getElementById('pf_site').value = printer ? printer.site : '';
    document.getElementById('pf_building').value = printer ? (printer.building || '') : '';
    document.getElementById('pf_floor').value = printer ? (printer.floor || '') : '';
    document.getElementById('pf_department').value = printer ? (printer.department || '') : '';
    document.getElementById('pf_company').value = printer ? (printer.company || '') : '';
    document.getElementById('pf_cost_center').value = printer ? (printer.cost_center || '') : '';
    document.getElementById('pf_start_date').value = printer ? (printer.start_date ? String(printer.start_date).slice(0, 10) : '') : '';
    document.getElementById('pf_start_page').value = printer ? (printer.start_page ?? '') : '';
    document.getElementById('pf_status').value = printer ? printer.status : 'planned';
    document.getElementById('pf_notes').value = printer ? (printer.notes || '') : '';
    document.getElementById('printerModal').style.display = 'flex';
  }

  window.closePrinterModal = function () { document.getElementById('printerModal').style.display = 'none'; };

  async function submitPrinterForm(e) {
    e.preventDefault();
    const errorEl = document.getElementById('printerModalError');
    errorEl.style.display = 'none';
    const idRaw = document.getElementById('pf_id').value;
    const payload = {
      id: idRaw ? Number(idRaw) : null,
      name: document.getElementById('pf_name').value.trim(),
      ip_address: document.getElementById('pf_ip').value.trim(),
      site: document.getElementById('pf_site').value.trim(),
      building: document.getElementById('pf_building').value.trim(),
      floor: document.getElementById('pf_floor').value.trim(),
      department: document.getElementById('pf_department').value.trim(),
      company: document.getElementById('pf_company').value.trim(),
      cost_center: document.getElementById('pf_cost_center').value.trim(),
      start_date: document.getElementById('pf_start_date').value,
      start_page: document.getElementById('pf_start_page').value === '' ? null : Number(document.getElementById('pf_start_page').value),
      status: document.getElementById('pf_status').value,
      notes: document.getElementById('pf_notes').value.trim(),
    };
    try {
      await postJSON('api/printer_save.php', payload);
      window.closePrinterModal();
      await Promise.all([loadMeta(), refreshAll()]);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = '';
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    POC.initAllMultiSelects();
    document.getElementById('applyFilters').addEventListener('click', refreshAll);
    document.getElementById('resetFilters').addEventListener('click', () => {
      document.getElementById('f_search').value = '';
      ['site', 'building', 'department', 'company', 'cost_center', 'status'].forEach(key => document.getElementById(`ms_${key}`)?.querySelector('.msel-clear')?.click());
      refreshAll();
    });
    document.getElementById('printerPerPage').addEventListener('change', refreshAll);
    document.getElementById('addPrinterBtn').addEventListener('click', () => openPrinterModal());
    document.getElementById('printerForm').addEventListener('submit', submitPrinterForm);

    await loadMeta();
    await refreshAll();
  });
})();
