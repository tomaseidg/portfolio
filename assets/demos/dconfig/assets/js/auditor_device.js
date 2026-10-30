(function () {
  const deviceId = Number(document.querySelector('meta[name="device-id"]').content);
  let presets = { ok: [], issue: [] };
  let device = null;

  function renderHeader() {
    const dt = LC.deviceType(device.device_type);
    const accent = dt ? dt.accent : 'var(--accent)';
    document.getElementById('deviceHeader').innerHTML = `
      <div class="device-card-head" style="margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
          <!-- The device type, large and colour-coded, so it is the
               first thing read on the page. -->
          <span class="dt-hero" style="--dt-accent:${accent};">${LC.deviceTypeIcon(device.device_type, 24)}</span>
          <div style="min-width:0;">
            <strong style="font-size:16px;">${LC.escapeHtml(device.computer_name)}</strong>
            <div class="mono-sm">SN: ${LC.escapeHtml(device.serial_number)} · ${LC.escapeHtml(device.model)}</div>
          </div>
        </div>
        <span style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
          ${LC.deviceTypeBadge(device.device_type)}
          <span class="badge ${LC.statusBadgeClass(device.status)}">${LC.escapeHtml(device.status)}</span>
        </span>
      </div>
      <div class="device-card-meta">
        <span>Department: <strong>${LC.escapeHtml(device.department_name)}</strong></span>
        <span>End User: <strong>${LC.escapeHtml(device.end_user_name)}</strong></span>
        <span>Technician: <strong>${LC.escapeHtml(device.technician_name)}</strong></span>
        <span>Started: ${LC.fmtDateTime(device.created_at)}</span>
      </div>
      ${specPanel(device)}
    `;
  }

  // The category order comes from api/meta.php (built from
  // includes/device_types.php), NOT from a list in this file. The
  // hard-coded array that used to live here held the four computer
  // categories only, so a monitor or printer step would have been
  // grouped under a category this loop never visited and rendered
  // nowhere at all - silently absent from the page, with nothing in
  // any log to say so. LC.orderedCategories() also appends anything
  // it does not recognise rather than dropping it.

  function presetOptions(outcome) {
    return presets[outcome].map(p => `<option value="${p.id}">${LC.escapeHtml(p.preset_text)}</option>`).join('');
  }

  /* -----------------------------------------------------------------
     The device's own spec panel.

     Which rows appear comes from the registry's spec_fields for this
     device's type, so a monitor shows panel size, resolution, panel
     type and connection - and a printer shows its kind, colour,
     duplex, IP and consumable - instead of a row of blank RAM and CPU
     cells. The whole point of the feature is being able to see all of
     a device's detail at a glance, whatever it is.
     ----------------------------------------------------------------- */
  function specPanel(dev) {
    // One implementation, in assets/js/app.js, shared with the manager
    // lookup and the technician cards. It had been duplicated here and
    // in auditor_device.js with its own label and unit formatting - two
    // copies and two chances for "16" to appear without its "GB", or
    // for a new spec column to be added to one page and forgotten on
    // the other.
    return LC.specPanelHtml(dev, { title: '' });
  }

  function renderSteps() {
    const reviewable = device.status === 'Pending Audit';
    const grouped = {};
    device.steps.forEach(s => { (grouped[s.category] = grouped[s.category] || []).push(s); });
    const dt = LC.deviceType(device.device_type);
    const accent = dt ? dt.accent : 'var(--accent)';

    let html = '';
    LC.orderedCategories(Object.keys(grouped)).forEach(cat => {
      if (!grouped[cat]) return;
      html += `<div class="step-cat-title dt-tinted" style="--dt-accent:${accent};">${LC.escapeHtml(cat)}</div>`;
      grouped[cat].forEach(s => {
        const techComment = s.custom_comment || s.preset_text || '';
        const auditComment = s.audit_custom_comment || '';
        html += `
          <div class="step-card status-${s.status}" data-id="${s.id}">
            <div class="step-card-top" onclick="this.parentElement.classList.toggle('open')" style="cursor:pointer;">
              <div class="step-card-name">${LC.escapeHtml(s.step_name)}</div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="badge ${LC.statusBadgeClass(s.status)}">technician: ${s.status}</span>
                ${s.audit_status !== 'pending' ? `<span class="badge ${s.audit_status === 'approved' ? 'badge-ok' : 'badge-danger'}">audit: ${s.audit_status}</span>` : ''}
              </div>
            </div>
            ${(s.result_value !== null && s.result_value !== undefined && s.result_value !== '')
              ? `<div class="step-recorded"><span>${LC.escapeHtml(s.input_label || 'Recorded')}</span>`
                + `<b>${LC.escapeHtml(s.result_value)}${s.input_unit ? ' ' + LC.escapeHtml(s.input_unit) : ''}</b></div>`
              : (s.input_kind
                  ? '<div class="step-recorded missing"><span>' + LC.escapeHtml(s.input_label || 'Value')
                    + '</span><b>not recorded</b></div>'
                  : '')}
            ${techComment ? `<div class="step-note">Technician: 💬 ${LC.escapeHtml(techComment)} — ${LC.escapeHtml(s.completed_by_name || '')}</div>` : '<div class="step-note">Not yet completed by technician.</div>'}
            ${auditComment ? `<div class="step-note">Auditor: 💬 ${LC.escapeHtml(auditComment)}</div>` : ''}
            ${reviewable ? `
            <div class="step-card-body">
              <div class="step-comment-row">
                <select class="ac-outcome">
                  <option value="approved">Approve step</option>
                  <option value="rejected">Reject step</option>
                </select>
                <select class="ac-preset">${presetOptions('ok')}<option value="__custom">Custom text…</option></select>
              </div>
              <div class="step-comment-row ac-custom-row" style="display:none;">
                <input type="text" class="ac-custom" placeholder="Write a custom comment…" maxlength="400">
              </div>
            </div>` : ''}
          </div>
        `;
      });
    });
    document.getElementById('stepList').innerHTML = html || '<div class="empty-state">No steps.</div>';
    document.getElementById('submitRow').style.display = reviewable ? 'block' : 'none';

    if (reviewable) wireCards();
  }

  function wireCards() {
    document.querySelectorAll('.step-card').forEach(card => {
      const outcomeSel = card.querySelector('.ac-outcome');
      const presetSel  = card.querySelector('.ac-preset');
      const customRow  = card.querySelector('.ac-custom-row');
      if (!outcomeSel) return;
      const sync = () => {
        const outcome = outcomeSel.value === 'approved' ? 'ok' : 'issue';
        presetSel.innerHTML = presetOptions(outcome) + '<option value="__custom">Custom text…</option>';
      };
      outcomeSel.addEventListener('change', sync);
      presetSel.addEventListener('change', () => {
        customRow.style.display = presetSel.value === '__custom' ? 'flex' : 'none';
      });
    });
  }

  function renderActivity() {
    const el = document.getElementById('activityTimeline');
    if (!device.activity.length) { el.innerHTML = '<div class="empty-state">No activity yet.</div>'; return; }
    el.innerHTML = device.activity.map(a => `
      <div class="timeline-item">
        <span class="t-dot"></span>
        <div class="t-body">
          <strong>${LC.escapeHtml(a.actor_name || 'System')}</strong> — ${LC.escapeHtml(a.action.replace(/_/g, ' '))}
          ${a.details ? `<div>${LC.escapeHtml(a.details)}</div>` : ''}
          <div class="t-time">${LC.fmtDateTime(a.created_at)}</div>
        </div>
      </div>
    `).join('');
  }

  async function submitAudit() {
    const decisions = [];
    document.querySelectorAll('#stepList .step-card').forEach(card => {
      const outcomeSel = card.querySelector('.ac-outcome');
      if (!outcomeSel) return;
      const presetSel = card.querySelector('.ac-preset');
      const customInput = card.querySelector('.ac-custom');
      decisions.push({
        device_step_id: Number(card.dataset.id),
        outcome: outcomeSel.value,
        comment_preset_id: presetSel.value === '__custom' ? null : Number(presetSel.value),
        custom_comment: presetSel.value === '__custom' ? customInput.value.trim() : '',
      });
    });
    try {
      const res = await LC.post('api/submit_audit.php', { device_id: deviceId, decisions });
      LC.toast(res.rejected ? 'Sent back to technician.' : 'Device approved and completed.');
      load();
    } catch (e) { LC.toast(e.message, 'error'); }
  }

  async function load() {
    try {
      const meta = await LC.get('api/meta.php');
      // Before any render: every icon, badge and category group below
      // is built from this registry.
      LC.setDeviceTypes(meta.device_types, meta.category_order, meta.spec_labels);
      presets = { ok: meta.presets.filter(p => p.outcome === 'ok'), issue: meta.presets.filter(p => p.outcome === 'issue') };
      const res = await LC.get(`api/device_detail.php?id=${deviceId}`);
      device = res.device;
      renderHeader();
      renderSteps();
      renderActivity();
      const btn = document.getElementById('submitAuditBtn');
      if (btn) btn.onclick = submitAudit;
    } catch (e) {
      document.getElementById('deviceHeader').innerHTML = `<div class="empty-state">${LC.escapeHtml(e.message)}</div>`;
    }
  }

  load();
})();
