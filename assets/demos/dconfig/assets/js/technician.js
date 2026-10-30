(function () {
  let departments = [];
  // Set from the registry in init() - the first SELECTABLE type -
  // rather than hard-coded, so the picker can never open on a type the
  // server would reject.
  let selectedType = '';
  let specOptions = {};

  async function loadKpi(devices) {
    const kpi = devices.kpi;
    const grid = document.getElementById('techKpiGrid');

    // One card per device type, so a technician sees the shape of
    // their queue - 8 computers, 3 monitors, 1 printer - and not just
    // a single "12 devices".
    const byType = (kpi.by_type || {});
    const typeCards = LC.allDeviceTypes().map(t => `
      <div class="kpi-card" style="--dt-accent:${t.accent};">
        <div class="kpi-label" style="display:flex; align-items:center; gap:6px;">
          ${LC.deviceTypeIcon(t.key, 14)} ${LC.escapeHtml(t.plural)}
        </div>
        <div class="kpi-value">${Number(byType[t.key] || 0)}</div>
      </div>
    `).join('');

    grid.innerHTML = `
      <div class="kpi-card"><div class="kpi-label">Total Devices</div><div class="kpi-value">${kpi.total}</div></div>
      ${typeCards}
      <div class="kpi-card warn"><div class="kpi-label">Active</div><div class="kpi-value">${kpi.active}</div></div>
      <div class="kpi-card ok"><div class="kpi-label">Completed</div><div class="kpi-value">${kpi.completed}</div></div>
      <div class="kpi-card danger"><div class="kpi-label">Rejected by Audit</div><div class="kpi-value">${kpi.rejected}</div></div>
    `;
  }

  function renderDevices(devices) {
    const grid = document.getElementById('deviceGrid');
    if (!devices.length) {
      grid.innerHTML = '<div class="empty-state">No devices yet. Click "Start New Device" to begin.</div>';
      return;
    }
    grid.innerHTML = devices.map(d => `
      <a class="device-card" href="technician_device.html?id=${d.id}" style="text-decoration:none; color:inherit;">
        <div class="device-card-head">
          <span style="display:flex; align-items:center; gap:8px; min-width:0;">
            ${LC.deviceTypeIcon(d.device_type, 18)}
            <strong style="overflow:hidden; text-overflow:ellipsis;">${LC.escapeHtml(d.computer_name)}</strong>
          </span>
          <span class="badge ${LC.statusBadgeClass(d.status)}">${LC.escapeHtml(d.status)}</span>
        </div>
        <div class="mono-sm">SN: ${LC.escapeHtml(d.serial_number)} · ${LC.escapeHtml(d.model)}</div>
        <div class="device-card-meta">
          ${LC.deviceTypeBadge(d.device_type)}
          <span>${LC.escapeHtml(d.department_name)}</span>
          <span>User: ${LC.escapeHtml(d.end_user_name)}</span>
        </div>
        ${LC.specChipsHtml(d)}
        <div>
          <div class="progress-track"><div class="progress-fill ${d.status === 'Rejected By Audit' ? 'danger' : ''}" style="width:${d.progress_percentage}%;"></div></div>
          <div class="progress-label">${LC.fmtPercent(d.progress_percentage)} complete · started ${LC.fmtDateTime(d.created_at)}</div>
        </div>
      </a>
    `).join('');
  }

  async function refresh() {
    try {
      const data = await LC.get('api/technician_devices.php');
      loadKpi(data);
      renderDevices(data.devices);
    } catch (e) {
      LC.toast(e.message, 'error');
    }
  }

  /**
   * The department minimum panel.
   *
   * It shows only the minimums this device type is actually measured
   * against, from the registry's gate_checks. That is not cosmetic: a
   * desktop has no built-in screen, so telling a technician it must be
   * 14 inches or more would be telling them something untrue about what
   * the form is going to do. The ones that do not apply are shown
   * struck through rather than hidden, so it is clear they exist and
   * are being skipped on purpose.
   *
   * Office licence is always shown - it is a department fact, not a
   * measurement of the device.
   */
  function updateSpecHint() {
    const hint = document.getElementById('nd_spec_hint');
    const t = LC.deviceType(selectedType);
    const checks = (t && Array.isArray(t.gate_checks)) ? t.gate_checks : [];

    if (t && !checks.length) {
      hint.innerHTML = `
        <strong style="display:flex; align-items:center; gap:7px;">
          ${LC.deviceTypeIcon(selectedType, 16)} ${LC.escapeHtml(t.label)} inspection
        </strong>
        <p style="margin:8px 0 0; color:var(--text-muted);">
          The department minimum spec describes the machine a person works on, so a
          ${LC.escapeHtml(t.label.toLowerCase())} goes straight into its checklist with no manager
          approval step. ${LC.escapeHtml(t.blurb)}.
        </p>`;
      return;
    }

    const deptId = Number(document.getElementById('nd_department').value);
    const dept = departments.find(d => d.id === deptId);
    if (!dept) { hint.innerHTML = ''; return; }

    const cell = (check, label, value) => checks.includes(check)
      ? `<div><span>${label}</span>${value}</div>`
      : `<div class="spec-na" title="Not measured on a ${LC.escapeHtml(t ? t.label : 'device')}"><span>${label}</span><s>${value}</s></div>`;

    const skipped = ['ram', 'screen', 'fingerprint', 'touch'].filter(c => !checks.includes(c)).length;

    hint.innerHTML = `
      <strong style="display:flex; align-items:center; gap:7px;">
        ${LC.deviceTypeIcon(selectedType, 16)} ${LC.escapeHtml(dept.name)} minimum requirement
      </strong>
      <div class="spec-grid">
        ${cell('ram', 'RAM', `${dept.min_ram_gb} GB+`)}
        <div><span>CPU</span>${LC.escapeHtml(dept.min_cpu)}</div>
        ${cell('screen', 'Screen', `${dept.min_screen_inch}"+`)}
        ${cell('fingerprint', 'Fingerprint', dept.requires_fingerprint ? 'Required' : '—')}
        ${cell('touch', 'Touch', dept.requires_touch ? 'Required' : '—')}
        <div><span>Office</span>${LC.escapeHtml(dept.office_license)}</div>
      </div>
      <p style="margin:8px 0 0; color:var(--text-muted);">
        If the device falls short, it will be sent for manager approval before you can continue the
        checklist.${skipped ? ` The struck-through rows are not measured on a ${LC.escapeHtml(t.label.toLowerCase())}.` : ''}
      </p>
    `;
  }

  /**
   * The type picker at the top of the New Device dialog.
   *
   * Built from LC.allDeviceTypes(), which is the SELECTABLE types only.
   * A sixth type added to includes/device_types.php appears here with
   * no change to this file; the legacy 'Computer' value never does.
   */
  function renderTypePicker() {
    const host = document.getElementById('nd_type_picker');
    host.innerHTML = LC.allDeviceTypes().map(t => `
      <label class="dt-option ${t.key === selectedType ? 'selected' : ''}" style="--dt-accent:${t.accent};">
        <input type="radio" name="nd_device_type" value="${LC.escapeHtml(t.key)}" ${t.key === selectedType ? 'checked' : ''}>
        ${LC.deviceTypeIcon(t.key, 26)}
        <span class="dt-name">${LC.escapeHtml(t.label)}</span>
        <span class="dt-blurb">${LC.escapeHtml(t.blurb)}</span>
      </label>
    `).join('');

    host.querySelectorAll('input[name="nd_device_type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        selectedType = radio.value;
        renderTypePicker();
        renderSpecFields();
        updateNameLabel();
        updateSpecHint();
      });
    });
  }

  /** The name field is called something different for each type. */
  function updateNameLabel() {
    document.getElementById('nd_name_label').textContent = LC.deviceNameLabel(selectedType);
    const t = LC.deviceType(selectedType);
    document.getElementById('nd_comp_name').placeholder = t ? t.name_hint : '';
  }

  function optionList(field, current) {
    const opts = specOptions[field] || [];
    return ['<option value="">Select…</option>']
      .concat(opts.map(o => `<option value="${LC.escapeHtml(o)}"${o === current ? ' selected' : ''}>${LC.escapeHtml(o)}</option>`))
      .join('');
  }

  /**
   * Builds only the spec inputs this type actually uses, from the
   * registry's spec_fields list. The server blanks anything that is
   * not on that list, so the form and the stored row agree.
   */
  function renderSpecFields() {
    const host = document.getElementById('nd_spec_fields');
    const t = LC.deviceType(selectedType);
    const fields = t ? t.spec_fields : [];

    // The RAM and screen inputs are `required` only for the types that
    // are MEASURED on them. A desktop has no built-in screen, so
    // demanding a screen size for one would block the form over a
    // figure the spec gate does not even look at - see
    // specGateChecksForDeviceType() in includes/device_types.php.
    const gate = (check) => {
      const def = LC.deviceType(selectedType);
      return !!(def && Array.isArray(def.gate_checks) && def.gate_checks.includes(check));
    };

    // One builder per spec column. A field the chosen type does not
    // declare is never built, so it is not in the DOM and not in the
    // request - the same rule the server applies with
    // specFieldsForDeviceType(). Both sides read the same list, which
    // is why they cannot disagree.
    const widget = {
      spec_ram_gb:       () => `<div style="flex:1;"><label>RAM (GB)</label><input type="number" id="nd_ram" min="1" max="4096"${gate('ram') ? ' required' : ''}></div>`,
      spec_cpu:          () => `<div class="login-field"><label>Processor (CPU)</label><input type="text" id="nd_cpu" placeholder="e.g. Core i7 12th Gen" maxlength="60"></div>`,
      storage_type:      () => `<div style="flex:1;"><label>Storage Type</label><select id="nd_storage_type">${optionList('storage_type')}</select></div>`,
      storage_gb:        () => `<div style="flex:1;"><label>Storage (GB)</label><input type="number" id="nd_storage_gb" min="1" max="1048576" placeholder="e.g. 512"></div>`,
      gpu_model:         () => `<div class="login-field"><label>Graphics (GPU)</label><input type="text" id="nd_gpu" placeholder="e.g. Intel Iris Xe / RTX A2000" maxlength="60"></div>`,
      spec_screen_inch:  () => `<div style="flex:1;"><label>${selectedType === 'Monitor' ? 'Panel Size (inch)' : 'Screen Size (inch)'}</label><input type="number" step="0.1" id="nd_screen" min="1" max="200"${gate('screen') ? ' required' : ''}></div>`,
      screen_resolution: () => `<div style="flex:1;"><label>Resolution</label><input type="text" id="nd_resolution" placeholder="e.g. 1920x1080" maxlength="40"></div>`,
      panel_type:        () => `<div style="flex:1;"><label>Panel Type</label><select id="nd_panel">${optionList('panel_type')}</select></div>`,
      has_fingerprint:   () => `<div class="login-field checkbox-field"><label><input type="checkbox" id="nd_fingerprint"> Has fingerprint reader</label></div>`,
      has_touch:         () => `<div class="login-field checkbox-field"><label><input type="checkbox" id="nd_touch"> Has touch screen</label></div>`,
      form_factor:       () => `<div style="flex:1;"><label>Form Factor</label><select id="nd_form_factor">${optionList('form_factor')}</select></div>`,
      os_version:        () => `<div style="flex:1;"><label>Operating System</label><input type="text" id="nd_os" placeholder="e.g. Windows 11 Pro 23H2" maxlength="60"></div>`,
      connection_type:   () => `<div style="flex:1;"><label>Connection</label><select id="nd_connection">${optionList('connection_type')}</select></div>`,
      ip_address:        () => `<div style="flex:1;"><label>IP Address</label><input type="text" id="nd_ip" placeholder="e.g. 10.20.1.45" maxlength="45"></div>`,
      mac_address:       () => `<div style="flex:1;"><label>MAC Address</label><input type="text" id="nd_mac" placeholder="e.g. 00:1A:2B:3C:4D:5E" maxlength="20"></div>`,
      printer_kind:      () => `<div style="flex:1;"><label>Printer Type</label><select id="nd_printer_kind">${optionList('printer_kind')}</select></div>`,
      is_color:          () => `<div class="login-field checkbox-field"><label><input type="checkbox" id="nd_is_color"> Prints in colour</label></div>`,
      supports_duplex:   () => `<div class="login-field checkbox-field"><label><input type="checkbox" id="nd_duplex"> Supports duplex (double-sided)</label></div>`,
      consumable_model:  () => `<div style="flex:1;"><label>Toner / Cartridge Model</label><input type="text" id="nd_consumable" placeholder="e.g. CF259X" maxlength="80"></div>`,
    };

    // Narrow inputs are paired two per row; checkboxes and the CPU box
    // take a full row of their own.
    const paired = [];
    let html = '';
    const flush = () => {
      if (!paired.length) return;
      html += `<div class="login-field" style="display:flex; gap:12px;">${paired.join('')}</div>`;
      paired.length = 0;
    };

    fields.forEach(f => {
      const build = widget[f];
      if (!build) return;
      const markup = build();
      if (markup.startsWith('<div style="flex:1;"')) {
        paired.push(markup);
        if (paired.length === 2) flush();
      } else {
        flush();
        html += markup;
      }
    });
    flush();

    host.innerHTML = html;
  }

  /* =================================================================
     Picking a device out of a project
     -----------------------------------------------------------------
     The pool is on the server, not in the browser, and every keystroke
     asks it again. That is deliberate: a list cached when the dialog
     opened would still be offering a device another technician claimed
     thirty seconds ago, and the technician would only find out when
     the claim was refused. Asking the server keeps the list honest.
     ================================================================= */
  let projects      = [];
  let chosenDevice  = null;
  let searchTimer   = null;
  let searchSeq     = 0;

  function currentProjectId() {
    return Number(document.getElementById('nd_project').value) || 0;
  }

  function setSource(source) {
    const isProject = source === 'project';
    document.getElementById('nd_project_pane').style.display = isProject ? 'block' : 'none';
    document.getElementById('newDeviceForm').style.display   = isProject ? 'none'  : 'block';
    document.querySelectorAll('#nd_source_picker .src-option').forEach(el => {
      el.classList.toggle('selected', el.dataset.source === source);
    });
    document.getElementById('newDeviceError').style.display = 'none';
    if (isProject) { refreshProjectDevices(); }
  }

  function renderProjectOptions() {
    const sel = document.getElementById('nd_project');
    if (!projects.length) {
      sel.innerHTML = '<option value="">No active projects</option>';
      document.getElementById('nd_project_summary').textContent =
        'No project is active. Ask an administrator to import a delivery, or start the device on its own.';
      return;
    }
    sel.innerHTML = projects.map(p =>
      `<option value="${p.id}">${LC.escapeHtml(p.name)} — ${Number(p.available)} left</option>`).join('');
    updateProjectSummary();
  }

  function updateProjectSummary() {
    const p = projects.find(x => Number(x.id) === currentProjectId());
    const box = document.getElementById('nd_project_summary');
    if (!p) { box.textContent = ''; return; }
    const pct = Math.round(Number(p.percent_complete) || 0);
    box.innerHTML =
      `<span class="mini-bar"><span style="width:${pct}%"></span></span>`
      + `${Number(p.available)} of ${Number(p.devices)} still to start · ${pct}% of the project complete`
      + (p.description ? ` · ${LC.escapeHtml(p.description)}` : '');
  }

  function chooseDevice(d) {
    chosenDevice = d;
    const box = document.getElementById('nd_chosen');
    box.style.display = 'block';
    box.innerHTML = `
      <div class="chosen-head">${LC.deviceTypeIcon(d.device_type, 22)}
        <div>
          <strong>${LC.escapeHtml(d.computer_name)}</strong>
          <div class="mono-sm">${LC.escapeHtml(d.serial_number)} · ${LC.escapeHtml(d.model)}</div>
        </div>
        ${LC.deviceTypeBadge(d.device_type)}
      </div>`;

    // The name field is called something different per type, and the
    // placeholder shows what the device is already called so it is
    // clear that leaving it blank is a real choice.
    document.getElementById('nd_p_name_label').innerHTML =
      LC.escapeHtml(LC.deviceNameLabel(d.device_type)) + ' <span class="opt-tag">optional</span>';
    document.getElementById('nd_p_comp_name').placeholder =
      'Leave blank to keep "' + d.computer_name + '"';

    const btn = document.getElementById('nd_claim_btn');
    btn.disabled = false;
    btn.textContent = 'Start working on ' + d.serial_number;

    document.querySelectorAll('#nd_project_results .pick-row').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.id) === Number(d.id));
    });
  }

  function clearChoice() {
    chosenDevice = null;
    document.getElementById('nd_chosen').style.display = 'none';
    const btn = document.getElementById('nd_claim_btn');
    btn.disabled = true;
    btn.textContent = 'Select a device to start';
  }

  async function refreshProjectDevices() {
    const projectId = currentProjectId();
    const list = document.getElementById('nd_project_results');
    const hint = document.getElementById('nd_search_hint');

    if (!projectId) { list.innerHTML = ''; hint.textContent = ''; clearChoice(); return; }

    const search = document.getElementById('nd_serial_search').value.trim();
    // A sequence number, because responses can arrive out of order:
    // typing "CZC" then "CZC01" can land the slower, broader result
    // last and overwrite the narrower one. Only the newest wins.
    const seq = ++searchSeq;

    list.innerHTML = '<div class="pick-empty">Searching…</div>';
    try {
      const params = new URLSearchParams({ action: 'devices', project_id: projectId, search });
      const data = await LC.get('api/projects.php?' + params.toString());
      if (seq !== searchSeq) { return; }

      if (!data.devices.length) {
        list.innerHTML = `<div class="pick-empty">${search
          ? 'Nothing in this project matches “' + LC.escapeHtml(search) + '”. It may already have been started by someone else.'
          : 'Every device in this project has been started.'}</div>`;
        hint.textContent = '';
        clearChoice();
        return;
      }

      list.innerHTML = data.devices.map(d => `
        <button type="button" class="pick-row" data-id="${d.id}">
          ${LC.deviceTypeIcon(d.device_type, 16)}
          <span class="pick-serial mono">${highlight(d.serial_number, search)}</span>
          <span class="pick-model">${LC.escapeHtml(d.model)}</span>
        </button>`).join('');

      hint.textContent = data.truncated
        ? `Showing ${data.showing} of ${data.total} available — keep typing to narrow it down.`
        : `${data.total} available in this project.`;

      list.querySelectorAll('.pick-row').forEach(btn => {
        btn.addEventListener('click', () => {
          chooseDevice(data.devices.find(x => Number(x.id) === Number(btn.dataset.id)));
        });
      });

      // The one obvious shortcut: if what was typed matches exactly one
      // device, it is already the answer.
      if (data.devices.length === 1 && search.length >= 3) {
        chooseDevice(data.devices[0]);
      } else if (!chosenDevice || !data.devices.some(x => Number(x.id) === Number(chosenDevice.id))) {
        clearChoice();
      }
    } catch (e) {
      if (seq !== searchSeq) { return; }
      list.innerHTML = `<div class="pick-empty">${LC.escapeHtml(e.message)}</div>`;
      clearChoice();
    }
  }

  /** Marks the typed part inside the serial, so the match is visible. */
  function highlight(text, needle) {
    const safe = LC.escapeHtml(text);
    if (!needle) return safe;
    const at = text.toLowerCase().indexOf(needle.toLowerCase());
    if (at < 0) return safe;
    return LC.escapeHtml(text.slice(0, at))
         + '<mark>' + LC.escapeHtml(text.slice(at, at + needle.length)) + '</mark>'
         + LC.escapeHtml(text.slice(at + needle.length));
  }

  async function claimChosen() {
    if (!chosenDevice) return;
    const errBox = document.getElementById('newDeviceError');
    const btn = document.getElementById('nd_claim_btn');
    errBox.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Starting…';

    try {
      const res = await LC.post('api/projects.php?action=claim', {
        device_id: chosenDevice.id,
        department_id: Number(document.getElementById('nd_p_department').value) || undefined,
        end_user_name: document.getElementById('nd_p_end_user').value.trim(),
        computer_name: document.getElementById('nd_p_comp_name').value.trim(),
      });
      LC.toast(`${res.type_label} claimed — ${res.step_count} checklist step(s) generated.`);
      window.location.href = `technician_device.html?id=${res.device_id}`;
    } catch (e) {
      errBox.textContent = e.message;
      errBox.style.display = 'block';
      // Whoever lost the race needs the list to be right again, not a
      // stale row they can click a second time.
      clearChoice();
      refreshProjectDevices();
      loadProjects();
    }
  }

  async function loadProjects() {
    try {
      const data = await LC.get('api/projects.php?action=list');
      const keep = currentProjectId();
      projects = data.projects || [];
      renderProjectOptions();
      if (keep && projects.some(p => Number(p.id) === keep)) {
        document.getElementById('nd_project').value = String(keep);
        updateProjectSummary();
      }
    } catch (e) {
      document.getElementById('nd_project').innerHTML = '<option value="">Could not load projects</option>';
      document.getElementById('nd_project_summary').textContent = e.message;
    }
  }

  function openModal() { document.getElementById('newDeviceModal').style.display = 'flex'; }
  function closeModal() { document.getElementById('newDeviceModal').style.display = 'none'; document.getElementById('newDeviceError').style.display = 'none'; }

  async function init() {
    document.getElementById('newDeviceBtn').addEventListener('click', () => {
      openModal();
      // Re-read the pool every time the dialog opens: what was
      // available when the page loaded is not what is available now.
      loadProjects().then(refreshProjectDevices);
    });
    document.getElementById('closeNewDeviceModal').addEventListener('click', closeModal);
    document.getElementById('nd_department').addEventListener('change', updateSpecHint);

    /* ---- the project pane ---- */
    document.querySelectorAll('#nd_source_picker input[name="nd_source"]').forEach(radio => {
      radio.addEventListener('change', () => setSource(radio.value));
    });
    document.getElementById('nd_project').addEventListener('change', () => {
      updateProjectSummary();
      clearChoice();
      refreshProjectDevices();
    });
    // Debounced, so typing a ten-character serial is one or two
    // requests rather than ten. 220ms is below the point where it
    // feels like waiting and above the point where every keystroke
    // fires.
    document.getElementById('nd_serial_search').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(refreshProjectDevices, 220);
    });
    // Enter on a single match is the fastest path through this screen,
    // and it stops the form being submitted by accident.
    document.getElementById('nd_serial_search').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      clearTimeout(searchTimer);
      if (chosenDevice) { claimChosen(); } else { refreshProjectDevices(); }
    });
    document.getElementById('nd_claim_btn').addEventListener('click', claimChosen);

    document.getElementById('newDeviceForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('newDeviceError');
      errBox.style.display = 'none';
      // Only the fields this type renders exist in the DOM, so each
      // one is read defensively - val()/chk() return undefined for a
      // field that is not on screen, and the server ignores it.
      const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : undefined; };
      const num = id => { const el = document.getElementById(id); return el ? Number(el.value) : undefined; };
      const chk = id => { const el = document.getElementById(id); return el ? el.checked : undefined; };

      const payload = {
        device_type: selectedType,
        // Both optional. An empty select sends nothing rather than 0,
        // so the server stores NULL instead of looking up department
        // zero and refusing the whole form.
        department_id: Number(document.getElementById('nd_department').value) || undefined,
        end_user_name: val('nd_end_user'),
        model: val('nd_model'),
        computer_name: val('nd_comp_name'),
        serial_number: val('nd_serial'),
        ram_gb: num('nd_ram'),
        cpu: val('nd_cpu'),
        storage_type: val('nd_storage_type'),
        storage_gb: num('nd_storage_gb'),
        gpu_model: val('nd_gpu'),
        screen_inch: num('nd_screen'),
        screen_resolution: val('nd_resolution'),
        panel_type: val('nd_panel'),
        fingerprint: chk('nd_fingerprint'),
        touch: chk('nd_touch'),
        form_factor: val('nd_form_factor'),
        os_version: val('nd_os'),
        connection_type: val('nd_connection'),
        ip_address: val('nd_ip'),
        mac_address: val('nd_mac'),
        printer_kind: val('nd_printer_kind'),
        is_color: chk('nd_is_color'),
        supports_duplex: chk('nd_duplex'),
        consumable_model: val('nd_consumable'),
      };
      // Drop the keys whose field was not on screen, so the request
      // body says nothing about a spec this type does not have.
      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

      try {
        const res = await LC.post('api/start_device.php', payload);
        LC.toast(`${res.type_label || res.device_type} registered — ${res.step_count} checklist step(s) generated.`);
        window.location.href = `technician_device.html?id=${res.device_id}`;
      } catch (e2) {
        errBox.textContent = e2.message;
        errBox.style.display = 'block';
      }
    });

    try {
      const meta = await LC.get('api/meta.php');
      // Hand the registry to LC before anything renders: every icon,
      // badge, picker and spec chip below is built from it.
      LC.setDeviceTypes(meta.device_types, meta.category_order, meta.spec_labels);
      departments = meta.departments;
      specOptions = meta.spec_options || {};

      // The first selectable type, from the registry - never a literal.
      // If the list ever changes order or a type is removed, the dialog
      // still opens on something the server will accept.
      const selectable = LC.allDeviceTypes();
      if (!selectable.length) {
        throw new Error('No device types are configured on the server.');
      }
      selectedType = selectable[0].key;

      const deptOptions = '<option value="">Not set yet</option>'
        + departments.map(d => `<option value="${d.id}">${LC.escapeHtml(d.name)}</option>`).join('');
      document.getElementById('nd_department').innerHTML = deptOptions;
      document.getElementById('nd_p_department').innerHTML = deptOptions;

      renderTypePicker();
      renderSpecFields();
      updateNameLabel();
      updateSpecHint();
    } catch (e) { LC.toast(e.message, 'error'); }

    await loadProjects();
    // If nothing is importable yet, open on the single-device form
    // rather than on an empty project list, which reads as broken.
    setSource(projects.length ? 'project' : 'single');
    if (!projects.length) {
      const single = document.querySelector('#nd_source_picker input[value="single"]');
      if (single) single.checked = true;
    }

    refresh();
  }

  init();
})();
