/* IT Hub: sample tickets only. Every chart, list and table is computed from the same generated set. */
(function () {
  const D = window.DEMO; D.app = 'ithub';
  D.pages = ['index', 'tickets', 'technician', 'ranking'];
  const pad = (n) => String(n).padStart(2, '0');

  const TECHS = ['Sara Hassan', 'Ahmed Reda', 'Omar Fathy', 'Nour Hamed', 'Karim Nabil', 'Mai Ezzat', 'Youssef Samy', 'Hana Adel'];
  const TECH_W = [16, 15, 13, 12, 11, 9, 8, 6];
  const GROUPS = { 'IT Service Desk': 0.42, 'IT Field Support': 0.24, 'Network Team': 0.12, 'ERP Support': 0.12, 'Applications': 0.10 };
  const SITES = { 'Head Office': 0.38, 'North Campus': 0.27, 'East Branch': 0.21, 'West Branch': 0.14 };
  const DEPTS = ['Finance', 'Human Resources', 'Customer Service', 'Sales', 'Procurement', 'Marketing', 'Quality', 'Operations', 'Logistics', 'IT', 'Facilities', 'Legal'];
  const CATS = {
    'Accounts & Access': ['Password reset', 'New account', 'Permissions', 'MFA'],
    'Hardware': ['Laptop', 'Desktop', 'Monitor', 'Peripherals'],
    'Printing': ['Paper jam', 'Toner', 'Driver', 'Scan to email'],
    'Software': ['Office', 'Installation', 'Licence'],
    'Network': ['Wi-Fi', 'VPN', 'Cabling'],
    'ERP': ['Access', 'Report', 'Error'],
    'Email': ['Mailbox', 'Outlook', 'Distribution list'],
  };
  const CAT_W = [0.24, 0.2, 0.15, 0.13, 0.1, 0.1, 0.08];
  const FIRST = ['Mona', 'Youssef', 'Dina', 'Rami', 'Laila', 'Hany', 'Tamer', 'Nadia', 'Walid', 'Rana', 'Sherif', 'Aya', 'Kareem', 'Mariam', 'Ali', 'Salma', 'Mostafa', 'Noha', 'Amr', 'Heba', 'Islam', 'Yara', 'Khaled', 'Reem'];
  const LAST = ['Samir', 'Adel', 'Fawzy', 'Gamal', 'Mostafa', 'Lotfy', 'Saleh', 'Kamal', 'Samy', 'Magdy', 'Anwar', 'Hamdy', 'Ibrahim', 'Farouk', 'Nabil', 'Wahba'];
  const REQUESTERS = Array.from({ length: 46 }, (_, i) => `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`);
  const PRI = { Low: 0.3, Medium: 0.45, High: 0.2, Critical: 0.05 };
  const SLA_H = { Low: 24, Medium: 8, High: 4, Critical: 2 };

  function weighted(obj) { const r = D.rand(); let acc = 0; for (const [k, w] of Object.entries(obj)) { acc += w; if (r <= acc) return k; } return Object.keys(obj)[0]; }
  function weightedArr(arr, w) { const tot = w.reduce((a, b) => a + b, 0); let r = D.rand() * tot; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[0]; }
  function fmt(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`; }

  const now = new Date();
  const tickets = [];
  const DAYS = 182;
  let id = 48210;
  for (let day = DAYS; day >= 0; day--) {
    const date = new Date(now.getTime() - day * 86400000);
    const dow = date.getDay();
    const n = dow === 5 ? D.int(0, 2) : dow === 6 ? D.int(1, 4) : D.int(5, 11);
    for (let k = 0; k < n; k++) {
      const created = new Date(date); created.setHours(D.int(8, 17), D.int(0, 59), 0, 0);
      if (created > now) continue;
      const cat = weightedArr(Object.keys(CATS), CAT_W);
      const pri = weighted(PRI);
      const tIdx = TECHS.indexOf(weightedArr(TECHS, TECH_W));
      const skill = [0.62, 0.7, 0.55, 0.82, 0.78, 0.9, 0.85, 0.95][tIdx];
      const usedPct = Math.round(Math.max(8, Math.min(180, skill * 100 * (0.45 + D.rand() * 1.3))));
      const ageDays = day;
      let status = 'Closed';
      if (ageDays < 3) status = weightedArr(['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'], [3, 3, 1, 2, 2]);
      else if (ageDays < 14) status = weightedArr(['Closed', 'Resolved', 'On Hold', 'Pending'], [8, 3, 1, 1]);
      const overdue = usedPct > 100;
      const rated = (status === 'Closed' || status === 'Resolved') && D.rand() > 0.55;
      const score = rated ? Math.max(1, Math.min(5, Math.round(5.6 - (usedPct / 60) + (D.rand() - 0.5)))) : null;
      tickets.push({
        RequestID: String(id++), CreatedTime: fmt(created), Technician: TECHS[tIdx],
        Requester: REQUESTERS[D.int(0, REQUESTERS.length - 1)],
        RequestType: D.rand() < 0.58 ? 'Service Request' : 'Incident',
        Category: cat, SubCategory: D.pick(CATS[cat]), RequestStatus: status, Priority: pri,
        Site: weighted(SITES), Department: D.pick(DEPTS), Group: cat === 'Network' ? 'Network Team' : cat === 'ERP' ? 'ERP Support' : cat === 'Hardware' || cat === 'Printing' ? (D.rand() < 0.6 ? 'IT Field Support' : 'IT Service Desk') : weighted(GROUPS),
        SLA: `${SLA_H[pri]} Hours`, SurveyScore: score ? String(score) : '',
        _overdue: overdue, _fro: D.rand() < 0.07, _reopened: D.rand() < 0.04, _vip: D.rand() < 0.05,
        _createdBy: D.rand() < 0.66 ? 'system' : 'technician', _usedPct: usedPct,
        _resolvedHours: Math.round(SLA_H[pri] * usedPct / 100 * 10) / 10,
      });
    }
  }
  // A few named requesters that rate lower, so the "least satisfied" list has a story.
  tickets.filter(t => t.SurveyScore).slice(0, 40).forEach((t, i) => { if (i % 6 === 0) { t.Requester = REQUESTERS[3]; t.SurveyScore = '2'; } });

  // ---------- filtering ----------
  const MULTI = { site: 'Site', technician: 'Technician', department: 'Department', category: 'Category', requester: 'Requester', ticket_group: 'Group', request_type: 'RequestType', priority: 'Priority', status: 'RequestStatus', sla: 'SLA' };
  function filter(params) {
    const from = params.get('date_from'), to = params.get('date_to');
    const months = params.getAll('months[]'), quarters = params.getAll('quarters[]');
    const q = (params.get('search') || '').toLowerCase();
    const yes = (k) => params.get(k) === 'TRUE', no = (k) => params.get(k) === 'FALSE';
    const kind = params.get('created_by_kind'), tg = params.get('request_type_group');
    const day = params.get('day');
    return tickets.filter(t => {
      for (const [k, col] of Object.entries(MULTI)) { const v = params.getAll(k + '[]'); if (v.length && !v.includes(t[col])) return false; }
      const d = t.CreatedTime.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (day && d !== day) return false;
      if (months.length && !months.includes(d.slice(0, 7))) return false;
      if (quarters.length) { const qn = `${d.slice(0, 4)}-Q${Math.floor((+d.slice(5, 7) - 1) / 3) + 1}`; if (!quarters.includes(qn)) return false; }
      if (yes('overdue') && !t._overdue) return false; if (no('overdue') && t._overdue) return false;
      if (yes('first_response_overdue') && !t._fro) return false;
      if (yes('reopened') && !t._reopened) return false;
      if (yes('vip') && !t._vip) return false;
      if (yes('rated') && !t.SurveyScore) return false;
      if (kind && t._createdBy !== kind) return false;
      if (tg === 'service' && t.RequestType !== 'Service Request') return false;
      if (tg === 'incident' && t.RequestType !== 'Incident') return false;
      if (q && !Object.values(t).join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function countBy(rows, key) { const m = {}; rows.forEach(r => { const k = typeof key === 'function' ? key(r) : r[key]; m[k] = (m[k] || 0) + 1; }); return m; }
  const top = (m, n = 10) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));

  function monthKeys(n) { const out = []; const d = new Date(now.getFullYear(), now.getMonth(), 1); for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`); } return out; }
  const monthLabel = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });

  function fastest(rows, all) {
    const by = {}; rows.forEach(t => { (by[t.Technician] = by[t.Technician] || []).push(t._usedPct); });
    const out = Object.entries(by).filter(([, v]) => v.length >= (all ? 1 : 25)).map(([label, v]) => { const avg = v.reduce((a, b) => a + b, 0) / v.length; return { label, value: Math.round(avg), display: `${Math.round(avg)}% of SLA`, meta: ` · ${v.length} tickets`, lower_is_better: true }; });
    return out.sort((a, b) => a.value - b.value);
  }
  function rated(rows, key, asc) {
    const by = {}; rows.filter(t => t.SurveyScore).forEach(t => { (by[t[key]] = by[t[key]] || []).push(+t.SurveyScore); });
    const out = Object.entries(by).filter(([, v]) => v.length >= (key === 'Requester' ? 2 : 5)).map(([label, v]) => { const avg = v.reduce((a, b) => a + b, 0) / v.length; return { label, value: +avg.toFixed(2), display: `${avg.toFixed(2)} ★`, meta: ` · ${v.length} ratings` }; });
    return out.sort((a, b) => asc ? a.value - b.value : b.value - a.value);
  }

  D.routes.filters_meta = () => {
    const ms = [...new Set(tickets.map(t => t.CreatedTime.slice(0, 7)))].sort().reverse();
    const qs = [...new Set(tickets.map(t => `${t.CreatedTime.slice(0, 4)}-Q${Math.floor((+t.CreatedTime.slice(5, 7) - 1) / 3) + 1}`))].sort().reverse();
    return {
      months: ms.map(v => ({ value: v, label: new Date(+v.slice(0, 4), +v.slice(5) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }) })),
      quarters: qs.map(v => ({ value: v, label: v.replace('-', ' ') })),
      site: Object.keys(SITES), technician: TECHS.slice().sort(), department: DEPTS.slice().sort(), ticket_group: Object.keys(GROUPS),
      is_group_restricted: false, restricted_groups: [],
    };
  };

  D.routes.dashboard_data = (params) => {
    const rows = filter(params);
    const total = rows.length || 1;
    const mk = monthKeys(6);
    const days = []; for (let i = 29; i >= 0; i--) { const d = new Date(now.getTime() - i * 86400000); days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); }
    const byMonth = countBy(rows, r => r.CreatedTime.slice(0, 7));
    const byDay = countBy(rows, r => r.CreatedTime.slice(0, 10));
    const sys = countBy(rows.filter(r => r._createdBy === 'system'), r => r.CreatedTime.slice(0, 7));
    const tec = countBy(rows.filter(r => r._createdBy === 'technician'), r => r.CreatedTime.slice(0, 7));
    const svc = countBy(rows, r => r.RequestType === 'Service Request' ? 'Service' : 'Incident');
    const overdue = rows.filter(r => r._overdue);
    return {
      kpis: [
        { label: 'Total Tickets', value: rows.length, format: 'number' },
        { label: 'Overdue', value: overdue.length, format: 'number' },
        { label: 'First Response Overdue', value: rows.filter(r => r._fro).length, format: 'number' },
        { label: 'Reopened', value: rows.filter(r => r._reopened).length, format: 'number' },
        { label: 'On-Time Rate', value: +(100 - overdue.length / total * 100).toFixed(1), format: 'percent' },
        { label: 'Pending', value: rows.filter(r => r.RequestStatus === 'Pending').length, format: 'number' },
        { label: 'On Hold', value: rows.filter(r => r.RequestStatus === 'On Hold').length, format: 'number' },
        { label: 'VIP', value: rows.filter(r => r._vip).length, format: 'number' },
      ],
      monthly_trend: { labels: mk.map(monthLabel), values: mk.map(m => byMonth[m] || 0), periods: mk, range_label: 'last 6 months' },
      created_by_trend: { labels: mk.map(monthLabel), system: mk.map(m => sys[m] || 0), technician: mk.map(m => tec[m] || 0), periods: mk, range_label: 'last 6 months' },
      service_incident: Object.entries(svc).map(([label, value]) => ({ label, value })),
      group_distribution: top(countBy(rows, 'Group'), 20),
      priority_distribution: ['Low', 'Medium', 'High', 'Critical'].map(l => ({ label: l, value: rows.filter(r => r.Priority === l).length })),
      daily_trend: { labels: days.map(d => new Date(d).toLocaleString('en-US', { day: '2-digit', month: 'short' })), values: days.map(d => byDay[d] || 0), days, range_label: 'last 30 days' },
      top_technicians: top(countBy(rows, 'Technician')),
      top_sites: top(countBy(rows, 'Site')),
      top_categories: top(countBy(rows, 'Category')),
      top_departments: top(countBy(rows, 'Department')),
      top_requesters: top(countBy(rows, 'Requester')),
      top_overdue: top(countBy(overdue, 'Technician')),
      top_fastest_technicians: fastest(rows, false).slice(0, 10),
      top_rated_technicians: rated(rows, 'Technician', false).slice(0, 10),
      lowest_rated_requesters: rated(rows, 'Requester', true).slice(0, 10),
      errors: {},
    };
  };

  const TITLES = { technician: 'Technicians by Ticket Count', site: 'Sites', category: 'Categories', department: 'Departments', requester: 'Requesters', overdue_technician: 'Most Overdue Technicians', technician_fastest: 'Fastest Technicians vs SLA', technician_highest_rated: 'Highest Rated Technicians', requester_lowest_rated: 'Least Satisfied Requesters', group: 'Groups' };
  D.routes.ranking_full = (params) => {
    const dim = params.get('dim') || 'technician';
    const rows = filter(params);
    const col = { technician: 'Technician', site: 'Site', category: 'Category', department: 'Department', requester: 'Requester', group: 'Group' }[dim];
    let out;
    if (dim === 'overdue_technician') out = top(countBy(rows.filter(r => r._overdue), 'Technician'), 999);
    else if (dim === 'technician_fastest') out = fastest(rows, true);
    else if (dim === 'technician_highest_rated') out = rated(rows, 'Technician', false);
    else if (dim === 'requester_lowest_rated') out = rated(rows, 'Requester', true);
    else out = top(countBy(rows, col || 'Technician'), 999);
    return { title: TITLES[dim] || 'Ranking', rows: out };
  };

  D.routes.tickets_data = (params) => {
    let rows = filter(params);
    const sort = params.get('sort') || 'CreatedTime', dir = params.get('dir') === 'ASC' ? 1 : -1;
    rows = rows.slice().sort((a, b) => (String(a[sort]) > String(b[sort]) ? 1 : -1) * dir);
    const per = Number(params.get('per_page') || 50), page = Number(params.get('page') || 1);
    return { rows: rows.slice((page - 1) * per, page * per).map(clean), total: rows.length, page, per_page: per, total_pages: Math.max(1, Math.ceil(rows.length / per)) };
  };
  function clean(t) { const o = {}; Object.keys(t).forEach(k => { if (k[0] !== '_') o[k] = t[k]; }); return o; }
  D.routes.ticket_detail = (params) => {
    const t = tickets.find(x => x.RequestID === params.get('id'));
    if (!t) return { __status: 404, error: 'Ticket not found' };
    return { ...clean(t), 'Created By': t._createdBy === 'system' ? 'System (email)' : 'Technician', 'Overdue': t._overdue ? 'TRUE' : 'FALSE', 'Resolution Time': `${t._resolvedHours} h (${t._usedPct}% of SLA)`, 'First Response Overdue': t._fro ? 'TRUE' : 'FALSE', 'Reopened': t._reopened ? 'TRUE' : 'FALSE', 'VIP': t._vip ? 'TRUE' : 'FALSE', 'Subject': `${t.SubCategory}: ${t.Category.toLowerCase()} request` };
  };

  D.routes.technician_data = (params) => {
    const name = params.get('name') || TECHS[0];
    const mine = tickets.filter(t => t.Technician === name);
    const mk = monthKeys(6);
    const ratedMine = mine.filter(t => t.SurveyScore);
    const avgRating = ratedMine.length ? ratedMine.reduce((a, t) => a + +t.SurveyScore, 0) / ratedMine.length : 0;
    const avgPct = mine.reduce((a, t) => a + t._usedPct, 0) / (mine.length || 1);
    const onTime = 100 - mine.filter(t => t._overdue).length / (mine.length || 1) * 100;
    const maxVol = Math.max(...TECHS.map(n => tickets.filter(t => t.Technician === n).length));
    const ratings = TECHS.map(n => { const r = tickets.filter(t => t.Technician === n && t.SurveyScore); return r.length ? r.reduce((a, t) => a + +t.SurveyScore, 0) / r.length : 0; });
    return {
      kpis: [
        { label: 'Total Tickets', value: mine.length, format: 'number' },
        { label: 'Resolved', value: mine.filter(t => t.RequestStatus === 'Closed' || t.RequestStatus === 'Resolved').length, format: 'number' },
        { label: 'Overdue', value: mine.filter(t => t._overdue).length, format: 'number' },
        { label: 'On-Time Rate', value: `${onTime.toFixed(1)}%`, format: 'text', link: false },
        { label: 'Avg % of SLA Used', value: `${Math.round(avgPct)}%`, format: 'text', link: false },
        { label: 'Avg Rating', value: ratedMine.length ? `${avgRating.toFixed(2)} ★` : '—', format: 'text', link: false },
      ],
      radar: {
        labels: ['Volume', 'Speed vs SLA', 'On-Time Rate', 'Rating', 'First Response'],
        values: [Math.round(mine.length / maxVol * 100), Math.max(0, Math.round(150 - avgPct)), Math.round(onTime), Math.round(avgRating / Math.max(...ratings) * 100), Math.round(100 - mine.filter(t => t._fro).length / (mine.length || 1) * 100 * 3)],
        captions: ['Volume: tickets handled, relative to the busiest technician you can see.', 'Speed: average share of each ticket\'s own SLA used (less is better).', 'On-time: tickets closed within their SLA.', 'Rating: average survey score, relative to the best-rated technician.', 'First response: tickets answered within the first-response target.'],
      },
      monthly_trend: { labels: mk.map(monthLabel), resolved: mk.map(m => mine.filter(t => t.CreatedTime.startsWith(m)).length), rating: mk.map(m => { const r = mine.filter(t => t.CreatedTime.startsWith(m) && t.SurveyScore); return r.length ? +(r.reduce((a, t) => a + +t.SurveyScore, 0) / r.length).toFixed(2) : null; }) },
      errors: {},
    };
  };
})();
