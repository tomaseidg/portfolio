const STEP_TEMPLATES = {"Laptop": [["Unbox and check the contents against the delivery note (unit, power adapter, cables, accessories)", "Hardware Inspection", 10, 10], ["Record the serial number, model and asset tag, and confirm they match the delivery note", "Hardware Inspection", 11, 6], ["Inspect the chassis, ports and casing for cracks, dents or shipping damage", "Hardware Inspection", 12, 6], ["Connect to the corporate network and confirm the device receives an address from DHCP", "Network & Connectivity", 20, 6], ["Record the MAC address, and reserve a fixed address if this device needs one", "Network & Connectivity", 21, 6], ["Install or refresh the standard Windows image and apply every pending update", "Operating System & Domain", 30, 45], ["Confirm the firmware is on the approved version, and set the boot order, Secure Boot and TPM", "Operating System & Domain", 31, 15], ["Set the computer name to the naming standard and confirm it is not already in use", "Operating System & Domain", 32, 8], ["Install the endpoint protection agent and confirm it reports in to the management console", "Security & Endpoint Protection", 40, 12], ["Enable disk encryption and confirm the recovery key is escrowed where it can be found again", "Security & Endpoint Protection", 41, 15], ["Install Microsoft Office and activate the licence assigned to this user (E1 or E3)", "Base Applications & Office", 50, 25], ["Sign in to Outlook, confirm the mailbox syncs and apply the standard signature template", "Base Applications & Office", 51, 15], ["Install every application on this department's software list", "Department Software", 60, 30], ["Restart twice and confirm the device comes up clean, with no pending restart and no errors", "Handover & Sign-off", 80, 10], ["Record the device against the end user in the asset register", "Handover & Sign-off", 81, 8], ["Record the battery design capacity, full-charge capacity and the health percentage", "Battery & Power", 310, 10], ["Charge to 100% and confirm the charge indicator, the adapter wattage and the charging port", "Battery & Power", 311, 15], ["Dock and undock twice, confirming the monitors, network and USB devices reconnect each time", "Peripherals & Docking", 320, 12]], "Desktop": [["Unbox and check the contents against the delivery note (unit, power adapter, cables, accessories)", "Hardware Inspection", 10, 10], ["Record the serial number, model and asset tag, and confirm they match the delivery note", "Hardware Inspection", 11, 6], ["Inspect the chassis, ports and casing for cracks, dents or shipping damage", "Hardware Inspection", 12, 6], ["Connect to the corporate network and confirm the device receives an address from DHCP", "Network & Connectivity", 20, 6], ["Record the MAC address, and reserve a fixed address if this device needs one", "Network & Connectivity", 21, 6], ["Install or refresh the standard Windows image and apply every pending update", "Operating System & Domain", 30, 45], ["Confirm the firmware is on the approved version, and set the boot order, Secure Boot and TPM", "Operating System & Domain", 31, 15], ["Set the computer name to the naming standard and confirm it is not already in use", "Operating System & Domain", 32, 8], ["Install the endpoint protection agent and confirm it reports in to the management console", "Security & Endpoint Protection", 40, 12], ["Enable disk encryption and confirm the recovery key is escrowed where it can be found again", "Security & Endpoint Protection", 41, 15], ["Install Microsoft Office and activate the licence assigned to this user (E1 or E3)", "Base Applications & Office", 50, 25], ["Sign in to Outlook, confirm the mailbox syncs and apply the standard signature template", "Base Applications & Office", 51, 15], ["Install every application on this department's software list", "Department Software", 60, 30], ["Restart twice and confirm the device comes up clean, with no pending restart and no errors", "Handover & Sign-off", 80, 10], ["Record the device against the end user in the asset register", "Handover & Sign-off", 81, 8], ["Connect and test the keyboard, mouse, monitor cables and speakers at the desk", "Peripherals & Docking", 420, 10]], "All-in-One": [["Unbox and check the contents against the delivery note (unit, power adapter, cables, accessories)", "Hardware Inspection", 10, 10], ["Record the serial number, model and asset tag, and confirm they match the delivery note", "Hardware Inspection", 11, 6], ["Inspect the chassis, ports and casing for cracks, dents or shipping damage", "Hardware Inspection", 12, 6], ["Connect to the corporate network and confirm the device receives an address from DHCP", "Network & Connectivity", 20, 6], ["Record the MAC address, and reserve a fixed address if this device needs one", "Network & Connectivity", 21, 6], ["Install or refresh the standard Windows image and apply every pending update", "Operating System & Domain", 30, 45], ["Confirm the firmware is on the approved version, and set the boot order, Secure Boot and TPM", "Operating System & Domain", 31, 15], ["Set the computer name to the naming standard and confirm it is not already in use", "Operating System & Domain", 32, 8], ["Install the endpoint protection agent and confirm it reports in to the management console", "Security & Endpoint Protection", 40, 12], ["Enable disk encryption and confirm the recovery key is escrowed where it can be found again", "Security & Endpoint Protection", 41, 15], ["Install Microsoft Office and activate the licence assigned to this user (E1 or E3)", "Base Applications & Office", 50, 25], ["Sign in to Outlook, confirm the mailbox syncs and apply the standard signature template", "Base Applications & Office", 51, 15], ["Install every application on this department's software list", "Department Software", 60, 30], ["Restart twice and confirm the device comes up clean, with no pending restart and no errors", "Handover & Sign-off", 80, 10], ["Record the device against the end user in the asset register", "Handover & Sign-off", 81, 8], ["Connect and test the keyboard, mouse, monitor cables and speakers at the desk", "Peripherals & Docking", 420, 10]], "Monitor": [["Unbox and check the contents against the delivery note (panel, stand, power adapter, cables)", "Hardware Inspection", 101, 8], ["Record the serial number and apply the asset tag", "Hardware Inspection", 102, 5], ["Inspect the panel, bezel and casing for cracks, scratches or shipping damage", "Hardware Inspection", 103, 6], ["Power on and confirm the self-test image and the on-screen menu both appear", "Display Quality", 110, 5], ["Dead and stuck pixel check: full-screen white, black, red, green and blue", "Display Quality", 111, 10], ["Check backlight bleed, corner clouding and brightness uniformity on a black screen", "Display Quality", 112, 8], ["Connect using the correct cable for the port in use and confirm the link is stable", "Mounting & Cabling", 120, 6], ["Mount on the desk, monitor arm or VESA bracket and confirm it is stable and level", "Mounting & Cabling", 121, 12], ["Test on the end user's own computer, including the second output if this is a dual-head setup", "Network & Connectivity", 130, 10], ["Clean the panel and casing", "Handover & Sign-off", 140, 5]], "Printer": [["Unbox and check the contents against the delivery note (printer, trays, power cable, consumables)", "Hardware Inspection", 201, 10], ["Record the serial number and apply the asset tag", "Hardware Inspection", 202, 5], ["Install the toner, ink or drum and remove every shipping seal and tape", "Consumables", 210, 10], ["Record the consumable model numbers so reordering does not need the printer opened again", "Consumables", 211, 5], ["Connect by network or USB as planned for this location", "Network & Connectivity", 220, 6], ["Assign the reserved static IP or DHCP reservation and record it on the device record", "Network & Connectivity", 221, 10], ["Install the manufacturer driver on the print server", "Drivers & Print Queue", 230, 12], ["Create and share the print queue using the agreed naming convention", "Drivers & Print Queue", 231, 10], ["Print a test page and check alignment, density and that there is no streaking or banding", "Print & Scan Quality", 240, 8], ["Print a duplex test and confirm the orientation is right on both sides", "Print & Scan Quality", 241, 6], ["Show the user how to load paper, replace a consumable and clear a paper jam", "Handover & Sign-off", 250, 10]]};
const TYPE_ICONS = {"Laptop": ["M4 4h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 16H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 4zm.5 1.8v7.4h15V5.8h-15z", "M1 17.5h22l-1.1 1.9a1.4 1.4 0 0 1-1.2.7H3.3a1.4 1.4 0 0 1-1.2-.7L1 17.5z"], "Desktop": ["M6.5 2h11A1.5 1.5 0 0 1 19 3.5v17a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zm1.3 1.8v16.4h8.4V3.8H7.8z", "M12 5.2a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z", "M9.2 9.9h5.6v1.3H9.2V9.9zm0 2.5h5.6v1.3H9.2v-1.3zm0 2.5h5.6v1.3H9.2v-1.3z"], "All-in-One": ["M2.5 2.6h19A1.5 1.5 0 0 1 23 4.1v12.4a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 16.5V4.1a1.5 1.5 0 0 1 1.5-1.5zm.5 1.8v9.1h18V4.4H3z", "M12 14.7a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9z", "M9.5 19.3h5v1.4H18V22H6v-1.3h3.5v-1.4z"], "Monitor": ["M2.5 3.5h19A1.5 1.5 0 0 1 23 5v10.5a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 15.5V5a1.5 1.5 0 0 1 1.5-1.5zm.5 1.8v9.4h18V5.3H3z", "M10.4 18.3h3.2v1.9h3.3V22H7.1v-1.8h3.3v-1.9z"], "Printer": ["M7 2h10v4.2H7V2zm1.8 1.8v0.6h6.4V3.8H8.8z", "M4 7.2h16A2.6 2.6 0 0 1 22.6 9.8v4.9a1.4 1.4 0 0 1-1.4 1.4h-2.4v-2.6H5.2v2.6H2.8a1.4 1.4 0 0 1-1.4-1.4V9.8A2.6 2.6 0 0 1 4 7.2zm14.1 2.3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z", "M7 15.1h10V22H7v-6.9zm1.8 1.8v3.3h6.4v-3.3H8.8z"]};
/* L-CONFIG PRO: sample devices only. State is kept in sessionStorage so a device
   finished in the technician view shows up in the auditor and manager views. */
