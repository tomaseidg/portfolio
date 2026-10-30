/**
 * Shared front-end utilities used across every page: a searchable
 * multi-select dropdown component, fetch/format helpers.
 */
const POC = (() => {
  const multiState = {};

  function closeAllMultiSelects(except) {
    document.querySelectorAll('.msel.open').forEach(el => {
      if (el !== except) el.classList.remove('open');
    });
  }

  function normalizeOptions(raw) {
    return (raw || []).map(item => {
      if (item && typeof item === 'object') return { value: String(item.value), label: item.label ?? String(item.value) };
      return { value: String(item), label: String(item) };
    });
  }

  function updateMultiSelectLabel(wrapEl, fallbackLabel) {
    const key = wrapEl.dataset.key;
    const selected = multiState[key] || new Set();
    const labelEl = wrapEl.querySelector('.msel-label');
    if (selected.size === 0) {
      labelEl.textContent = fallbackLabel;
    } else if (selected.size === 1) {
      const values = normalizeOptions(JSON.parse(wrapEl.dataset.values || '[]'));
      const match = values.find(v => v.value === Array.from(selected)[0]);
      labelEl.textContent = match ? match.label : Array.from(selected)[0];
    } else {
      labelEl.textContent = `${selected.size} selected`;
    }
  }

  function renderMultiSelectOptions(wrapEl, rawItems, filterText = '') {
    const key = wrapEl.dataset.key;
    const optionsEl = wrapEl.querySelector('.msel-options');
    const items = normalizeOptions(rawItems);
    const filtered = filterText
      ? items.filter(i => i.label.toLowerCase().includes(filterText.toLowerCase()))
      : items;

    if (filtered.length === 0) {
      optionsEl.innerHTML = '<div class="msel-empty">No matches</div>';
      return;
    }

    const selected = multiState[key] || new Set();
    optionsEl.innerHTML = filtered.map(i => `
      <label class="msel-option">
        <input type="checkbox" value="${escapeHtml(i.value)}" ${selected.has(i.value) ? 'checked' : ''}>
        <span>${escapeHtml(i.label)}</span>
      </label>
    `).join('');

    optionsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const set = multiState[key] || new Set();
        if (cb.checked) set.add(cb.value); else set.delete(cb.value);
        multiState[key] = set;
        updateMultiSelectLabel(wrapEl, wrapEl.dataset.fallback || 'All');
      });
    });
  }

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
    });

    document.addEventListener('click', (e) => {
      if (!wrapEl.contains(e.target)) wrapEl.classList.remove('open');
    });
  }

  function fillMultiSelect(key, items, fallbackLabel = 'All') {
    const wrapEl = document.getElementById(`ms_${key}`);
    if (!wrapEl) return;

    const normalized = normalizeOptions(items);
    wrapEl.dataset.values = JSON.stringify(normalized);
    wrapEl.dataset.fallback = fallbackLabel;

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

  function getMultiSelectValues(key) {
    return Array.from(multiState[key] || []);
  }

  function initAllMultiSelects() {
    document.querySelectorAll('.msel').forEach(initMultiSelect);
  }

  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, { credentials: 'same-origin', ...options });
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

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** SQL Server DATETIME2(0) columns come back as "YYYY-MM-DD HH:MM:SS" — make that parseable.
      (The scale of 0 is deliberate: at any other precision the driver appends a fractional
      part that this parse would choke on. See sql/mssql/02_schema.sql.) */
  function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value.replace(' ', 'T'));
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(value) {
    if (!value) return 'never';
    const d = new Date(value.replace(' ', 'T'));
    if (isNaN(d.getTime())) return value;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return {
    initAllMultiSelects, fillMultiSelect, getMultiSelectValues,
    fetchJSON, escapeHtml, formatDateTime, timeAgo,
  };
})();
