/**
 * Shared front-end utilities: authenticated JSON fetch wrapper (adds the
 * CSRF header automatically), toast notifications, and small formatting
 * helpers reused across the technician / auditor / manager / admin pages.
 */
const LC = (() => {

  function csrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  /** JSON GET/POST helper. Throws on network error; returns parsed body otherwise. */
  async function api(url, options = {}) {
    const opts = Object.assign({ headers: {} }, options);
    opts.headers = Object.assign({
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken(),
    }, opts.headers);

    const res = await fetch(url, opts);
    let body = null;
    try { body = await res.json(); } catch (e) { /* no body */ }

    if (!res.ok) {
      const message = (body && body.error) ? body.error : `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  }

  function post(url, data) {
    return api(url, { method: 'POST', body: JSON.stringify(data || {}) });
  }
  function get(url) {
    return api(url, { method: 'GET' });
  }

  function toast(message, type = 'ok') {
    const host = document.getElementById('toastHost');
    if (!host) { alert(message); return; }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  function statusBadgeClass(status) {
    const map = {
      'In Progress': 'badge-warn',
      'Pending Manager Approval': 'badge-warn',
      'Pending Audit': 'badge-info',
      'Rejected By Audit': 'badge-danger',
      'Completed': 'badge-ok',
      'pending': 'badge-muted',
      'done': 'badge-ok',
      'issue': 'badge-danger',
    };
    return map[status] || 'badge-muted';
  }

  function fmtDateTime(s) {
    if (!s) return '—';
    const d = new Date(s.replace(' ', 'T'));
    if (isNaN(d)) return s;
    return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function fmtPercent(n) {
    return `${Math.round(Number(n) || 0)}%`;
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* =================================================================
     Device types
     -----------------------------------------------------------------
     The registry is NOT defined here. api/meta.php sends it, built
     from includes/device_types.php, and every page calls
     LC.setDeviceTypes(meta.device_types, meta.category_order,
     meta.spec_labels) once after loading meta.

     That is deliberate. A second copy of the type list in JavaScript
     is a copy that drifts, and the symptom of a drifted category list
     is particularly nasty: steps in the unknown category render
     NOWHERE - no error, they are simply not on the page. The old
     hard-coded CATEGORY_ORDER arrays in the two device pages were
     exactly that waiting to happen.

     Until the registry is set these helpers degrade quietly: an
     unknown type still gets a neutral badge instead of throwing and
     taking the whole render down with it.
     ================================================================= */
  let deviceTypes  = [];
  let categoryOrder = [];
  let stepScopes   = [];
  let specLabels   = {};

  function setDeviceTypes(types, order, labels) {
    deviceTypes   = Array.isArray(types) ? types : [];
    categoryOrder = Array.isArray(order) ? order : [];
    if (labels && typeof labels === 'object') specLabels = labels;
  }

  /**
   * The types a technician may CREATE: the five real ones.
   *
   * Not the same as every type that may appear. A device registered
   * before laptops, desktops and all-in-ones were split out carries the
   * legacy value 'Computer', which the registry still describes
   * (selectable: false) so those rows keep their icon and label
   * everywhere - but offering it in a picker would let someone create a
   * new one, which is exactly what the split was for.
   */
  function allDeviceTypes() { return deviceTypes.filter(t => t.selectable !== false); }

  /** Every type that may appear on a device, legacy values included. */
  function allKnownDeviceTypes() { return deviceTypes; }

  /* ----- checklist step scopes: 'All', the groups, the types ----- */

  function setStepScopes(scopes) {
    stepScopes = Array.isArray(scopes) ? scopes : [];
  }
  function allStepScopes() { return stepScopes; }
  function stepScope(key) { return stepScopes.find(s => s.key === key) || null; }

  /**
   * Every step category the registry knows, in display order.
   *
   * This is the union across all device types - what a step marked
   * 'All' may be filed under. Use orderedCategories() instead when you
   * have a specific set of categories to sort.
   */
  function allCategoryOrder() { return categoryOrder; }

  /**
   * The spec labels api/meta.php sends, keyed by column name.
   *
   * The Admin page builds its "save it onto the device as" list from
   * this, so the set of columns a step may write to is the same set
   * api/admin_steps.php validates against and api/update_step.php
   * writes through - one list, not three.
   */
  function specFieldLabels() { return specLabels; }

  function deviceType(key) {
    return deviceTypes.find(t => t.key === key) || null;
  }

  /**
   * The order a device page groups its step categories in.
   *
   * Takes the categories actually present on the device and sorts them
   * by the registry's order. Anything the registry does not know about
   * is appended rather than dropped, so a step can never vanish from
   * the page - the worst case is that it appears at the bottom.
   */
  function orderedCategories(present) {
    const seen = new Set(present);
    const out = categoryOrder.filter(c => seen.has(c));
    present.forEach(c => { if (!out.includes(c)) out.push(c); });
    return out;
  }

  /**
   * A device type's icon, as an inline <svg>.
   *
   * Inline because the Content Security Policy allows no external
   * image origin - and because an icon that is part of the markup
   * cannot fail to load. The path data comes from the registry, so
   * this icon and the one PHP renders server-side are the same
   * drawing.
   */
  function deviceTypeIcon(key, size = 18, opts = {}) {
    const t = deviceType(key);
    const paths = t ? t.icon : ['M3 5h18v12H3z'];
    const fill  = opts.inherit ? 'currentColor' : (t ? t.accent : 'currentColor');
    const label = t ? t.label : (key || 'Device');
    return `<svg class="dt-icon" viewBox="0 0 24 24" width="${size}" height="${size}"`
         + ` fill="${fill}" role="img" aria-label="${escapeHtml(label)}">`
         + paths.map(d => `<path d="${escapeHtml(d)}"/>`).join('')
         + `</svg>`;
  }

  /** Icon + label: the pill used in tables and card headers. */
  function deviceTypeBadge(key, opts = {}) {
    const t = deviceType(key);
    const label = t ? t.label : (key || 'Device');
    const accent = t ? t.accent : '#93a3bd';
    return `<span class="dt-badge" style="--dt-accent:${accent};" title="${escapeHtml(label)}">`
         + deviceTypeIcon(key, opts.size || 15)
         + (opts.iconOnly ? '' : `<span>${escapeHtml(label)}</span>`)
         + `</span>`;
  }

  /** What this type calls the computer_name field. */
  function deviceNameLabel(key) {
    const t = deviceType(key);
    return t ? t.name_label : 'Device Name';
  }

  /* =================================================================
     The specification of one device
     -----------------------------------------------------------------
     Built here, once, because four different places show it: the
     technician's device cards, the manager's device lookup, and the
     technician and auditor device pages. Four copies of this formatting
     would be four places for "16" to turn up without its "GB".

     Which fields appear comes from the device's own TYPE, not from
     which columns happen to be non-empty: a printer with no IP address
     recorded should show "IP Address —", because the blank is the
     information. A field the type does not have is simply not listed.
     ================================================================= */

  /** Fields whose value is a yes/no, where null means "not recorded". */
  const BOOL_SPEC_FIELDS = ['has_fingerprint', 'has_touch', 'is_color', 'supports_duplex'];

  /** Fields that carry a unit, and what that unit is. */
  const SPEC_UNITS = { spec_ram_gb: ' GB', storage_gb: ' GB', spec_screen_inch: '"' };

  /**
   * One device's specification as [{field, label, value}].
   *
   * Values arrive from the driver as strings for decimals and integers
   * for bit columns, so everything is normalised here rather than at
   * each call site.
   */
  function specRows(device) {
    const t = deviceType(device.device_type);
    const fields = t ? (t.spec_fields || []) : [];

    return fields.map(f => {
      const raw = device[f];
      let value;

      if (BOOL_SPEC_FIELDS.includes(f)) {
        // null/undefined is genuinely different from 0 here: "we did
        // not record whether this printer prints in colour" is not the
        // same statement as "it does not".
        value = (raw === null || raw === undefined || raw === '') ? '—' : (Number(raw) ? 'Yes' : 'No');
      } else if (raw === null || raw === undefined || raw === '' || Number(raw) === 0 && f in SPEC_UNITS) {
        // 0 GB of RAM and a 0-inch screen are what the NOT NULL
        // columns hold when nothing was entered, so they read as blank
        // rather than as a measurement.
        value = '—';
      } else if (f in SPEC_UNITS) {
        value = `${raw}${SPEC_UNITS[f]}`;
      } else {
        value = String(raw);
      }

      return { field: f, label: specLabels[f] || f, value };
    });
  }

  /**
   * The spec panel: every field this device's type carries, with the
   * type's accent on the heading.
   *
   * opts.title  - heading text (default: "<Type> specification")
   * opts.compact- fewer, wider columns, for a narrow card
   */
  function specPanelHtml(device, opts = {}) {
    const rows = specRows(device);
    if (!rows.length) return '';

    const t = deviceType(device.device_type);
    const accent = t ? t.accent : '#93a3bd';
    const title = opts.title !== undefined
      ? opts.title
      : `${t ? t.label : 'Device'} specification`;

    return `<div class="dt-spec-panel${opts.compact ? ' compact' : ''}" style="--dt-accent:${accent};">`
         + (title ? `<div class="dt-spec-title">${deviceTypeIcon(device.device_type, 14)}<span>${escapeHtml(title)}</span></div>` : '')
         + `<div class="dt-spec-grid">`
         + rows.map(r => `<div class="dt-spec-row"><span>${escapeHtml(r.label)}</span><b>${escapeHtml(r.value)}</b></div>`).join('')
         + `</div></div>`;
  }

  /**
   * The two or three specs worth putting on a list card, chosen per
   * type - a laptop is known by its RAM and screen, a printer by its
   * kind and address. Anything not recorded is left out rather than
   * shown as a dash, because a card has no room to say nothing.
   */
  const CARD_SPEC_FIELDS = {
    'Laptop':     ['spec_ram_gb', 'spec_cpu', 'spec_screen_inch'],
    'Desktop':    ['spec_ram_gb', 'spec_cpu', 'form_factor'],
    'All-in-One': ['spec_ram_gb', 'spec_screen_inch', 'screen_resolution'],
    'Monitor':    ['spec_screen_inch', 'screen_resolution', 'panel_type'],
    'Printer':    ['printer_kind', 'ip_address', 'consumable_model'],
    'Computer':   ['spec_ram_gb', 'spec_cpu', 'spec_screen_inch'],
  };

  function specChipsHtml(device) {
    const want = CARD_SPEC_FIELDS[device.device_type] || [];
    const rows = specRows(device).filter(r => want.includes(r.field) && r.value !== '—');
    if (!rows.length) return '';
    return `<div class="dt-spec-chips">`
         + rows.map(r => `<span class="dt-chip" title="${escapeHtml(r.label)}">${escapeHtml(r.value)}</span>`).join('')
         + `</div>`;
  }

  return {
    api, get, post, toast, statusBadgeClass, fmtDateTime, fmtPercent, escapeHtml, csrfToken,
    setDeviceTypes, allDeviceTypes, allKnownDeviceTypes, deviceType,
    setStepScopes, allStepScopes, stepScope,
    orderedCategories, allCategoryOrder,
    deviceTypeIcon, deviceTypeBadge, deviceNameLabel,
    specRows, specPanelHtml, specChipsHtml, specFieldLabels,
  };
})();
