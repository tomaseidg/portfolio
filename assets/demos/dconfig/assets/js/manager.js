(function () {
  const charts = {};
  const palette = ['#22d3c0', '#f5a623', '#f5646c', '#60a5fa', '#a78bfa', '#4ade80', '#5f7096'];

  function chart(id, config) {
    const ctx = document.getElementById(id);
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, config);
  }

  function baseOptions(extra) {
    return Object.assign({
      responsive: true,
      plugins: { legend: { labels: { color: '#93a3bd' } } },
      scales: { x: { ticks: { color: '#93a3bd' }, grid: { color: '#223351' } }, y: { ticks: { color: '#93a3bd' }, grid: { color: '#223351' } } },
    }, extra || {});
  }

  function renderKpi(kpi) {
    document.getElementById('mgrKpiGrid').innerHTML = `
      <div class="kpi-card"><div class="kpi-label">Total Devices</div><div class="kpi-value">${kpi.total}</div></div>
      <div class="kpi-card ok"><div class="kpi-label">Completed</div><div class="kpi-value">${kpi.completed}</div></div>
      <div class="kpi-card warn"><div class="kpi-label">In Progress</div><div class="kpi-value">${kpi.in_progress}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pending Audit</div><div class="kpi-value">${kpi.pending_audit}</div></div>
      <div class="kpi-card danger"><div class="kpi-label">Rejected by Audit</div><div class="kpi-value">${kpi.rejected}</div></div>
      <div class="kpi-card warn"><div class="kpi-label">Pending Approval</div><div class="kpi-value">${kpi.pending_approval}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg. Completion</div><div class="kpi-value">${kpi.avg_hours}h</div></div>
    `;
  }

  function renderCharts(c) {
    chart('chartStatus', {
      type: 'doughnut',
      data: { labels: c.by_status.map(r => r.status), datasets: [{ data: c.by_status.map(r => r.c), backgroundColor: palette }] },
      options: baseOptions({ scales: undefined }),
    });
    // Devices by type, with the completed share drawn on top of the
    // total, so a manager can see at a glance how much printer or
    // monitor work is actually finished rather than just queued. Each
    // bar uses that type's own accent, the same colour as its icon.
    chart('chartDeviceType', {
      type: 'bar',
      data: {
        labels: c.by_device_type.map(r => r.label),
        datasets: [
          { label: 'Total', data: c.by_device_type.map(r => r.c),
            backgroundColor: c.by_device_type.map(r => r.accent + '55'),
            borderColor: c.by_device_type.map(r => r.accent), borderWidth: 1 },
          { label: 'Completed', data: c.by_device_type.map(r => r.completed),
            backgroundColor: c.by_device_type.map(r => r.accent) },
        ],
      },
      options: baseOptions(),
    });
    chart('chartDept', {
      type: 'bar',
      data: { labels: c.by_department.map(r => r.name), datasets: [{ data: c.by_department.map(r => r.c), backgroundColor: '#22d3c0' }] },
      options: baseOptions({ plugins: { legend: { display: false } } }),
    });
    chart('chartTech', {
      type: 'bar',
      data: {
        labels: c.by_technician.map(r => r.full_name),
        datasets: [
          { label: 'Total', data: c.by_technician.map(r => r.c), backgroundColor: '#60a5fa' },
          { label: 'Completed', data: c.by_technician.map(r => r.completed), backgroundColor: '#4ade80' },
        ],
      },
      options: baseOptions(),
    });
    chart('chartDaily', {
      type: 'line',
      data: { labels: c.daily_completed.map(r => r.d), datasets: [{ label: 'Completed', data: c.daily_completed.map(r => r.c), borderColor: '#22d3c0', backgroundColor: 'rgba(34,211,192,.15)', fill: true, tension: .3 }] },
      options: baseOptions(),
    });
  }

  function renderExceptions(list) {
    const panel = document.getElementById('exceptionsPanel');
    if (!list.length) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    document.getElementById('exceptionsBody').innerHTML = list.map(e => `
      <tr>
        <td>${LC.escapeHtml(e.computer_name)}</td>
        <td class="mono">${LC.escapeHtml(e.serial_number)}</td>
        <td>${LC.escapeHtml(e.department_name)}</td>
        <td>${LC.escapeHtml(e.technician_name)}</td>
        <td style="max-width:220px;">${LC.escapeHtml(e.reason || '')}</td>
        <td>${LC.fmtDateTime(e.created_at)}</td>
        <td>
          <button class="btn btn-xs btn-ok" data-id="${e.device_id}" data-decision="approved">Approve</button>
          <button class="btn btn-xs btn-danger" data-id="${e.device_id}" data-decision="rejected">Reject</button>
        </td>
      </tr>
    `).join('');
    document.querySelectorAll('#exceptionsBody button').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await LC.post('api/decide_exception.php', { device_id: Number(btn.dataset.id), decision: btn.dataset.decision });
          LC.toast('Decision saved.');
          refresh();
        } catch (e) { LC.toast(e.message, 'error'); }
      });
    });
  }

  /**
   * The device lookup, with a full detail panel under each row.
   *
   * The table shows what fits in ten columns; the panel shows
   * everything else, built from the device's OWN type - a printer's
   * rows are its kind, address and consumable, a laptop's are its RAM,
   * storage and screen. LC.specPanelHtml() decides that from the
   * registry, so this function does not know or care which type it is
   * drawing.
   *
   * Collapsed by default: 300 expanded panels would bury the table the
   * manager came here to read.
   */
  function renderDevices(devices) {
    const body = document.getElementById('devicesBody');
    if (!devices.length) { body.innerHTML = '<tr><td colspan="11" class="empty-state">No devices found.</td></tr>'; return; }

    body.innerHTML = devices.map(d => `
      <tr class="dev-row" data-dev="${d.id}">
        <td>${LC.deviceTypeBadge(d.device_type)}</td>
        <td>
          <button type="button" class="dev-expand" data-toggle="${d.id}" aria-expanded="false"
                  title="Show every detail recorded for this device">
            <span class="dev-caret" aria-hidden="true">▸</span>${LC.escapeHtml(d.computer_name)}
          </button>
        </td>
        <td class="mono">${LC.escapeHtml(d.serial_number)}</td>
        <td>${LC.escapeHtml(d.model)}</td>
        <td>${d.project_name ? LC.escapeHtml(d.project_name) : '<span class="muted">—</span>'}</td>
        <!-- Both of these are optional now, so a dash rather than an
             empty cell: a blank reads as a rendering fault, a dash
             reads as "not set yet", which is what it is. -->
        <td>${d.department_name ? LC.escapeHtml(d.department_name) : '<span class="muted">—</span>'}</td>
        <td>${d.technician_name ? LC.escapeHtml(d.technician_name) : '<span class="muted">not started</span>'}</td>
        <td>${d.end_user_name ? LC.escapeHtml(d.end_user_name) : '<span class="muted">—</span>'}</td>
        <td><span class="badge ${LC.statusBadgeClass(d.status)}">${LC.escapeHtml(d.status)}</span></td>
        <td>${LC.fmtPercent(d.progress_percentage)}</td>
        <td>${LC.fmtDateTime(d.created_at)}</td>
      </tr>
      <tr class="dev-detail-row" id="devDetail${d.id}" hidden>
        <td colspan="11">
          <div class="dev-detail">
            ${LC.specPanelHtml(d)}
            <div class="dt-spec-panel" style="--dt-accent:#93a3bd;">
              <div class="dt-spec-title"><span>Workflow</span></div>
              <div class="dt-spec-grid">
                <div class="dt-spec-row"><span>Started</span><b>${LC.escapeHtml(LC.fmtDateTime(d.created_at))}</b></div>
                <div class="dt-spec-row"><span>Sent to audit</span><b>${LC.escapeHtml(LC.fmtDateTime(d.audit_submitted_at))}</b></div>
                <div class="dt-spec-row"><span>Completed</span><b>${LC.escapeHtml(LC.fmtDateTime(d.completed_at))}</b></div>
                <div class="dt-spec-row"><span>Meets dept. minimum</span><b>${Number(d.spec_meets_requirement) ? 'Yes' : 'No — approved by exception'}</b></div>
              </div>
            </div>
            <a class="btn-ghost btn-sm" href="auditor_device.html?id=${d.id}">Open the full checklist →</a>
          </div>
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = document.getElementById('devDetail' + btn.dataset.toggle);
        const open = row.hasAttribute('hidden');
        if (open) { row.removeAttribute('hidden'); } else { row.setAttribute('hidden', ''); }
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.querySelector('.dev-caret').textContent = open ? '▾' : '▸';
      });
    });
  }

  /**
   * Project progress.
   *
   * Two numbers per project, because they answer different questions:
   * the bar is the average of every device's own progress (so a batch
   * where everything is half built reads as 50%, not 0%), and the
   * counts underneath say how many are finished. Reporting only the
   * completed count would make a project that is nearly done look
   * untouched for days.
   */
  function renderProjects(projects) {
    const panel = document.getElementById('projectsPanel');
    const host  = document.getElementById('projectProgress');

    if (!projects.length) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';

    host.innerHTML = projects.map(p => {
      const pct   = Math.round(Number(p.percent_complete) || 0);
      const total = Number(p.devices) || 0;
      const done  = Number(p.completed) || 0;
      const busy  = Number(p.working) || 0;
      const free  = Number(p.available) || 0;
      return `
        <div class="proj-row${Number(p.is_active) ? '' : ' inactive'}">
          <div class="proj-head">
            <strong>${LC.escapeHtml(p.name)}</strong>
            ${Number(p.is_active) ? '' : '<span class="badge badge-muted">Inactive</span>'}
            <span class="proj-pct">${pct}%</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
          <div class="proj-counts">
            <span><b>${done}</b> completed</span>
            <span><b>${busy}</b> in progress</span>
            <span><b>${free}</b> not started</span>
            <span>${total} device${total === 1 ? '' : 's'} in total</span>
          </div>
        </div>`;
    }).join('');
  }

  async function refresh() {
    const params = new URLSearchParams({
      search: document.getElementById('f_search').value.trim(),
      status: document.getElementById('f_status').value,
      department_id: document.getElementById('f_department').value,
      device_type: document.getElementById('f_device_type').value,
      project_id: document.getElementById('f_project').value,
    });
    try {
      const data = await LC.get('api/manager_dashboard.php?' + params.toString());
      renderKpi(data.kpi);
      renderCharts(data.charts);
      renderExceptions(data.exceptions);
      renderProjects(data.projects || []);
      renderDevices(data.devices);
    } catch (e) { LC.toast(e.message, 'error'); }
  }

  async function init() {
    document.getElementById('applyFilters').addEventListener('click', refresh);
    document.getElementById('f_search').addEventListener('keydown', (e) => { if (e.key === 'Enter') refresh(); });
    try {
      const meta = await LC.get('api/meta.php');
      // Before the first render: the Type column and the type chart
      // both draw from this registry.
      LC.setDeviceTypes(meta.device_types, meta.category_order, meta.spec_labels);

      document.getElementById('f_department').innerHTML = '<option value="">All</option>' +
        meta.departments.map(d => `<option value="${d.id}">${LC.escapeHtml(d.name)}</option>`).join('');

      // allKnownDeviceTypes(), not allDeviceTypes(): the filter has to
      // be able to select the legacy 'Computer' rows as well, which is
      // the one thing a manager looking at a migrated database most
      // wants to narrow to. api/manager_dashboard.php accepts the same
      // wider set for exactly this reason.
      try {
        const pr = await LC.get('api/admin_projects.php');
        document.getElementById('f_project').innerHTML = '<option value="">All</option>'
          + (pr.projects || []).map(p => `<option value="${p.id}">${LC.escapeHtml(p.name)}</option>`).join('');
      } catch (e) { /* a manager without project data still gets the rest */ }

      document.getElementById('f_device_type').innerHTML = '<option value="">All</option>' +
        LC.allKnownDeviceTypes().map(t => `<option value="${LC.escapeHtml(t.key)}">`
          + LC.escapeHtml(t.plural) + (t.selectable === false ? ' (legacy)' : '')
          + `</option>`).join('');
    } catch (e) { /* ignore */ }
    refresh();
  }

  init();
})();