(function () {
  const D = window.DEMO; D.app = 'dconfig';
  D.pages = ['technician', 'technician_device', 'auditor', 'auditor_device', 'manager'];
  const T = D.ts;

  const CAT_ORDER = ['Hardware Inspection', 'Battery & Power', 'Display Quality', 'Mounting & Cabling', 'Consumables', 'Network & Connectivity', 'Operating System & Domain', 'Security & Endpoint Protection', 'Base Applications & Office', 'Department Software', 'Drivers & Print Queue', 'Print & Scan Quality', 'Peripherals & Docking', 'Handover & Sign-off'];
  const SPEC_LABELS = { spec_ram_gb: 'RAM (GB)', spec_cpu: 'Processor (CPU)', storage_type: 'Storage Type', storage_gb: 'Storage (GB)', gpu_model: 'Graphics (GPU)', spec_screen_inch: 'Screen Size (inch)', screen_resolution: 'Resolution', panel_type: 'Panel Type', has_fingerprint: 'Fingerprint reader', has_touch: 'Touch screen', form_factor: 'Form Factor', os_version: 'Operating System', connection_type: 'Connection', ip_address: 'IP Address', mac_address: 'MAC Address', printer_kind: 'Printer Type', is_color: 'Colour printing', supports_duplex: 'Duplex (double-sided)', consumable_model: 'Toner / Cartridge Model' };
  const SPEC_OPTIONS = { storage_type: ['M.2 NVMe SSD', 'M.2 SATA SSD', '2.5" SATA SSD', '2.5" SATA HDD', '3.5" SATA HDD', 'eMMC', 'M.2 SSD + 2.5" HDD'], form_factor: ['Tower', 'Small Form Factor', 'Mini PC', 'Workstation'], panel_type: ['IPS', 'VA', 'TN', 'OLED', 'Other'], connection_type: ['HDMI', 'DisplayPort', 'USB-C', 'DVI', 'VGA', 'Network (Ethernet)', 'Wi-Fi', 'USB'], printer_kind: ['Laser', 'Inkjet', 'Multifunction (MFP)', 'Thermal', 'Dot Matrix'] };
  const SHARED_SPEC = ['spec_ram_gb', 'spec_cpu', 'storage_type', 'storage_gb', 'gpu_model', 'os_version', 'mac_address'];
  const SHARED_CATS = ['Hardware Inspection', 'Network & Connectivity', 'Operating System & Domain', 'Security & Endpoint Protection', 'Base Applications & Office', 'Department Software', 'Peripherals & Docking', 'Handover & Sign-off'];
  const ordSpec = (a) => Object.keys(SPEC_LABELS).filter(k => a.includes(k));
  const ordCat = (a) => CAT_ORDER.filter(k => a.includes(k));
  const TYPES = [
    { key: 'Laptop', label: 'Laptop', plural: 'Laptops', blurb: 'Portable machine - battery, docking, full OS and application build', accent: '#22d3c0', group: 'Computer', name_label: 'Computer Name', name_hint: 'e.g. LT-0123', gate_checks: ['ram', 'screen', 'fingerprint', 'touch'], spec_fields: [...SHARED_SPEC, 'spec_screen_inch', 'has_fingerprint', 'has_touch'], categories: [...SHARED_CATS, 'Battery & Power'] },
    { key: 'Desktop', label: 'Desktop', plural: 'Desktops', blurb: 'Tower or small-form-factor PC - no built-in screen, external monitor', accent: '#60a5fa', group: 'Computer', name_label: 'Computer Name', name_hint: 'e.g. PC-0456', gate_checks: ['ram'], spec_fields: [...SHARED_SPEC, 'form_factor', 'ip_address'], categories: SHARED_CATS },
    { key: 'All-in-One', label: 'All-in-One', plural: 'All-in-One PCs', blurb: 'Screen and computer in one chassis - panel checks plus the full build', accent: '#f472b6', group: 'Computer', name_label: 'Computer Name', name_hint: 'e.g. AIO-0789', gate_checks: ['ram', 'screen', 'fingerprint', 'touch'], spec_fields: [...SHARED_SPEC, 'spec_screen_inch', 'screen_resolution', 'panel_type', 'has_fingerprint', 'has_touch'], categories: [...SHARED_CATS, 'Display Quality'] },
    { key: 'Monitor', label: 'Monitor', plural: 'Monitors', blurb: 'External display - panel, image quality, cabling and mounting', accent: '#a78bfa', group: null, name_label: 'Monitor Asset Tag / Label', name_hint: 'e.g. MON-0456', gate_checks: [], spec_fields: ['spec_screen_inch', 'screen_resolution', 'panel_type', 'connection_type'], categories: ['Hardware Inspection', 'Display Quality', 'Mounting & Cabling', 'Network & Connectivity', 'Handover & Sign-off'] },
    { key: 'Printer', label: 'Printer', plural: 'Printers', blurb: 'Printer or MFP - network queue, drivers, output quality and consumables', accent: '#f5a623', group: null, name_label: 'Printer Name / Hostname', name_hint: 'e.g. PRN-HQ-01', gate_checks: [], spec_fields: ['printer_kind', 'is_color', 'supports_duplex', 'connection_type', 'ip_address', 'mac_address', 'consumable_model'], categories: ['Hardware Inspection', 'Consumables', 'Network & Connectivity', 'Drivers & Print Queue', 'Print & Scan Quality', 'Handover & Sign-off'] },
  ].map(t => ({ ...t, selectable: true, members: [], spec_gate: t.gate_checks.length > 0, icon: TYPE_ICONS[t.key], spec_fields: ordSpec(t.spec_fields), categories: ordCat(t.categories) }));
  const comp = TYPES.filter(t => t.group === 'Computer');
  TYPES.push({ key: 'Computer', label: 'Computer', plural: 'Computers', blurb: 'Any computer - laptop, desktop or all-in-one', accent: '#93a3bd', name_label: 'Computer Name', name_hint: 'e.g. LT-0123', selectable: false, group: null, members: comp.map(t => t.key), spec_gate: true, gate_checks: ['ram', 'screen', 'fingerprint', 'touch'], icon: TYPE_ICONS.Laptop, spec_fields: ordSpec([...new Set(comp.flatMap(t => t.spec_fields))]), categories: ordCat([...new Set(comp.flatMap(t => t.categories))]) });
  const typeOf = (k) => TYPES.find(t => t.key === k) || TYPES[0];

  const DEPTS = [
    { id: 1, name: 'Finance', min_ram_gb: 16, min_cpu: 'Core i5 12th gen', min_screen_inch: 14, requires_fingerprint: 1, requires_touch: 0, office_license: 'E3' },
    { id: 2, name: 'Human Resources', min_ram_gb: 8, min_cpu: 'Core i5', min_screen_inch: 14, requires_fingerprint: 0, requires_touch: 0, office_license: 'E1' },
    { id: 3, name: 'Engineering', min_ram_gb: 16, min_cpu: 'Core i7', min_screen_inch: 15.6, requires_fingerprint: 0, requires_touch: 0, office_license: 'E3' },
    { id: 4, name: 'Marketing', min_ram_gb: 16, min_cpu: 'Core i7', min_screen_inch: 15.6, requires_fingerprint: 0, requires_touch: 1, office_license: 'E3' },
    { id: 5, name: 'Customer Service', min_ram_gb: 8, min_cpu: 'Core i5', min_screen_inch: 14, requires_fingerprint: 0, requires_touch: 0, office_license: 'E1' },
    { id: 6, name: 'Sales', min_ram_gb: 8, min_cpu: 'Core i3', min_screen_inch: 13.3, requires_fingerprint: 0, requires_touch: 0, office_license: 'E1' },
  ];
  const PRESETS = [
    { id: 1, outcome: 'ok', preset_text: 'Done as per the standard' }, { id: 2, outcome: 'ok', preset_text: 'Verified and working' }, { id: 3, outcome: 'ok', preset_text: 'Completed, no issues found' },
    { id: 4, outcome: 'issue', preset_text: 'Part missing from the delivery' }, { id: 5, outcome: 'issue', preset_text: 'Needs replacement' }, { id: 6, outcome: 'issue', preset_text: 'Waiting on the vendor' }, { id: 7, outcome: 'issue', preset_text: 'Escalated to the team lead' },
  ];
  const TECHS = { 2: 'Ahmed Reda', 3: 'Sara Hassan', 4: 'Omar Fathy' };
  const ME = { technician: 2, auditor: 'Mai Ezzat', manager: 'Hany Lotfy' };
  const PROJECTS = [
    { id: 1, name: 'Q4 Laptop Refresh: Finance & HR', description: 'Latitude 5440 batch', is_active: 1 },
    { id: 2, name: 'Customer Service Desktop Rollout', description: 'OptiPlex SFF batch', is_active: 1 },
  ];

  const INPUT_STEPS = {
    Laptop: [['Record the installed memory (open the machine and count the modules fitted)', 'Hardware Inspection', 'number', 'RAM fitted', null, 'GB', 'spec_ram_gb'], ['Record the battery health as a percentage of its design capacity', 'Battery & Power', 'number', 'Battery health', null, '%', null], ['Check whether the screen is a touch panel and record it', 'Hardware Inspection', 'yesno', 'Touch screen', null, null, 'has_touch']],
    Desktop: [['Record the installed memory (open the machine and count the modules fitted)', 'Hardware Inspection', 'number', 'RAM fitted', null, 'GB', 'spec_ram_gb'], ['Record the storage form factor fitted', 'Hardware Inspection', 'choice', 'Storage type', SPEC_OPTIONS.storage_type.join('|'), null, 'storage_type']],
  };
  INPUT_STEPS['All-in-One'] = INPUT_STEPS.Desktop;

  function makeSteps(type, deviceId, nextIdRef) {
    const tmpl = (STEP_TEMPLATES[type] || STEP_TEMPLATES.Laptop).map(([name, cat, sort, sla]) => ({ step_name: name, category: cat, sort_order: sort, sla }));
    (INPUT_STEPS[type] || []).forEach(([name, cat, kind, label, opts, unit, fills], i) => tmpl.push({ step_name: name, category: cat, sort_order: 15 + i, sla: 8, input_kind: kind, input_label: label, input_options: opts, input_unit: unit, input_required: 1, fills_field: fills }));
    tmpl.sort((a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category) || a.sort_order - b.sort_order);
    return tmpl.map(s => ({ id: nextIdRef.n++, device_id: deviceId, step_id: nextIdRef.n, step_name: s.step_name, category: s.category, sort_order: s.sort_order, sla_minutes: s.sla, default_sla: s.sla, status: 'pending', comment_preset_id: null, custom_comment: null, preset_text: null, result_value: null, completed_at: null, completed_by_name: null, audit_status: 'pending', audit_custom_comment: null, input_kind: s.input_kind || null, input_label: s.input_label || null, input_options: s.input_options || null, input_unit: s.input_unit || null, input_required: s.input_required || 0, fills_field: s.fills_field || null }));
  }

  function seed() {
    const ref = { n: 1000 };
    const rows = [
      ['LT-FIN-0412', 'Laptop', 'Dell Latitude 5440', 'In Progress', 1, 'Mona Samir', 2, 1, { spec_ram_gb: 16, spec_cpu: 'Intel Core i5-1345U', storage_type: 'M.2 NVMe SSD', storage_gb: 512, gpu_model: 'Intel Iris Xe', spec_screen_inch: 14, has_fingerprint: 1, has_touch: 0, os_version: 'Windows 11 Pro 24H2', mac_address: '' }, 7, 0.45],
      ['LT-ENG-0377', 'Laptop', 'Dell Latitude 5440', 'Pending Manager Approval', 3, 'Karim Nabil', 2, 1, { spec_ram_gb: 8, spec_cpu: 'Intel Core i5-1335U', storage_type: 'M.2 NVMe SSD', storage_gb: 256, gpu_model: 'Intel Iris Xe', spec_screen_inch: 14, has_fingerprint: 0, has_touch: 0, os_version: 'Windows 11 Pro 24H2' }, 26, 0],
      ['PC-CS-0218', 'Desktop', 'Dell OptiPlex 7010 SFF', 'Rejected By Audit', 5, 'Youssef Adel', 2, 2, { spec_ram_gb: 16, spec_cpu: 'Intel Core i5-13500', storage_type: 'M.2 NVMe SSD', storage_gb: 512, gpu_model: 'Intel UHD 770', form_factor: 'Small Form Factor', os_version: 'Windows 11 Pro 24H2', ip_address: '10.20.5.41', mac_address: '' }, 52, 1],
      ['PC-CS-0219', 'Desktop', 'Dell OptiPlex 7010 SFF', 'Pending Audit', 5, 'Rana Magdy', 2, 2, { spec_ram_gb: 16, spec_cpu: 'Intel Core i5-13500', storage_type: 'M.2 NVMe SSD', storage_gb: 512, gpu_model: 'Intel UHD 770', form_factor: 'Small Form Factor', os_version: 'Windows 11 Pro 24H2', ip_address: '10.20.5.42' }, 30, 1],
      ['MON-HQ-0091', 'Monitor', 'Dell P2423D', 'Completed', 1, 'Mona Samir', 2, null, { spec_screen_inch: 24, screen_resolution: '2560 x 1440', panel_type: 'IPS', connection_type: 'DisplayPort' }, 96, 1],
      ['PRN-HQ-07', 'Printer', 'HP LaserJet Pro M404dn', 'Completed', 2, 'HR Office', 2, null, { printer_kind: 'Laser', is_color: 0, supports_duplex: 1, connection_type: 'Network (Ethernet)', ip_address: '10.20.1.37', mac_address: '3C:52:82:1A:7F:09', consumable_model: 'HP 59A (CF259A)' }, 140, 1],
      ['LT-MKT-0150', 'Laptop', 'Lenovo ThinkPad T14 Gen 4', 'Pending Audit', 4, 'Laila Mostafa', 3, null, { spec_ram_gb: 16, spec_cpu: 'Intel Core i7-1355U', storage_type: 'M.2 NVMe SSD', storage_gb: 512, gpu_model: 'Intel Iris Xe', spec_screen_inch: 14, has_fingerprint: 1, has_touch: 1, os_version: 'Windows 11 Pro 24H2' }, 20, 1],
      ['AIO-SAL-0033', 'All-in-One', 'HP ProOne 440 G9', 'Completed', 6, 'Reception Desk', 3, null, { spec_ram_gb: 8, spec_cpu: 'Intel Core i5-12500T', storage_type: 'M.2 NVMe SSD', storage_gb: 256, gpu_model: 'Intel UHD 770', spec_screen_inch: 23.8, screen_resolution: '1920 x 1080', panel_type: 'IPS', has_fingerprint: 0, has_touch: 0, os_version: 'Windows 11 Pro 23H2' }, 190, 1],
      ['LT-ENG-0208', 'Laptop', 'HP EliteBook 840 G10', 'In Progress', 3, 'Tamer Saleh', 4, null, { spec_ram_gb: 32, spec_cpu: 'Intel Core i7-1365U', storage_type: 'M.2 NVMe SSD', storage_gb: 1024, gpu_model: 'Intel Iris Xe', spec_screen_inch: 15.6, has_fingerprint: 1, has_touch: 0, os_version: 'Windows 11 Pro 24H2' }, 5, 0.7],
      ['PC-FIN-0120', 'Desktop', 'Dell OptiPlex 7010 SFF', 'Completed', 1, 'Hany Lotfy', 4, null, { spec_ram_gb: 16, spec_cpu: 'Intel Core i5-13500', storage_type: 'M.2 NVMe SSD', storage_gb: 512, gpu_model: 'Intel UHD 770', form_factor: 'Small Form Factor', os_version: 'Windows 11 Pro 24H2', ip_address: '10.20.2.18' }, 260, 1],
      ['MON-ENG-0102', 'Monitor', 'Dell P2723D', 'Completed', 3, 'Tamer Saleh', 3, null, { spec_screen_inch: 27, screen_resolution: '2560 x 1440', panel_type: 'IPS', connection_type: 'USB-C' }, 310, 1],
    ];
    const devices = rows.map(([name, type, model, status, deptId, user, techId, projectId, spec, hoursAgo, frac], i) => {
      const id = 101 + i;
      const dept = DEPTS.find(d => d.id === deptId);
      const steps = makeSteps(type, id, ref);
      const nDone = status === 'Completed' || status === 'Pending Audit' ? steps.length : Math.round(steps.length * frac);
      steps.forEach((s, k) => {
        if (k < nDone) { s.status = 'done'; s.comment_preset_id = 2; s.preset_text = 'Verified and working'; s.completed_at = T(hoursAgo * 60 - k * 9); s.completed_by_name = TECHS[techId]; if (s.input_kind) s.result_value = s.fills_field && spec[s.fills_field] !== undefined ? (s.input_kind === 'yesno' ? (spec[s.fills_field] ? 'Yes' : 'No') : String(spec[s.fills_field])) : (s.input_kind === 'number' ? '94' : 'USB-C'); }
        if (status === 'Completed') s.audit_status = 'approved';
      });
      if (status === 'Rejected By Audit') { const bad = steps.find(s => /encryption|recovery key/i.test(s.step_name)) || steps[4]; bad.status = 'pending'; bad.audit_status = 'rejected'; bad.audit_custom_comment = 'Recovery key is not escrowed in AD. Escrow it and resubmit.'; }
      const done = steps.filter(s => s.status === 'done').length;
      const dev = {
        id, computer_name: name, serial_number: `${model.split(' ')[0].slice(0, 2).toUpperCase()}${(7310 + i * 457).toString(36).toUpperCase()}${i}Q`, model, device_type: type, status,
        progress_percentage: +(done / steps.length * 100).toFixed(2), department_id: deptId, department_name: dept.name, end_user_name: user,
        assigned_technician_id: techId, technician_name: TECHS[techId], project_id: projectId, project_name: projectId ? PROJECTS.find(p => p.id === projectId).name : null,
        created_at: T(hoursAgo * 60 + 30), audit_submitted_at: ['Pending Audit', 'Completed', 'Rejected By Audit'].includes(status) ? T(hoursAgo * 60 - 200) : null, completed_at: status === 'Completed' ? T(hoursAgo * 60 - 320) : null,
        min_ram_gb: dept.min_ram_gb, min_cpu: dept.min_cpu, min_screen_inch: dept.min_screen_inch, requires_fingerprint: dept.requires_fingerprint, requires_touch: dept.requires_touch, office_license: dept.office_license,
        spec_meets_requirement: status === 'Pending Manager Approval' ? 0 : 1, declared_spec: projectId ? '16GB / 512GB SSD' : null,
        spec_ram_gb: null, spec_cpu: null, storage_type: null, storage_gb: null, gpu_model: null, spec_screen_inch: null, screen_resolution: null, panel_type: null, has_fingerprint: null, has_touch: null, form_factor: null, os_version: null, connection_type: null, ip_address: null, mac_address: null, printer_kind: null, is_color: null, supports_duplex: null, consumable_model: null,
        steps, exception: null, activity: [],
      };
      Object.assign(dev, spec);
      if (status === 'Pending Manager Approval') dev.exception = { id: 1, device_id: id, status: 'pending', reason: '8 GB fitted, 16 GB required. Upgrade kit on order.', created_at: T(hoursAgo * 60 - 10) };
      const act = [['Ahmed Reda', 'device_started', `${type} registered for ${dept.name}.`, hoursAgo * 60 + 30]];
      if (nDone) act.push([TECHS[techId], 'step_done', `${steps[0].step_name}`, hoursAgo * 60]);
      if (dev.exception) act.push(['System', 'spec_exception_requested', 'Below the department minimum: sent for manager approval.', hoursAgo * 60 - 10]);
      if (dev.audit_submitted_at) act.push(['System', 'submitted_for_audit', 'Every step completed.', hoursAgo * 60 - 200]);
      if (status === 'Rejected By Audit') act.push(['Mai Ezzat', 'audit_rejected', '1 step sent back: recovery key not escrowed.', hoursAgo * 60 - 260]);
      if (status === 'Completed') act.push(['Mai Ezzat', 'audit_approved', 'All steps approved. Ready for handover.', hoursAgo * 60 - 320]);
      dev.activity = act.reverse().map(([a, action, details, m], k) => ({ id: k + 1, actor_name: a, action, details, created_at: T(m) }));
      return dev;
    });
    // Project pool: devices imported from the delivery sheet, not started yet.
    const pool = [];
    for (let i = 0; i < 9; i++) pool.push({ id: 300 + i, project_id: i < 6 ? 1 : 2, device_type: i < 6 ? 'Laptop' : 'Desktop', model: i < 6 ? 'Dell Latitude 5440' : 'Dell OptiPlex 7010 SFF', serial_number: `${i < 6 ? 'DL' : 'OP'}5${(81234 + i * 1913).toString(36).toUpperCase()}`, computer_name: `${i < 6 ? 'LT' : 'PC'}-NEW-${String(500 + i)}` });
    return { devices, pool, nextStep: ref.n, nextDevice: 200 };
  }

  const KEY = 'dconfig-demo-v1';
  let S;
  try { S = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || !S.devices) S = seed();
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  D.resetDemo = () => { try { sessionStorage.removeItem(KEY); } catch (e) {} location.reload(); };

  const find = (id) => S.devices.find(d => d.id === Number(id));
  const brief = (d) => { const o = { ...d }; delete o.steps; delete o.activity; delete o.exception; return o; };
  const log = (d, actor, action, details) => d.activity.unshift({ id: Date.now(), actor_name: actor, action, details, created_at: T(0) });
  function recompute(d) {
    const total = d.steps.length, done = d.steps.filter(s => s.status === 'done').length, issue = d.steps.filter(s => s.status === 'issue').length;
    d.progress_percentage = +(done / total * 100).toFixed(2);
    if (d.status === 'In Progress' && done + issue === total && issue === 0) { d.status = 'Pending Audit'; d.audit_submitted_at = T(0); log(d, 'System', 'submitted_for_audit', 'Every step completed. Sent to the audit queue.'); }
  }
  function meetsSpec(d) {
    const t = typeOf(d.device_type), c = t.gate_checks;
    if (!c.length || !d.department_id) return true;
    if (c.includes('ram') && Number(d.spec_ram_gb) < d.min_ram_gb) return false;
    if (c.includes('screen') && d.spec_screen_inch && Number(d.spec_screen_inch) < d.min_screen_inch) return false;
    if (c.includes('fingerprint') && d.requires_fingerprint && !d.has_fingerprint) return false;
    if (c.includes('touch') && d.requires_touch && !d.has_touch) return false;
    return true;
  }

  D.routes.meta = () => ({ departments: DEPTS, presets: PRESETS, device_types: TYPES, step_scopes: [], category_order: CAT_ORDER, spec_options: SPEC_OPTIONS, spec_labels: SPEC_LABELS });

  D.routes.technician_devices = () => {
    const mine = S.devices.filter(d => d.assigned_technician_id === ME.technician)
      .sort((a, b) => (['In Progress', 'Rejected By Audit', 'Pending Manager Approval'].includes(a.status) ? 0 : 1) - (['In Progress', 'Rejected By Audit', 'Pending Manager Approval'].includes(b.status) ? 0 : 1) || b.id - a.id);
    const byType = {}; TYPES.filter(t => t.selectable).forEach(t => byType[t.key] = 0); mine.forEach(d => byType[d.device_type]++);
    return { devices: mine.map(brief), kpi: { total: mine.length, by_type: byType, active: mine.filter(d => ['In Progress', 'Pending Manager Approval', 'Rejected By Audit'].includes(d.status)).length, completed: mine.filter(d => d.status === 'Completed').length, rejected: mine.filter(d => d.status === 'Rejected By Audit').length } };
  };

  D.routes.device_detail = (p) => { const d = find(p.get('id')) || S.devices[0]; return { device: d }; };

  D.routes.update_step = (p, b) => {
    const d = find(b.device_id); if (!d) return { __status: 404, error: 'Device not found.' };
    if (d.status === 'Pending Manager Approval') return { __status: 409, error: 'This device is below spec for its department. A manager or admin must approve an exception before you can continue.' };
    if (d.status === 'Completed') return { __status: 409, error: 'This device is already completed.' };
    if (!b.comment_preset_id && !b.custom_comment) return { __status: 422, error: 'Please choose a comment or write a custom note.' };
    const s = d.steps.find(x => x.id === b.device_step_id); if (!s) return { __status: 404, error: 'Step not found.' };
    if (s.input_kind && Number(s.input_required) && b.outcome === 'done' && !b.result_value) return { __status: 422, error: `Please record ${s.input_label} before marking this step done.` };
    if (d.status === 'Rejected By Audit') d.status = 'In Progress';
    s.status = b.outcome; s.comment_preset_id = b.comment_preset_id; s.custom_comment = b.custom_comment || null;
    s.preset_text = b.comment_preset_id ? (PRESETS.find(x => x.id === b.comment_preset_id) || {}).preset_text : null;
    s.completed_at = T(0); s.completed_by_name = TECHS[ME.technician]; s.audit_status = 'pending'; s.audit_custom_comment = null;
    if (b.result_value !== undefined) { s.result_value = b.result_value; if (s.fills_field) d[s.fills_field] = s.input_kind === 'number' ? Number(b.result_value) : s.input_kind === 'yesno' ? (b.result_value === 'Yes' ? 1 : 0) : b.result_value; }
    log(d, TECHS[ME.technician], 'step_' + b.outcome, s.step_name + (s.result_value ? ` [${s.input_label}: ${s.result_value}${s.input_unit ? ' ' + s.input_unit : ''}]` : '') + (s.custom_comment ? ' — ' + s.custom_comment : ''));
    recompute(d); save();
    return { success: true, device: d };
  };

  D.routes.request_exception = (p, b) => { const d = find(b.device_id); d.exception = { ...(d.exception || {}), status: 'pending', reason: b.reason, created_at: T(0) }; log(d, TECHS[ME.technician], 'spec_exception_requested', b.reason); save(); return { success: true }; };

  D.routes.auditor_devices = () => {
    const rows = S.devices.filter(d => ['Pending Audit', 'Completed', 'Rejected By Audit'].includes(d.status)).sort((a, b) => (a.status === 'Pending Audit' ? 0 : 1) - (b.status === 'Pending Audit' ? 0 : 1) || b.id - a.id);
    return { devices: rows.map(brief), kpi: { pending: rows.filter(d => d.status === 'Pending Audit').length, completed: rows.filter(d => d.status === 'Completed').length, rejected: rows.filter(d => d.status === 'Rejected By Audit').length } };
  };

  D.routes.submit_audit = (p, b) => {
    const d = find(b.device_id); if (!d || d.status !== 'Pending Audit') return { __status: 409, error: 'This device is not currently awaiting audit.' };
    let rejected = 0;
    b.decisions.forEach(x => { const s = d.steps.find(y => y.id === x.device_step_id); if (!s) return; s.audit_status = x.outcome; s.audit_custom_comment = x.custom_comment || (x.comment_preset_id ? (PRESETS.find(z => z.id === x.comment_preset_id) || {}).preset_text : null); if (x.outcome === 'rejected') { rejected++; s.status = 'pending'; } });
    if (rejected) { d.status = 'Rejected By Audit'; recompute(d); log(d, ME.auditor, 'audit_rejected', `${rejected} step(s) sent back to the technician.`); }
    else { d.status = 'Completed'; d.completed_at = T(0); log(d, ME.auditor, 'audit_approved', 'All steps approved. Ready for handover.'); }
    d.audit_submitted_at = T(0); save();
    return { success: true, rejected: rejected > 0 };
  };

  D.routes.decide_exception = (p, b) => {
    const d = find(b.device_id); if (!d || !d.exception) return { __status: 404, error: 'No pending exception request for this device.' };
    d.exception.status = b.decision; d.exception.decided_at = T(0);
    if (b.decision === 'approved') { d.status = 'In Progress'; log(d, ME.manager, 'spec_exception_approved', 'Below-spec device approved by exception.'); }
    else log(d, ME.manager, 'spec_exception_rejected', 'Exception rejected: replace with a standard device.');
    save(); return { success: true };
  };

  D.routes.admin_projects = () => ({ projects: PROJECTS });

  D.routes.projects = (p, b, method) => {
    const action = p.get('action');
    if (action === 'list') return { projects: PROJECTS.map(pr => { const all = S.devices.filter(d => d.project_id === pr.id); const avail = S.pool.filter(x => x.project_id === pr.id).length; return { ...pr, devices: all.length + avail, available: avail, completed: all.filter(d => d.status === 'Completed').length, working: all.filter(d => d.status !== 'Completed').length, percent_complete: all.length + avail ? all.reduce((a, d) => a + d.progress_percentage, 0) / (all.length + avail) : 0 }; }) };
    if (action === 'devices') { const q = (p.get('search') || '').toLowerCase(); const rows = S.pool.filter(x => x.project_id === Number(p.get('project_id')) && (!q || (x.serial_number + x.model + x.computer_name).toLowerCase().includes(q))); return { devices: rows, total: rows.length, showing: rows.length, truncated: false }; }
    if (action === 'claim') {
      const i = S.pool.findIndex(x => x.id === b.device_id); if (i < 0) return { __status: 409, error: 'Someone else has already started this device.' };
      const x = S.pool.splice(i, 1)[0];
      return start({ device_type: x.device_type, model: x.model, serial_number: x.serial_number, computer_name: b.computer_name || x.computer_name, department_id: b.department_id, end_user_name: b.end_user_name, ram_gb: 16, storage_type: 'M.2 NVMe SSD', storage_gb: 512 }, x.project_id);
    }
    return {};
  };
  function start(b, projectId) {
    const id = S.nextDevice++; const type = b.device_type; const dept = DEPTS.find(x => x.id === b.department_id) || null;
    const ref = { n: S.nextStep }; const steps = makeSteps(type, id, ref); S.nextStep = ref.n;
    const d = { id, computer_name: b.computer_name || `NEW-${id}`, serial_number: b.serial_number || `SN${id}X`, model: b.model || '—', device_type: type, status: 'In Progress', progress_percentage: 0, department_id: dept ? dept.id : null, department_name: dept ? dept.name : null, end_user_name: b.end_user_name || null, assigned_technician_id: ME.technician, technician_name: TECHS[ME.technician], project_id: projectId || null, project_name: projectId ? PROJECTS.find(p => p.id === projectId).name : null, created_at: T(0), audit_submitted_at: null, completed_at: null, min_ram_gb: dept ? dept.min_ram_gb : null, min_cpu: dept ? dept.min_cpu : null, min_screen_inch: dept ? dept.min_screen_inch : null, requires_fingerprint: dept ? dept.requires_fingerprint : 0, requires_touch: dept ? dept.requires_touch : 0, office_license: dept ? dept.office_license : null, declared_spec: projectId ? '16GB / 512GB SSD' : null, spec_ram_gb: b.ram_gb || null, spec_cpu: b.cpu || null, storage_type: b.storage_type || null, storage_gb: b.storage_gb || null, gpu_model: b.gpu_model || null, spec_screen_inch: b.screen_inch || null, screen_resolution: b.screen_resolution || null, panel_type: b.panel_type || null, has_fingerprint: b.fingerprint ? 1 : 0, has_touch: b.touch ? 1 : 0, form_factor: b.form_factor || null, os_version: b.os_version || null, connection_type: b.connection_type || null, ip_address: b.ip_address || null, mac_address: b.mac_address || null, printer_kind: b.printer_kind || null, is_color: b.is_color ? 1 : 0, supports_duplex: b.supports_duplex ? 1 : 0, consumable_model: b.consumable_model || null, steps, exception: null, activity: [] };
    d.spec_meets_requirement = meetsSpec(d) ? 1 : 0;
    log(d, TECHS[ME.technician], 'device_started', `${type} registered${dept ? ' for ' + dept.name : ''}. ${steps.length} checklist steps generated.`);
    if (!d.spec_meets_requirement) { d.status = 'Pending Manager Approval'; d.exception = { id: Date.now(), device_id: id, status: 'pending', reason: 'Below the department minimum specification.', created_at: T(0) }; log(d, 'System', 'spec_exception_requested', 'Below the department minimum: sent for manager approval.'); }
    S.devices.push(d); save();
    return { device_id: id, step_count: steps.length, type_label: typeOf(type).label, device_type: type };
  }
  D.routes.start_device = (p, b) => {
    if (!b.computer_name || !b.serial_number) return { __status: 422, error: 'Name and serial number are required.' };
    return start(b, null);
  };

  D.routes.manager_dashboard = (p) => {
    const q = (p.get('search') || '').toLowerCase(), st = p.get('status'), dep = Number(p.get('department_id')) || 0, ty = p.get('device_type'), pr = Number(p.get('project_id')) || 0;
    const all = S.devices;
    const rows = all.filter(d => (!q || [d.computer_name, d.serial_number, d.technician_name, d.end_user_name, d.model].join(' ').toLowerCase().includes(q)) && (!st || d.status === st) && (!dep || d.department_id === dep) && (!ty || d.device_type === ty) && (!pr || d.project_id === pr));
    const cnt = (f) => all.filter(f).length;
    const by = (k) => { const m = {}; all.forEach(d => { if (d[k]) m[d[k]] = (m[d[k]] || 0) + 1; }); return m; };
    const days = []; for (let i = 13; i >= 0; i--) days.push(D.day(i));
    const daily = days.map(dd => ({ d: dd.slice(5), c: all.filter(x => x.completed_at && x.completed_at.slice(0, 10) === dd).length + [0, 1, 0, 2, 1, 0, 0, 3, 1, 2, 0, 1, 2, 1][days.indexOf(dd)] }));
    const techs = {}; all.forEach(d => { const t = techs[d.technician_name] = techs[d.technician_name] || { full_name: d.technician_name, c: 0, completed: 0 }; t.c++; if (d.status === 'Completed') t.completed++; });
    return {
      kpi: { total: all.length, completed: cnt(d => d.status === 'Completed'), in_progress: cnt(d => d.status === 'In Progress'), pending_audit: cnt(d => d.status === 'Pending Audit'), rejected: cnt(d => d.status === 'Rejected By Audit'), pending_approval: cnt(d => d.status === 'Pending Manager Approval'), avg_hours: 26.4 },
      charts: {
        by_status: Object.entries(by('status')).map(([status, c]) => ({ status, c })),
        by_device_type: TYPES.filter(t => t.selectable).map(t => ({ label: t.plural, accent: t.accent, c: cnt(d => d.device_type === t.key), completed: cnt(d => d.device_type === t.key && d.status === 'Completed') })),
        by_department: Object.entries(by('department_name')).map(([name, c]) => ({ name, c })),
        by_technician: Object.values(techs).sort((a, b) => b.c - a.c),
        daily_completed: daily,
      },
      exceptions: all.filter(d => d.status === 'Pending Manager Approval' && d.exception && d.exception.status === 'pending').map(d => ({ device_id: d.id, computer_name: d.computer_name, serial_number: d.serial_number, department_name: d.department_name, technician_name: d.technician_name, reason: d.exception.reason, created_at: d.exception.created_at })),
      projects: PROJECTS.map(pr => { const ds = all.filter(d => d.project_id === pr.id); const avail = S.pool.filter(x => x.project_id === pr.id).length; const tot = ds.length + avail; return { ...pr, devices: tot, completed: ds.filter(d => d.status === 'Completed').length, working: ds.filter(d => d.status !== 'Completed').length, available: avail, percent_complete: tot ? ds.reduce((a, d) => a + d.progress_percentage, 0) / tot : 0 }; }),
      devices: rows.map(brief),
    };
  };
})();
