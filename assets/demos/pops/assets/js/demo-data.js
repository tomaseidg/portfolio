/* Printer Ops Console: sample data only. */
(function () {
  const D = window.DEMO; D.app = 'pops';
  D.pages = ['index', 'printers', 'printer_detail', 'reports', 'alerts'];
  const T = D.ts;
  const COST_PER_PAGE = 0.02;

  const base = [
    ['Finance 2F', 'HP LaserJet M507', 'Head Office', 'Main Building', '2nd Floor', 'Finance', 'Company A', 'CC-1010', 'active', 1, 64, null, 418230],
    ['Reception', 'HP Color LaserJet M454', 'Head Office', 'Main Building', 'Ground Floor', 'Administration', 'Company A', 'CC-1001', 'active', 1, 52, [61, 48, 70], 96410],
    ['HR Office', 'HP LaserJet M428', 'Head Office', 'Main Building', '3rd Floor', 'Human Resources', 'Company A', 'CC-1020', 'active', 1, 9, null, 211044],
    ['Procurement', 'HP LaserJet M507', 'Head Office', 'Annex', '1st Floor', 'Procurement', 'Company A', 'CC-1030', 'active', 1, 37, null, 154872],
    ['IT Service Desk', 'HP LaserJet M404', 'Head Office', 'Annex', 'Ground Floor', 'IT', 'Company A', 'CC-1040', 'active', 1, 81, null, 63390],
    ['Customer Service', 'HP LaserJet M507', 'North Campus', 'Building A', 'Ground Floor', 'Customer Service', 'Company B', 'CC-3010', 'active', 1, 41, null, 287560],
    ['Operations', 'HP LaserJet M507', 'North Campus', 'Building A', '1st Floor', 'Operations', 'Company B', 'CC-3020', 'active', 1, 23, null, 342118],
    ['Quality Office', 'HP LaserJet M428', 'North Campus', 'Building B', '2nd Floor', 'Quality', 'Company B', 'CC-3020', 'active', 0, 58, null, 129904],
    ['Accounts', 'HP LaserJet M404', 'North Campus', 'Building B', 'Ground Floor', 'Finance', 'Company B', 'CC-3030', 'active', 1, 12, null, 98765],
    ['Sales', 'HP LaserJet M428', 'East Branch', 'Main Building', 'Ground Floor', 'Sales', 'Company C', 'CC-2010', 'active', 1, 77, null, 176210],
    ['Logistics', 'HP LaserJet M404', 'East Branch', 'Warehouse', '1st Floor', 'Logistics', 'Company C', 'CC-2020', 'active', 1, 88, null, 41220],
    ['Events', 'HP Color LaserJet M454', 'East Branch', 'Main Building', '1st Floor', 'Marketing', 'Company C', 'CC-2030', 'active', 1, 46, [33, 52, 29], 58830],
    ['Sales 2', 'HP LaserJet M428', 'West Branch', 'Main Building', 'Ground Floor', 'Sales', 'Company C', 'CC-2110', 'active', 1, 69, null, 132470],
    ['Facilities', 'HP LaserJet M404', 'West Branch', 'Service Block', 'Ground Floor', 'Facilities', 'Company C', 'CC-2120', 'maintenance', null, null, null, 75310],
    ['Training', 'HP LaserJet M507', 'West Branch', 'Training Center', '1st Floor', 'Training', 'Company C', 'CC-2130', 'active', null, null, null, null],
    ['New Wing', 'HP LaserJet M507', 'North Campus', 'Building C', '1st Floor', 'Operations', 'Company B', 'CC-3020', 'installing', null, null, null, null],
  ];
  const ABBR = ['FIN-2F', 'RCPT', 'HR-3F', 'PROC', 'ITSD', 'CS', 'OPS', 'QA', 'ACCT', 'SALES', 'LOG', 'EVENT', 'SALES2', 'FAC', 'TRN', 'WING-C'];
  const printers = base.map((r, i) => {
    const [name, model, site, building, floor, dept, company, cc, status, online, k, cmy, pages] = r;
    const id = i + 1;
    const lastPoll = online === null ? null : T(D.int(2, 14));
    return {
      id, name: `PRN-${{ 'Head Office': 'HO', 'North Campus': 'NC', 'East Branch': 'EB', 'West Branch': 'WB' }[site]}-${ABBR[i]}`, display: name,
      ip_address: `10.10.${10 + Math.floor(i / 6)}.${21 + i * 3}`,
      hostname: `prn-${name.toLowerCase().replace(/\W+/g, '-')}.corp.example`,
      model, serial_number: `VNB3R${String(40000 + i * 731).slice(0, 5)}${'ABCDEFGHJK'[i % 10]}`,
      site, building, floor, department: dept, company, cost_center: cc, status,
      is_online: status === 'active' ? online : null,
      black_toner_pct: k, cyan_toner_pct: cmy ? cmy[0] : null, magenta_toner_pct: cmy ? cmy[1] : null, yellow_toner_pct: cmy ? cmy[2] : null,
      total_page_count: pages, last_polled_at: lastPoll, last_poll_attempt_at: lastPoll,
      last_seen_online_at: online === 1 ? T(1) : (online === 0 ? T(190) : null),
      consecutive_failures: online === 0 ? 12 : 0,
      start_date: D.day(400 + i * 9), start_page: pages ? Math.round(pages * 0.18) : 0,
      created_at: T(60 * 24 * (status === 'installing' ? 1 : 300)), added_by_name: i % 3 ? 'Ahmed Reda' : 'Sara Hassan',
      notes: i === 2 ? 'Toner order placed with the leasing company.' : '',
    };
  });
  let nextId = printers.length + 1;

  const uniq = (k) => [...new Set(printers.map(p => p[k]).filter(Boolean))].sort();
  const pages30 = (p) => p.total_page_count ? Math.round(p.total_page_count * (0.012 + (p.id % 5) * 0.004)) : 0;
  const monthPages = (p) => Math.round(pages30(p) * 0.9);

  function arr(params, k) { return params.getAll(k + '[]'); }
  function filtered(params) {
    const q = (params.get('search') || '').toLowerCase();
    return printers.filter(p =>
      ['site', 'building', 'department', 'company', 'cost_center', 'status'].every(k => { const v = arr(params, k); return !v.length || v.includes(p[k]); })
      && (!q || [p.name, p.ip_address, p.hostname, p.serial_number, p.model].join(' ').toLowerCase().includes(q)));
  }

  D.routes.dashboard_data = () => {
    const active = printers.filter(p => p.status === 'active');
    const statusCount = {}; printers.forEach(p => statusCount[p.status] = (statusCount[p.status] || 0) + 1);
    const bySite = {}; printers.forEach(p => bySite[p.site] = (bySite[p.site] || 0) + 1);
    const ranked = active.filter(p => p.total_page_count).map(p => [p.name, pages30(p)]).sort((a, b) => b[1] - a[1]);
    const cc = {}; active.forEach(p => { if (p.total_page_count) cc[p.cost_center] = (cc[p.cost_center] || 0) + monthPages(p); });
    const ccKeys = Object.keys(cc).sort((a, b) => cc[b] - cc[a]);
    return {
      kpis: [
        { label: 'Total Printers', value: printers.length },
        { label: 'Active', value: active.length },
        { label: 'Online Now', value: active.filter(p => p.is_online == 1).length },
        { label: 'Offline', value: active.filter(p => p.is_online == 0).length, warn: true },
        { label: 'Low Toner', value: active.filter(p => p.black_toner_pct !== null && p.black_toner_pct < 15).length, warn: true },
        { label: 'Pages (30 days)', value: ranked.reduce((a, r) => a + r[1], 0) },
      ],
      status_distribution: Object.entries(statusCount).map(([status, c]) => ({ status, c })),
      by_site: Object.entries(bySite).map(([site, c]) => ({ site, c })),
      pages_by_printer_30d: { labels: ranked.map(r => r[0]), values: ranked.map(r => r[1]) },
      cost_by_cost_center_month: { labels: ccKeys, pages: ccKeys.map(k => cc[k]), costs: ccKeys.map(k => +(cc[k] * COST_PER_PAGE).toFixed(2)) },
      attention_list: active.filter(p => p.is_online == 0 || (p.black_toner_pct !== null && p.black_toner_pct < 15)),
    };
  };

  D.routes.printers_meta = () => ({
    sites: uniq('site'), buildings: uniq('building'), departments: uniq('department'), companies: uniq('company'), cost_centers: uniq('cost_center'),
    can_edit: true, can_delete: true, poll_interval_minutes: 15,
    printer_list: printers.map(p => ({ id: p.id, name: p.name })),
  });

  D.routes.printers_data = (params) => {
    const rows = filtered(params);
    const per = Number(params.get('per_page') || 25), page = Number(params.get('page') || 1);
    return { rows: rows.slice((page - 1) * per, page * per), total: rows.length, total_pages: Math.max(1, Math.ceil(rows.length / per)), page, per_page: per };
  };

  D.routes.printer_save = (params, body) => {
    if (!body.name || !body.ip_address) return { __status: 422, error: 'Name and IP address are required.' };
    if (body.id) { Object.assign(printers.find(p => p.id === body.id), body); }
    else printers.unshift(Object.assign({ id: nextId++, is_online: null, black_toner_pct: null, cyan_toner_pct: null, magenta_toner_pct: null, yellow_toner_pct: null, total_page_count: null, last_polled_at: null, created_at: T(0), added_by_name: 'Demo User', model: null, serial_number: null, hostname: null }, body));
    return { ok: true };
  };
  D.routes.printer_delete = (params, body) => { const i = printers.findIndex(p => p.id === body.id); if (i >= 0) printers.splice(i, 1); return { ok: true }; };

  D.routes.printer_history = (params) => {
    const p = printers.find(x => x.id === Number(params.get('id'))) || printers[0];
    const period = params.get('period') || 'week';
    const points = period === 'day' ? 24 : period === 'week' ? 28 : 30;
    const stepMin = period === 'day' ? 60 : period === 'week' ? 360 : 1440;
    const perStep = Math.max(1, Math.round(pages30(p) / (30 * 1440 / stepMin)));
    let count = (p.total_page_count || 0) - perStep * points, toner = Math.min(100, (p.black_toner_pct || 40) + Math.round(points * 0.35));
    const readings = [];
    for (let i = points; i > 0; i--) {
      count += perStep + D.int(0, Math.round(perStep * 0.4));
      toner = Math.max(p.black_toner_pct || 1, toner - (D.rand() > 0.6 ? 1 : 0));
      readings.push({ recorded_at: T(i * stepMin), black_toner_pct: toner, cyan_toner_pct: p.cyan_toner_pct, magenta_toner_pct: p.magenta_toner_pct, yellow_toner_pct: p.yellow_toner_pct, total_page_count: count, response_ms: D.int(4, 38) });
    }
    if (!p.total_page_count) readings.length = 0;
    const start = readings.length ? readings[0].total_page_count : null, end = readings.length ? readings[readings.length - 1].total_page_count : null;
    return { printer: p, usage: { pages_used: start !== null ? end - start : null, pages_start: start, pages_end: end }, uptime_pct: p.is_online == 0 ? 71.4 : 99.6, readings, poll_interval_minutes: 15 };
  };

  D.routes.reports_data = (params) => {
    const rows = filtered(params).map(p => {
      const used = p.total_page_count ? monthPages(p) : null;
      return { ...p, pages_start: used !== null ? p.total_page_count - used : null, pages_end: p.total_page_count, pages_used: used, cost_egp: used !== null ? +(used * COST_PER_PAGE).toFixed(2) : null };
    });
    return { rows, total_pages: rows.reduce((a, r) => a + (r.pages_used || 0), 0), total_cost_egp: rows.reduce((a, r) => a + (r.cost_egp || 0), 0) };
  };

  D.routes.alerts_data = () => {
    const active = printers.filter(p => p.status === 'active');
    return {
      offline: active.filter(p => p.is_online == 0),
      low_toner: active.filter(p => p.black_toner_pct !== null && p.black_toner_pct < 15),
      never_polled: active.filter(p => p.is_online === null),
    };
  };
})();
