(function () {
  async function refresh() {
    try {
      // The registry has to be in place before any row renders, since
      // each one draws its device-type icon from it.
      const meta = await LC.get('api/meta.php');
      LC.setDeviceTypes(meta.device_types, meta.category_order, meta.spec_labels);

      const data = await LC.get('api/auditor_devices.php');
      const kpi = data.kpi;
      document.getElementById('auditorKpiGrid').innerHTML = `
        <div class="kpi-card warn"><div class="kpi-label">Awaiting Audit</div><div class="kpi-value">${kpi.pending}</div></div>
        <div class="kpi-card ok"><div class="kpi-label">Completed</div><div class="kpi-value">${kpi.completed}</div></div>
        <div class="kpi-card danger"><div class="kpi-label">Rejected</div><div class="kpi-value">${kpi.rejected}</div></div>
      `;

      const body = document.getElementById('auditorBody');
      if (!data.devices.length) {
        body.innerHTML = '<tr><td colspan="9" class="empty-state">No devices yet.</td></tr>';
        return;
      }
      body.innerHTML = data.devices.map(d => `
        <tr>
          <td>${LC.deviceTypeBadge(d.device_type)}</td>
          <td>${LC.escapeHtml(d.computer_name)}</td>
          <td class="mono">${LC.escapeHtml(d.serial_number)}</td>
          <td>${LC.escapeHtml(d.model)}</td>
          <td>${LC.escapeHtml(d.department_name)}</td>
          <td>${LC.escapeHtml(d.technician_name)}</td>
          <td><span class="badge ${LC.statusBadgeClass(d.status)}">${LC.escapeHtml(d.status)}</span></td>
          <td>${LC.fmtPercent(d.progress_percentage)}</td>
          <td><a class="btn-ghost btn-sm" href="auditor_device.html?id=${d.id}">${d.status === 'Pending Audit' ? 'Review' : 'View'}</a></td>
        </tr>
      `).join('');
    } catch (e) { LC.toast(e.message, 'error'); }
  }
  refresh();
})();
