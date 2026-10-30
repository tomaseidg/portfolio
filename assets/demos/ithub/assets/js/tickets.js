/**
 * Tickets page controller: loads filter dropdowns, fetches paginated /
 * sorted rows from /api/tickets_data.php, renders the table, and wires
 * up column-sort clicks, pagination, the ticket-detail modal and CSV
 * export — all honouring the currently applied filters.
 */
(function () {
  let state = {
    page: 1,
    perPage: 50,
    sort: 'CreatedTime',
    dir: 'DESC',
  };

  function currentParams(extra = {}) {
    const filters = ITHub.getFilterState();
    return ITHub.filtersToParams(filters, {
      page: state.page,
      per_page: state.perPage,
      sort: state.sort,
      dir: state.dir,
      ...extra,
    });
  }

  function renderRows(rows) {
    const body = document.getElementById('ticketsBody');
    if (!rows || rows.length === 0) {
      body.innerHTML = '<tr><td colspan="15" class="empty-state">No tickets match the selected filters.</td></tr>';
      return;
    }

    body.innerHTML = rows.map(t => `
      <tr>
        <td class="mono">${ITHub.escapeHtml(t.RequestID)}</td>
        <td>${ITHub.formatDateTime(t.CreatedTime)}</td>
        <td><a href="technician.html?name=${encodeURIComponent(t.Technician || '')}" class="tech-link">${ITHub.escapeHtml(t.Technician)}</a></td>
        <td>${ITHub.escapeHtml(t.Requester)}</td>
        <td>${ITHub.escapeHtml(t.RequestType)}</td>
        <td>${ITHub.escapeHtml(t.Category)}</td>
        <td>${ITHub.escapeHtml(t.SubCategory)}</td>
        <td><span class="badge ${ITHub.statusBadgeClass(t.RequestStatus)}">${ITHub.escapeHtml(t.RequestStatus)}</span></td>
        <td><span class="badge ${ITHub.priorityBadgeClass(t.Priority)}">${ITHub.escapeHtml(t.Priority)}</span></td>
        <td>${ITHub.escapeHtml(t.Site)}</td>
        <td>${ITHub.escapeHtml(t.Department)}</td>
        <td>${ITHub.escapeHtml(t.Group)}</td>
        <td>${t.SLA ? ITHub.escapeHtml(t.SLA) : '<span class="empty-state" style="padding:0;">—</span>'}</td>
        <td>${t.SurveyScore ? ITHub.escapeHtml(t.SurveyScore) + ' &#9733;' : '<span class="empty-state" style="padding:0;">—</span>'}</td>
        <td><button class="link-btn" data-id="${ITHub.escapeHtml(t.RequestID)}">View</button></td>
      </tr>
    `).join('');

    body.querySelectorAll('.link-btn').forEach(btn => {
      btn.addEventListener('click', () => openTicketModal(btn.dataset.id));
    });
  }

  function renderSummary(total, page, perPage) {
    const el = document.getElementById('resultsSummary');
    if (!el) return;
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(total, page * perPage);
    el.textContent = `Showing ${from}-${to} of ${total.toLocaleString()} tickets`;
  }

  function renderPagination(totalPages, page) {
    const el = document.getElementById('pagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    const buttons = [];
    buttons.push(`<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">&#8249; Prev</button>`);

    const windowStart = Math.max(1, page - 2);
    const windowEnd = Math.min(totalPages, page + 2);
    for (let p = windowStart; p <= windowEnd; p++) {
      buttons.push(`<button class="${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`);
    }

    buttons.push(`<button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">Next &#8250;</button>`);
    el.innerHTML = buttons.join('');

    el.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = Number(btn.dataset.page);
        loadTickets();
      });
    });
  }

  function updateSortIndicators() {
    document.querySelectorAll('#ticketsTable thead th[data-col]').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.col === state.sort) {
        th.classList.add(state.dir === 'ASC' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  async function loadTickets() {
    const body = document.getElementById('ticketsBody');
    body.innerHTML = '<tr><td colspan="15" class="empty-state">Loading…</td></tr>';

    try {
      const data = await ITHub.fetchJSON('api/tickets_data.php?' + currentParams().toString());
      renderRows(data.rows);
      renderSummary(data.total, data.page, data.per_page);
      renderPagination(data.total_pages, data.page);
      updateSortIndicators();
    } catch (err) {
      body.innerHTML = `<tr><td colspan="15" class="empty-state">Failed to load tickets: ${ITHub.escapeHtml(err.message)}</td></tr>`;
      console.error(err);
    }
  }

  function applyFilters() {
    state.page = 1;
    loadTickets();
  }

  function wireSorting() {
    document.querySelectorAll('#ticketsTable thead th[data-col]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (state.sort === col) {
          state.dir = state.dir === 'ASC' ? 'DESC' : 'ASC';
        } else {
          state.sort = col;
          state.dir = 'ASC';
        }
        state.page = 1;
        loadTickets();
      });
    });
  }

  async function openTicketModal(id) {
    const modal = document.getElementById('ticketModal');
    const body = document.getElementById('modalBody');
    const reqIdEl = document.getElementById('modalReqId');

    reqIdEl.textContent = id;
    body.innerHTML = '<div class="empty-state">Loading…</div>';
    modal.style.display = 'flex';

    try {
      const ticket = await ITHub.fetchJSON('api/ticket_detail.php?id=' + encodeURIComponent(id));
      body.innerHTML = '<dl>' + Object.entries(ticket).map(([key, value]) => `
        <dt>${ITHub.escapeHtml(key)}</dt>
        <dd>${ITHub.escapeHtml(value ?? '—')}</dd>
      `).join('') + '</dl>';
    } catch (err) {
      body.innerHTML = `<div class="empty-state">Failed to load ticket: ${ITHub.escapeHtml(err.message)}</div>`;
    }
  }

  window.closeModal = function () {
    document.getElementById('ticketModal').style.display = 'none';
  };

  function wireExport() {
    const csvBtn = document.getElementById('exportCsv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const params = ITHub.filtersToParams(ITHub.getFilterState());
        DEMO.go('api/export_csv.php?' + params.toString());
      });
    }

    const excelBtn = document.getElementById('exportExcel');
    if (excelBtn) {
      excelBtn.addEventListener('click', () => {
        const params = ITHub.filtersToParams(ITHub.getFilterState());
        DEMO.go('api/export_excel.php?' + params.toString());
      });
    }
  }

  function wirePerPage() {
    const sel = document.getElementById('perPageSelect');
    if (!sel) return;
    sel.value = String(state.perPage);
    sel.addEventListener('change', () => {
      state.perPage = Number(sel.value) || 50;
      state.page = 1;
      loadTickets();
    });
  }

  /** Human-readable labels for the "Filtered by" banner. */
  const FILTER_LABELS = {
    site: 'Site', technician: 'Technician', department: 'Department',
    category: 'Category', requester: 'Requester', request_type: 'Type',
    ticket_group: 'Group', priority: 'Priority', sla: 'SLA',
  };

  /**
   * Reads a drill-through link's query string (from a KPI card, a Top-10
   * row, or a ranking.html row) and applies it before the first load:
   * known multi-select filters (site/technician/department/months) get
   * preset into the real dropdown so they show as active selections;
   * filters with no UI control (category/requester/request_type/overdue/
   * reopened/first_response_overdue) go through the "extra filters"
   * mechanism instead, and a summary banner explains what's applied.
   */
  function applyFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return;

    const bannerParts = [];

    ['site', 'technician', 'department', 'category', 'requester', 'ticket_group'].forEach(key => {
      const values = params.getAll(`${key}[]`);
      if (values.length === 0) return;
      if (key === 'site' || key === 'technician' || key === 'department' || key === 'ticket_group') {
        values.forEach(v => ITHub.presetMultiSelectValue(key, v));
      }
      bannerParts.push(`${FILTER_LABELS[key] || key}: ${values.join(', ')}`);
    });

    const monthValues = params.getAll('months[]');
    monthValues.forEach(v => ITHub.presetMultiSelectValue('months', v));
    const quarterValues = params.getAll('quarters[]');
    quarterValues.forEach(v => ITHub.presetMultiSelectValue('quarters', v));

    const dateFrom = params.get('date_from');
    if (dateFrom) document.getElementById('f_date_from').value = dateFrom;
    const dateTo = params.get('date_to');
    if (dateTo) document.getElementById('f_date_to').value = dateTo;

    const search = params.get('search');
    if (search) {
      document.getElementById('f_search').value = search;
      const wrap = document.getElementById('tbSearchWrap');
      if (wrap) wrap.style.display = '';
    }

    const extra = {};
    ['category', 'requester', 'request_type', 'status', 'priority', 'sla'].forEach(key => {
      const values = params.getAll(`${key}[]`);
      if (values.length) extra[key] = values;
    });

    const priorityValues = params.getAll('priority[]');
    if (priorityValues.length) bannerParts.push(`Priority: ${priorityValues.join(', ')}`);
    const slaValues = params.getAll('sla[]');
    if (slaValues.length) bannerParts.push(`SLA: ${slaValues.join(', ')}`);

    // Chart drill-through params — set when arriving from a dashboard chart.
    const CREATED_BY_TEXT = {
      system: 'Created by the system',
      technician: 'Created by a technician',
      unknown: 'Created by: unknown',
    };
    const createdByKind = params.get('created_by_kind');
    if (CREATED_BY_TEXT[createdByKind]) {
      extra.created_by_kind = createdByKind;
      bannerParts.push(CREATED_BY_TEXT[createdByKind]);
    }

    const TYPE_GROUP_TEXT = {
      service: 'Service Requests',
      incident: 'Incidents',
      other: 'Other request types',
    };
    const typeGroup = params.get('request_type_group');
    if (TYPE_GROUP_TEXT[typeGroup]) {
      extra.request_type_group = typeGroup;
      bannerParts.push(TYPE_GROUP_TEXT[typeGroup]);
    }

    const SLA_STATUS_TEXT = {
      within: 'Resolved within SLA',
      breached: 'Resolved past SLA',
      unknown: 'No SLA measurement',
    };
    const slaStatus = params.get('sla_status');
    if (SLA_STATUS_TEXT[slaStatus]) {
      extra.sla_status = slaStatus;
      bannerParts.push(SLA_STATUS_TEXT[slaStatus]);
    }

    const requestTypeValues = params.getAll('request_type[]');
    if (requestTypeValues.length) bannerParts.push(`Type: ${requestTypeValues.join(', ')}`);
    const statusValues = params.getAll('status[]');
    if (statusValues.length) bannerParts.push(`Status: ${statusValues.join(', ')}`);

    const overdue = params.get('overdue');
    if (overdue === 'TRUE' || overdue === 'FALSE') {
      extra.overdue = overdue;
      bannerParts.push(overdue === 'TRUE' ? 'Overdue tickets' : 'On-time tickets');
    }
    const reopened = params.get('reopened');
    if (reopened === 'TRUE' || reopened === 'FALSE') {
      extra.reopened = reopened;
      bannerParts.push(reopened === 'TRUE' ? 'Reopened tickets' : 'Not reopened');
    }
    const fro = params.get('first_response_overdue');
    if (fro === 'TRUE' || fro === 'FALSE') {
      extra.first_response_overdue = fro;
      bannerParts.push(fro === 'TRUE' ? 'First response overdue' : 'First response on time');
    }
    const vip = params.get('vip');
    if (vip === 'TRUE' || vip === 'FALSE') {
      extra.vip = vip;
      bannerParts.push(vip === 'TRUE' ? 'VIP tickets' : 'Non-VIP tickets');
    }
    const rated = params.get('rated');
    if (rated === 'TRUE') {
      extra.rated = 'TRUE';
      bannerParts.push('Tickets with a customer rating');
    }
    const incomplete = params.get('incomplete');
    if (incomplete === 'TRUE') {
      extra.incomplete = 'TRUE';
      bannerParts.push('Tickets with incomplete data');
    }

    ITHub.setExtraFilterParams(extra);

    if (bannerParts.length > 0) {
      const banner = document.getElementById('quickFilterBanner');
      const text = document.getElementById('quickFilterText');
      if (banner && text) {
        text.textContent = 'Filtered by: ' + bannerParts.join(' · ');
        banner.style.display = '';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    ITHub.initAllMultiSelects();
    applyFiltersFromURL();
    await ITHub.loadFilterMeta();
    ITHub.wireFilterButtons(applyFilters);
    wireSorting();
    wireExport();
    wirePerPage();
    await loadTickets();

    document.getElementById('ticketModal').addEventListener('click', (e) => {
      if (e.target.id === 'ticketModal') window.closeModal();
    });
  });
})();
