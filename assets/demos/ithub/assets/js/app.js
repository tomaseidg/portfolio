/**
 * Shared front-end utilities used by both the dashboard and the tickets
 * page: a searchable multi-select dropdown component (supports both plain
 * value lists and {value,label} pairs, e.g. for the Month filter), reading
 * the current filter selection, populating filter dropdowns from the
 * server, building query strings the PHP endpoints understand, and small
 * formatting/badge helpers.
 */
const ITHub = (() => {

  /** filterKey -> DOM id of the <div class="msel"> wrapper for that filter. */
  const MULTI_FILTER_IDS = {
    months: 'ms_months',
    quarters: 'ms_quarters',
    site: 'ms_site',
    technician: 'ms_technician',
    department: 'ms_department',
    ticket_group: 'ms_ticket_group',
  };

  const SINGLE_FILTER_IDS = {
    date_from: 'f_date_from',
    date_to: 'f_date_to',
    search: 'f_search',
  };

  /** filterKey -> current Set of selected values (source of truth for multi-selects). */
  const multiState = {};

  /**
   * Ad-hoc filters with no permanent UI control (Category, Requester,
   * RequestType, Overdue, ReOpened, First Response Overdue) — set once via
   * setExtraFilterParams() when landing on a page via a drill-through link,
   * then merged into every getFilterState() call until reset.
   */
  let extraFilterParams = {};

  function setExtraFilterParams(obj) {
    extraFilterParams = obj || {};
  }

  function getExtraFilterParams() {
    return extraFilterParams;
  }

  function clearExtraFilterParams() {
    extraFilterParams = {};
  }

  /** Adds a value to a multi-select filter's selection before its dropdown is even populated. */
  function presetMultiSelectValue(key, value) {
    if (value === undefined || value === null || value === '') return;
    multiState[key] = multiState[key] || new Set();
    multiState[key].add(value);
  }

  /** Set once by wireFilterButtons(); called after every live filter change. */
  let liveApplyCallback = null;
  let liveApplyTimer = null;

  /** Debounced trigger so rapid typing/clicking doesn't fire a request per keystroke. */
  function triggerLiveApply(delay = 250) {
    if (!liveApplyCallback) return;
    clearTimeout(liveApplyTimer);
    liveApplyTimer = setTimeout(() => liveApplyCallback(), delay);
  }

  // ------------------------------------------------------------------
  // Multi-select dropdown component
  // Options are always normalized internally to {value, label} pairs so
  // filters like Month (value "2026-07", label "July 2026") work exactly
  // like simple value-only filters (Site, Technician, ...).
  // ------------------------------------------------------------------

  function closeAllMultiSelects(except) {
    document.querySelectorAll('.msel.open').forEach(el => {
      if (el !== except) el.classList.remove('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msel')) closeAllMultiSelects(null);
  });

  function normalizeOptions(raw) {
    return (raw || []).map(item =>
      typeof item === 'object' && item !== null
        ? { value: String(item.value), label: String(item.label ?? item.value) }
        : { value: String(item), label: String(item) }
    );
  }

  function updateMultiSelectLabel(wrapEl, fallbackLabel) {
    const toggle = wrapEl.querySelector('.msel-toggle');
    const key = wrapEl.dataset.key;
    const selected = multiState[key] || new Set();
    const labelSpan = toggle.querySelector('.msel-label');

    if (selected.size === 0) {
      labelSpan.textContent = fallbackLabel;
    } else if (selected.size === 1) {
      const items = normalizeOptions(JSON.parse(wrapEl.dataset.values || '[]'));
      const match = items.find(i => i.value === Array.from(selected)[0]);
      labelSpan.textContent = match ? match.label : Array.from(selected)[0];
    } else {
      labelSpan.textContent = `${selected.size} selected`;
    }

    let badge = toggle.querySelector('.msel-count-badge');
    if (selected.size > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'msel-count-badge';
        toggle.insertBefore(badge, toggle.querySelector('.chev'));
      }
      badge.textContent = selected.size;
    } else if (badge) {
      badge.remove();
    }
  }

  function renderMultiSelectOptions(wrapEl, rawItems, filterText = '') {
    const key = wrapEl.dataset.key;
    const optionsEl = wrapEl.querySelector('.msel-options');
    const selected = multiState[key] || new Set();
    const needle = filterText.trim().toLowerCase();
    const items = normalizeOptions(rawItems);

    const visible = needle
      ? items.filter(i => i.label.toLowerCase().includes(needle))
      : items;

    if (visible.length === 0) {
      optionsEl.innerHTML = '<div class="msel-empty">No matching options</div>';
      return;
    }

    optionsEl.innerHTML = visible.map(i => `
      <label class="msel-option">
        <input type="checkbox" value="${escapeHtml(i.value)}" ${selected.has(i.value) ? 'checked' : ''}>
        <span>${escapeHtml(i.label)}</span>
      </label>
    `).join('');

    optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selected.add(cb.value);
        else selected.delete(cb.value);
        multiState[key] = selected;
        updateMultiSelectLabel(wrapEl, wrapEl.dataset.fallback || 'All');
        triggerLiveApply();
      });
    });
  }

  /** Builds the interactive behaviour for one .msel wrapper already in the DOM. */
  function initMultiSelect(wrapEl) {
    const key = wrapEl.dataset.key;
    multiState[key] = multiState[key] || new Set();

    const toggle = wrapEl.querySelector('.msel-toggle');
    const search = wrapEl.querySelector('.msel-search');
    const clearBtn = wrapEl.querySelector('.msel-clear');
    const allValues = () => JSON.parse(wrapEl.dataset.values || '[]');

    toggle.addEventListener('click', () => {
      const willOpen = !wrapEl.classList.contains('open');
      closeAllMultiSelects(wrapEl);
      wrapEl.classList.toggle('open', willOpen);
      if (willOpen) {
        search.value = '';
        renderMultiSelectOptions(wrapEl, allValues());
        search.focus();
      }
    });

    search.addEventListener('input', () => {
      renderMultiSelectOptions(wrapEl, allValues(), search.value);
    });

    clearBtn.addEventListener('click', () => {
      multiState[key] = new Set();
      updateMultiSelectLabel(wrapEl, wrapEl.dataset.fallback || 'All');
      renderMultiSelectOptions(wrapEl, allValues(), search.value);
      triggerLiveApply();
    });
  }

  /**
   * Fills one multi-select with fresh option values from the server.
   * `items` can be an array of strings or an array of {value,label} objects.
   */
  function fillMultiSelect(key, items, fallbackLabel = 'All') {
    const wrapEl = document.getElementById(MULTI_FILTER_IDS[key] || `ms_${key}`);
    if (!wrapEl) return;

    const normalized = normalizeOptions(items);
    wrapEl.dataset.values = JSON.stringify(normalized);
    wrapEl.dataset.fallback = fallbackLabel;

    // Drop any previously selected values that no longer exist in the new list.
    const valid = new Set(normalized.map(i => i.value));
    const selected = multiState[key] || new Set();
    for (const v of Array.from(selected)) {
      if (!valid.has(v)) selected.delete(v);
    }
    multiState[key] = selected;
    updateMultiSelectLabel(wrapEl, fallbackLabel);

    if (wrapEl.classList.contains('open')) {
      renderMultiSelectOptions(wrapEl, normalized);
    }
  }

  /** Reads the current selection for any multi-select key (standard or custom, e.g. a report recipient picker). */
  function getMultiSelectValues(key) {
    return Array.from(multiState[key] || []);
  }

  function resetMultiSelects() {
    for (const key of Object.keys(MULTI_FILTER_IDS)) {
      multiState[key] = new Set();
      const wrapEl = document.getElementById(MULTI_FILTER_IDS[key]);
      if (wrapEl) updateMultiSelectLabel(wrapEl, wrapEl.dataset.fallback || 'All');
    }
  }

  /** Wires every .msel element found on the current page. */
  function initAllMultiSelects() {
    document.querySelectorAll('.msel').forEach(initMultiSelect);
  }

  // ------------------------------------------------------------------
  // Filter state
  // ------------------------------------------------------------------

  /** Reads every present filter control and returns a plain filter object. */
  function getFilterState() {
    const filters = {};

    for (const [key, id] of Object.entries(SINGLE_FILTER_IDS)) {
      const el = document.getElementById(id);
      if (el) filters[key] = el.value.trim();
    }

    for (const key of Object.keys(MULTI_FILTER_IDS)) {
      filters[key] = Array.from(multiState[key] || []);
    }

    // Drill-through filters (Category, Requester, RequestType, Overdue,
    // ReOpened, First Response Overdue) have no UI control of their own —
    // merge them in directly so they stay applied until explicitly reset.
    return { ...filters, ...extraFilterParams };
  }

  /** Turns a filter object into a URLSearchParams the PHP endpoints expect. */
  function filtersToParams(filters, extra = {}) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(`${key}[]`, v));
      } else if (value !== '' && value !== undefined && value !== null) {
        params.append(key, value);
      }
    }

    for (const [key, value] of Object.entries(extra)) {
      params.append(key, value);
    }

    return params;
  }

  /** Resets every filter control on the page to its default state. */
  function resetFilterControls() {
    for (const id of Object.values(SINGLE_FILTER_IDS)) {
      const el = document.getElementById(id);
      if (el) el.value = '';
    }
    resetMultiSelects();
    clearExtraFilterParams();
    const banner = document.getElementById('quickFilterBanner');
    if (banner) banner.style.display = 'none';
  }

  /** Maps a Top-10 / ranking "dim" key to the underlying ticket filter param key. */
  function dimFilterKey(dim) {
    const map = {
      technician: 'technician',
      site: 'site',
      category: 'category',
      department: 'department',
      requester: 'requester',
      group: 'ticket_group',
      overdue_technician: 'technician',
      technician_fastest: 'technician',
      technician_highest_rated: 'technician',
      requester_lowest_rated: 'requester',
    };
    return map[dim] || dim;
  }

  /** Builds the extra-params object for a single Top-10/ranking row's drill-through link. */
  function rowDrillThroughParams(dim, label) {
    const key = dimFilterKey(dim);
    const params = { [key]: [label] };
    if (dim === 'overdue_technician') {
      params.overdue = 'TRUE';
    }
    if (dim === 'technician_highest_rated' || dim === 'requester_lowest_rated') {
      params.rated = 'TRUE';
    }
    return params;
  }

  /**
   * Builds a tickets.html URL that shows exactly the tickets matching the
   * given extra filter params, layered on top of the current (or supplied)
   * filter selection — used by KPI cards, Top-10 rows, and ranking.html rows.
   */
  function ticketsLinkFor(extraParams, baseFilters) {
    const filters = { ...(baseFilters || getFilterState()), ...(extraParams || {}) };
    return 'tickets.html?' + filtersToParams(filters).toString();
  }

  /** Fetches JSON and throws with a readable message on failure. */
  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (res.status === 401) {
      DEMO.go('login.php');
      throw new Error('Session expired');
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  /**
   * Populates every multi-select filter dropdown from /api/filters_meta.php.
   * Group switcher behavior:
   * - Unrestricted (admin/manager): normal multi-select of every group.
   * - Restricted to exactly one group: fixed, non-interactive label.
   * - Restricted to several groups: multi-select, but limited to only
   *   their own assigned groups (still server-enforced regardless).
   * - Restricted to zero groups: label reads "No Groups Assigned".
   */
  async function loadFilterMeta() {
    const meta = await fetchJSON('api/filters_meta.php');

    fillMultiSelect('months', meta.months || [], 'All Months');
    fillMultiSelect('quarters', meta.quarters || [], 'All Quarters');
    fillMultiSelect('site', meta.site || [], 'All Sites');
    fillMultiSelect('technician', meta.technician || [], 'All Technicians');
    fillMultiSelect('department', meta.department || [], 'All Departments');

    const groupDropdown = document.getElementById('ms_ticket_group');
    const groupStatic = document.getElementById('groupStaticLabel');
    const restrictedGroups = meta.restricted_groups || [];

    if (meta.is_group_restricted && restrictedGroups.length <= 1) {
      if (groupDropdown) groupDropdown.style.display = 'none';
      if (groupStatic) {
        groupStatic.style.display = '';
        groupStatic.textContent = restrictedGroups[0] || 'No Groups Assigned';
      }
    } else {
      if (groupStatic) groupStatic.style.display = 'none';
      if (groupDropdown) groupDropdown.style.display = '';
      fillMultiSelect('ticket_group', meta.ticket_group || [], 'All Groups');
    }

    return meta;
  }

  /**
   * Wires the Apply/Reset buttons (where present) AND makes every filter
   * control reactive: changing a date, the Overdue dropdown, typing in
   * search, or toggling a checkbox in a multi-select all immediately
   * refresh the charts/table (debounced), so results move live with the
   * filters rather than only on an explicit Apply click.
   */
  function wireFilterButtons(onApply) {
    liveApplyCallback = onApply;

    const applyBtn = document.getElementById('applyFilters');
    const resetBtn = document.getElementById('resetFilters');

    if (applyBtn) applyBtn.addEventListener('click', () => onApply());
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetFilterControls();
        onApply();
      });
    }

    // Dates react instantly on change.
    ['f_date_from', 'f_date_to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => triggerLiveApply(0));
    });

    // Free-text search reacts as the user types, debounced.
    const searchEl = document.getElementById('f_search');
    if (searchEl) searchEl.addEventListener('input', () => triggerLiveApply(400));
  }

  function statusBadgeClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'closed' || s === 'resolved') return 'badge-ok';
    if (s === 'open' || s === 'in progress') return 'badge-warn';
    if (s === 'overdue') return 'badge-danger';
    return 'badge-neutral';
  }

  function priorityBadgeClass(priority) {
    const p = (priority || '').toLowerCase();
    if (p === 'critical') return 'badge-danger';
    if (p === 'high') return 'badge-warn';
    if (p === 'medium') return 'badge-neutral';
    return 'badge-ok';
  }

  function yesNoBadgeClass(value, positiveIsBad = true) {
    const v = (value || '').toLowerCase();
    const isPositive = v === 'yes' || v === 'true';
    if (positiveIsBad) return isPositive ? 'badge-danger' : 'badge-ok';
    return isPositive ? 'badge-ok' : 'badge-neutral';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  /**
   * The database stores CreatedTime/DueByTime/ResolvedTime/CompletedTime as
   * text like "17/12/2025 01:51:PM" (d/m/Y h:i:A, no seconds) rather than a
   * native datetime. Parse that exact shape before falling back to the
   * platform Date parser for anything else.
   */
  function parseStoredDateTime(value) {
    if (!value) return null;
    const m = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(AM|PM)$/i);
    if (!m) return null;
    let [, day, month, year, hour, minute, ampm] = m;
    hour = parseInt(hour, 10);
    if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    const d = new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute));
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const parsed = parseStoredDateTime(value) || new Date(String(value).replace(' ', 'T'));
    if (isNaN(parsed.getTime())) return value; // Keep the raw value if nothing parses (defensive).
    return parsed.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return {
    initAllMultiSelects,
    getFilterState,
    filtersToParams,
    resetFilterControls,
    fetchJSON,
    loadFilterMeta,
    wireFilterButtons,
    statusBadgeClass,
    priorityBadgeClass,
    yesNoBadgeClass,
    escapeHtml,
    formatDateTime,
    setExtraFilterParams,
    getExtraFilterParams,
    clearExtraFilterParams,
    presetMultiSelectValue,
    dimFilterKey,
    rowDrillThroughParams,
    fillMultiSelect,
    getMultiSelectValues,
    ticketsLinkFor,
  };
})();
