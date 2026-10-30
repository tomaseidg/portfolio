(function () {
  const deviceId = Number(document.querySelector('meta[name="device-id"]').content);
  let presets = { ok: [], issue: [] };
  let device = null;

  function statusNote(status) {
    return {
      'In Progress': 'Work through every step below.',
      'Pending Manager Approval': 'Blocked — this device is below the department\u2019s minimum spec and needs manager sign-off.',
      'Pending Audit': 'Submitted. Waiting on the auditor to review your work.',
      'Rejected By Audit': 'The auditor sent this back — fix the flagged steps and resubmit.',
      'Completed': 'This device has been fully configured and approved.',
    }[status] || '';
  }

  function renderHeader() {
    const el = document.getElementById('deviceHeader');
    const dt = LC.deviceType(device.device_type);
    const accent = dt ? dt.accent : 'var(--accent)';
    el.innerHTML = `
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
      <div class="device-card-meta" style="margin-bottom:10px;">
        <span>Department: <strong>${LC.escapeHtml(device.department_name)}</strong></span>
        <span>End User: <strong>${LC.escapeHtml(device.end_user_name)}</strong></span>
        <span>Started: ${LC.fmtDateTime(device.created_at)}</span>
      </div>
      ${specPanel(device)}
      <div class="progress-track" style="margin-top:12px;"><div class="progress-fill ${device.status === 'Rejected By Audit' ? 'danger' : ''}" style="width:${device.progress_percentage}%;"></div></div>
      <div class="progress-label">${LC.fmtPercent(device.progress_percentage)} complete — ${statusNote(device.status)}</div>
    `;
  }

  function renderException() {
    const box = document.getElementById('exceptionBox');
    if (device.status !== 'Pending Manager Approval') { box.innerHTML = ''; return; }
    const ex = device.exception;
    const rejected = ex && ex.status === 'rejected';
    box.innerHTML = `
      <div class="panel spec-check-box spec-fail" style="margin-bottom:16px;">
        <strong>Spec exception ${rejected ? 'rejected' : 'pending manager review'}</strong>
        <div class="spec-grid" style="margin-top:10px;">
          <div><span>RAM</span>${device.spec_ram_gb} GB <span style="color:var(--text-muted);">(needs ${device.min_ram_gb}+)</span></div>
          <div><span>Screen</span>${device.spec_screen_inch}" <span style="color:var(--text-muted);">(needs ${device.min_screen_inch}+)</span></div>
          <div><span>Fingerprint</span>${device.has_fingerprint ? 'Yes' : 'No'} ${device.requires_fingerprint ? '(required)' : ''}</div>
          <div><span>Touch</span>${device.has_touch ? 'Yes' : 'No'} ${device.requires_touch ? '(required)' : ''}</div>
        </div>
        ${rejected ? `<button class="btn btn-sm" id="resubmitExceptionBtn" style="margin-top:12px;">Resubmit for Manager Review</button>` : '<p style="margin:10px 0 0; color:var(--text-muted); font-size:12.5px;">A manager or admin needs to approve this before you can continue the checklist.</p>'}
      </div>
    `;
    const btn = document.getElementById('resubmitExceptionBtn');
    if (btn) btn.addEventListener('click', async () => {
      try {
        await LC.post('api/request_exception.php', { device_id: deviceId, reason: 'Technician requests re-review.' });
        LC.toast('Resubmitted for manager review.');
        load();
      } catch (e) { LC.toast(e.message, 'error'); }
    });
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

  /**
   * The input on a step that records a value.
   *
   * Built from the step's OWN definition - input_kind, input_label,
   * input_options - which is the same definition api/update_step.php
   * validates against. The two cannot disagree, because there is only
   * one of them.
   *
   * This is where the detailed specification is captured now: how much
   * RAM is actually fitted, whether the disk is 2.5" or M.2, whether
   * the laptop has a fingerprint reader or Face ID. It used to be asked
   * for on the New Device form, before anyone had opened the machine.
   */
  function stepInputRow(s) {
    if (!s.input_kind) return '';

    const label = LC.escapeHtml(s.input_label || 'Value');
    const unit  = s.input_unit ? `<span class="sr-unit">${LC.escapeHtml(s.input_unit)}</span>` : '';
    const req   = Number(s.input_required) ? '<span class="sr-req">required</span>' : '';

    /* What the box starts with, in order of how much it is worth:
         1. what this technician already recorded on this step;
         2. what the device record already holds for the column this
            step fills - which, for an imported batch, is the figure
            the stock sheet declared.

       The second is the point of this: a delivery of 56 identical
       desktops already says "16GB" and "512GB SSD" in the sheet, and
       making somebody type that 56 times would be work the import was
       supposed to remove. They confirm instead - and if the machine
       actually has 8 GB, they change it, and that disagreement is
       exactly what the inspection is for. */
    const fromDevice = s.fills_field ? device[s.fills_field] : null;
    const declared = (fromDevice === null || fromDevice === undefined || fromDevice === ''
                      || Number(fromDevice) === 0 && s.input_kind === 'number')
      ? '' : String(fromDevice);

    const have = s.result_value != null && s.result_value !== ''
      ? String(s.result_value)
      : declared;

    // Where it came from, said plainly - a figure that appears in a box
    // with no explanation is a figure somebody will tick past.
    const source = (s.result_value == null || s.result_value === '') && declared !== ''
      ? `<div class="sr-source">${device.declared_spec
            ? 'From the stock sheet (' + LC.escapeHtml(device.declared_spec) + ') — confirm or correct it'
            : 'Already on the device record — confirm or correct it'}</div>`
      : '';

    let field;

    switch (s.input_kind) {
      case 'number':
        field = `<input type="number" step="any" min="0" class="sc-result" value="${LC.escapeHtml(have)}" placeholder="0">`;
        break;
      case 'choice': {
        const opts = String(s.input_options || '').split('|').map(o => o.trim()).filter(Boolean);
        field = `<select class="sc-result"><option value="">Choose…</option>`
              + opts.map(o => `<option value="${LC.escapeHtml(o)}"${o === have ? ' selected' : ''}>${LC.escapeHtml(o)}</option>`).join('')
              + `</select>`;
        break;
      }
      case 'yesno': {
        // A value pre-filled from the device record comes out of a bit
        // column as "1" or "0", not as "Yes" or "No".
        const yes = have === 'Yes' || have === '1' || have === 'true';
        const no  = have === 'No'  || have === '0' || have === 'false';
        field = `<select class="sc-result"><option value="">Choose…</option>`
              + `<option value="Yes"${yes ? ' selected' : ''}>Yes</option>`
              + `<option value="No"${no ? ' selected' : ''}>No</option></select>`;
        break;
      }
      default:
        field = `<input type="text" class="sc-result" maxlength="200" value="${LC.escapeHtml(have)}" placeholder="Type what you found">`;
    }

    return `<div class="step-input-row">
              <label class="sr-label">${label}${req}</label>
              <div class="sr-field">${field}${unit}</div>
            </div>${source}`;
  }

  function renderSteps() {
    const grouped = {};
    device.steps.forEach(s => { (grouped[s.category] = grouped[s.category] || []).push(s); });
    const dt = LC.deviceType(device.device_type);
    const accent = dt ? dt.accent : 'var(--accent)';

    const locked = device.status === 'Pending Manager Approval' || device.status === 'Completed';

    let html = '';
    LC.orderedCategories(Object.keys(grouped)).forEach(cat => {
      if (!grouped[cat]) return;
      html += `<div class="step-cat-title dt-tinted" style="--dt-accent:${accent};">${LC.escapeHtml(cat)}</div>`;
      grouped[cat].forEach(s => {
        const commentText = s.custom_comment || s.preset_text || '';
        const recorded = (s.result_value !== null && s.result_value !== undefined && s.result_value !== '')
          ? `<div class="step-recorded"><span>${LC.escapeHtml(s.input_label || 'Recorded')}</span>`
            + `<b>${LC.escapeHtml(s.result_value)}${s.input_unit ? ' ' + LC.escapeHtml(s.input_unit) : ''}</b></div>`
          : '';
        html += `
          <div class="step-card status-${s.status}" data-id="${s.id}">
            <div class="step-card-top" onclick="this.parentElement.classList.toggle('open')" style="cursor:${locked ? 'default' : 'pointer'};">
              <div class="step-card-name">
                ${LC.escapeHtml(s.step_name)}
                ${s.input_kind ? `<span class="step-asks" title="This step records a value">records ${LC.escapeHtml(s.input_label || 'a value')}</span>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="step-sla">SLA ${s.sla_minutes}m</span>
                <span class="badge ${LC.statusBadgeClass(s.status)}">${s.status}</span>
              </div>
            </div>
            ${recorded}
            ${commentText ? `<div class="step-note">💬 ${LC.escapeHtml(commentText)}</div>` : ''}
            ${!locked ? `
            <div class="step-card-body">
              ${stepInputRow(s)}
              <div class="step-comment-row">
                <select class="sc-outcome">
                  <option value="done">Mark: OK / Done</option>
                  <option value="issue">Mark: Issue Found</option>
                </select>
                <select class="sc-preset">${presetOptions('ok')}<option value="__custom">Custom text…</option></select>
              </div>
              <div class="step-comment-row sc-custom-row" style="display:none;">
                <input type="text" class="sc-custom" placeholder="Write a custom comment…" maxlength="400">
              </div>
              <div class="step-card-actions">
                <button type="button" class="btn btn-xs sc-save">Save Step</button>
              </div>
            </div>` : ''}
          </div>
        `;
      });
    });
    document.getElementById('stepList').innerHTML = html || '<div class="empty-state">No steps configured for this device.</div>';

    if (!locked) wireStepCards();
  }

  function wireStepCards() {
    document.querySelectorAll('.step-card').forEach(card => {
      const outcomeSel = card.querySelector('.sc-outcome');
      const presetSel  = card.querySelector('.sc-preset');
      const customRow  = card.querySelector('.sc-custom-row');
      const customInput = card.querySelector('.sc-custom');

      const syncPresets = () => {
        const outcome = outcomeSel.value;
        presetSel.innerHTML = presetOptions(outcome) + '<option value="__custom">Custom text…</option>';
      };
      outcomeSel.addEventListener('change', syncPresets);
      presetSel.addEventListener('change', () => {
        customRow.style.display = presetSel.value === '__custom' ? 'flex' : 'none';
      });

      card.querySelector('.sc-save').addEventListener('click', async (e) => {
        e.stopPropagation();
        const outcome = outcomeSel.value;
        const presetVal = presetSel.value;
        const resultEl = card.querySelector('.sc-result');
        const payload = {
          device_id: deviceId,
          device_step_id: Number(card.dataset.id),
          outcome,
          comment_preset_id: presetVal === '__custom' ? null : Number(presetVal),
          custom_comment: presetVal === '__custom' ? customInput.value.trim() : '',
        };
        // Only sent when the step actually asks for something. The
        // server ignores it otherwise, but not sending it at all keeps
        // the request honest about what this step is.
        if (resultEl) { payload.result_value = resultEl.value.trim(); }
        try {
          const res = await LC.post('api/update_step.php', payload);
          device = res.device;
          LC.toast('Step saved.');
          renderAll();
        } catch (err) { LC.toast(err.message, 'error'); }
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

  function renderAll() {
    renderHeader();
    renderException();
    renderSteps();
    renderActivity();
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
      renderAll();
    } catch (e) {
      document.getElementById('deviceHeader').innerHTML = `<div class="empty-state">${LC.escapeHtml(e.message)}</div>`;
    }
  }

  load();
})();
