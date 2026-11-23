/**
 * NikahPlan Frontend Controller
 * Supports Google Apps Script Web App API + automatic local Demo Mode when API URL is unset.
 */

// Opsional: isi URL Web App Google Apps Script di sini agar semua user langsung terhubung
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxVRx8ozLI8-hRirJWBt5S53w_CO4Zep_470o4k6juu_JLto4-plKLWjXKTyh24a86_/exec';

const STORAGE_KEYS = {
  apiUrl: 'nikahplan_api_url',
  token: 'nikahplan_token',
  user: 'nikahplan_user',
  demoDb: 'nikahplan_demo_db_v1',
};

const state = {
  apiUrl: localStorage.getItem(STORAGE_KEYS.apiUrl) ?? DEFAULT_API_URL,
  token: localStorage.getItem(STORAGE_KEYS.token) || '',
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null'),
  activeTab: 'dashboard',
  data: {
    budgets: [],
    guests: [],
    vendors: [],
    checklists: [],
    rundowns: [],
  },
  modalContext: null,
};

// Schema definitions for dynamic CRUD modals
const MODULE_SCHEMAS = {
  budgets: {
    title: 'Anggaran',
    fields: [
      { key: 'category', label: 'Kategori', type: 'select', options: ['Venue & Dekorasi', 'Catering', 'Busana & MUA', 'Dokumentasi', 'Undangan & Souvenir', 'KUA / Penghulu', 'Lainnya'], required: true },
      { key: 'item', label: 'Nama Item', type: 'text', required: true },
      { key: 'estimated', label: 'Estimasi (Rp)', type: 'currency', default: 0 },
      { key: 'actual', label: 'Biaya Aktual (Rp)', type: 'currency', default: 0 },
      { key: 'paid', label: 'Sudah Dibayar (Rp)', type: 'currency', default: 0 },
      { key: 'status', label: 'Status Pembayaran', type: 'select', options: ['Belum Bayar', 'DP', 'Lunas'], default: 'Belum Bayar' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
  guests: {
    title: 'Tamu Undangan',
    fields: [
      { key: 'name', label: 'Nama Tamu / Keluarga', type: 'text', required: true },
      { key: 'side', label: 'Pihak', type: 'select', options: ['Mempelai Pria', 'Mempelai Wanita', 'Umum'], default: 'Umum' },
      { key: 'group', label: 'Grup', type: 'select', options: ['Keluarga', 'Teman', 'Rekan Kerja', 'VIP'], default: 'Teman' },
      { key: 'pax', label: 'Jumlah (Pax)', type: 'number', min: 1, default: 2 },
      { key: 'rsvp', label: 'Status RSVP', type: 'select', options: ['Belum', 'Hadir', 'Tidak Hadir'], default: 'Belum' },
      { key: 'phone', label: 'No. WhatsApp / HP', type: 'text' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
  vendors: {
    title: 'Vendor',
    fields: [
      { key: 'category', label: 'Kategori', type: 'select', options: ['WO / Planner', 'Venue', 'Catering', 'Dekorasi', 'MUA & Busana', 'Foto & Video', 'Entertainment', 'Lainnya'], required: true },
      { key: 'name', label: 'Nama Vendor', type: 'text', required: true },
      { key: 'pic', label: 'Nama PIC', type: 'text' },
      { key: 'phone', label: 'Kontak / IG', type: 'text' },
      { key: 'price', label: 'Harga Paket (Rp)', type: 'currency', default: 0 },
      { key: 'dp_paid', label: 'DP Terbayar (Rp)', type: 'currency', default: 0 },
      { key: 'status', label: 'Status', type: 'select', options: ['Survey', 'Deal', 'Lunas', 'Batal'], default: 'Survey' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
  checklists: {
    title: 'Tugas Checklist',
    fields: [
      { key: 'phase', label: 'Tahap Persiapan', type: 'select', options: ['H-6 Bulan', 'H-3 Bulan', 'H-1 Bulan', 'H-1 Minggu', 'Hari-H'], default: 'H-3 Bulan' },
      { key: 'task', label: 'Nama Tugas', type: 'text', required: true },
      { key: 'pic', label: 'Penanggung Jawab (PIC)', type: 'text' },
      { key: 'due_date', label: 'Target Tanggal', type: 'date' },
      { key: 'done', label: 'Status', type: 'select', options: ['Belum', 'Selesai'], default: 'Belum' },
    ],
  },
  rundowns: {
    title: 'Rundown Acara',
    fields: [
      { key: 'event_name', label: 'Sesi Acara', type: 'select', options: ['Akad / Pemberkatan', 'Resepsi', 'Lainnya'], default: 'Akad / Pemberkatan' },
      { key: 'start_time', label: 'Jam Mulai', type: 'time', required: true },
      { key: 'end_time', label: 'Jam Selesai', type: 'time', required: true },
      { key: 'activity', label: 'Kegiatan', type: 'text', required: true },
      { key: 'pic', label: 'PIC / Koordinator', type: 'text' },
      { key: 'location', label: 'Lokasi', type: 'text' },
      { key: 'notes', label: 'Catatan', type: 'text' },
    ],
  },
};

// --- Utilities ---
const $ = (id) => document.getElementById(id);

function formatNumberComma(num) {
  const clean = String(num ?? '').replace(/[^\d]/g, '');
  if (!clean) return '0';
  return Number(clean).toLocaleString('en-US');
}

function parseCurrency(val) {
  const clean = String(val ?? '').replace(/[^\d]/g, '');
  return clean ? Number(clean) : 0;
}

function formatRp(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('en-US');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, isError = false) {
  const container = $('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${isError ? 'error' : ''}`;
  const icon = isError
    ? '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'
    : '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
  el.innerHTML = `${icon}<span>${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function withButtonLock(btn, loadingText, fn) {
  if (!btn || btn.disabled) return;
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  if (loadingText) btn.textContent = loadingText;
  try {
    await fn();
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

function isDemoMode() {
  return !state.apiUrl.trim();
}

// --- API Layer (Google Apps Script + Demo Fallback) ---
async function apiCall(action, payload = {}) {
  if (isDemoMode()) {
    return demoApiCall(action, payload);
  }

  // Use text/plain to avoid CORS preflight OPTIONS on Google Apps Script
  const res = await fetch(state.apiUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: state.token, payload }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.ok) {
    if (json.code === 'UNAUTHORIZED') {
      logout(false);
    }
    throw new Error(json.error || 'Terjadi kesalahan server');
  }
  return json.data;
}

// --- Local Demo Mode (localStorage) ---
function getDemoDb() {
  const raw = localStorage.getItem(STORAGE_KEYS.demoDb);
  if (raw) return JSON.parse(raw);
  const seed = {
    users: [],
    budgets: [],
    guests: [],
    vendors: [],
    checklists: [],
    rundowns: [],
  };
  localStorage.setItem(STORAGE_KEYS.demoDb, JSON.stringify(seed));
  return seed;
}

function saveDemoDb(db) {
  localStorage.setItem(STORAGE_KEYS.demoDb, JSON.stringify(db));
}

function demoApiCall(action, payload) {
  const db = getDemoDb();
  const uid = () => 'id_' + Math.random().toString(36).slice(2, 10);

  if (action === 'register') {
    const email = (payload.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) {
      throw new Error('Email sudah terdaftar.');
    }
    const user = {
      id: uid(),
      email,
      password: payload.password,
      name: payload.name,
      partner_name: payload.partner_name,
      wedding_date: payload.wedding_date || '',
    };
    db.users.push(user);
    saveDemoDb(db);
    const { password, ...safeUser } = user;
    return { token: 'demo_' + user.id, user: safeUser };
  }

  if (action === 'login') {
    const email = (payload.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email === email && u.password === payload.password);
    if (!user) throw new Error('Email atau password salah.');
    const { password, ...safeUser } = user;
    return { token: 'demo_' + user.id, user: safeUser };
  }

  if (action === 'publicEventInfo') {
    const u = db.users.find((x) => x.id === payload.user_id);
    if (!u) throw new Error('Acara tidak ditemukan.');
    return { name: u.name, partner_name: u.partner_name, wedding_date: u.wedding_date };
  }

  if (action === 'publicCheckin') {
    const u = db.users.find((x) => x.id === payload.user_id);
    if (!u) throw new Error('Acara tidak ditemukan.');
    const g = {
      id: uid(),
      user_id: u.id,
      name: payload.name,
      side: 'Umum',
      group: payload.group || 'Teman',
      pax: Number(payload.pax || 1),
      rsvp: 'Hadir',
      phone: payload.phone || '',
      notes: payload.notes || '',
      updated_at: new Date().toISOString(),
    };
    db.guests.push(g);
    saveDemoDb(db);
    return { guest: g };
  }

  // Authenticated actions in demo mode
  const userId = state.token.replace('demo_', '');
  const currentUser = db.users.find((u) => u.id === userId);
  if (!currentUser) throw new Error('Sesi tidak valid. Silakan masuk ulang.');

  if (action === 'updateProfile') {
    currentUser.name = payload.name;
    currentUser.partner_name = payload.partner_name;
    currentUser.wedding_date = payload.wedding_date || '';
    saveDemoDb(db);
    const { password, ...safeUser } = currentUser;
    return { user: safeUser };
  }

  if (action === 'getAll') {
    return {
      budgets: db.budgets.filter((r) => r.user_id === userId),
      guests: db.guests.filter((r) => r.user_id === userId),
      vendors: db.vendors.filter((r) => r.user_id === userId),
      checklists: db.checklists.filter((r) => r.user_id === userId),
      rundowns: db.rundowns.filter((r) => r.user_id === userId),
    };
  }

  if (action === 'upsertItem') {
    const { module, item } = payload;
    const list = db[module];
    if (!list) throw new Error('Modul tidak dikenal');
    if (item.id) {
      const idx = list.findIndex((r) => r.id === item.id && r.user_id === userId);
      if (idx === -1) throw new Error('Data tidak ditemukan');
      list[idx] = { ...list[idx], ...item, user_id: userId, updated_at: new Date().toISOString() };
      saveDemoDb(db);
      return { item: list[idx] };
    } else {
      const created = { ...item, id: uid(), user_id: userId, updated_at: new Date().toISOString() };
      list.push(created);
      saveDemoDb(db);
      return { item: created };
    }
  }

  if (action === 'deleteItem') {
    const { module, id } = payload;
    db[module] = db[module].filter((r) => !(r.id === id && r.user_id === userId));
    saveDemoDb(db);
    return { deleted: true };
  }

  if (action === 'resetUserData') {
    ['budgets', 'guests', 'vendors', 'checklists', 'rundowns'].forEach((m) => {
      db[m] = db[m].filter((r) => r.user_id !== userId);
    });
    saveDemoDb(db);
    return { deleted: true };
  }

  throw new Error('Aksi tidak dikenal');
}

// --- Auth & Session ---
function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function logout(notify = true) {
  state.token = '';
  state.user = null;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  renderAuthOrApp();
  if (notify) showToast('Anda telah keluar.');
}

function updateModeBanner() {
  const banner = $('mode-banner');
  const badge = $('connection-badge');
  if (isDemoMode()) {
    banner.textContent = 'Mode Demo Aktif (data tersimpan di browser ini). Atur URL Google Apps Script untuk sinkron ke Google Sheets.';
    banner.classList.remove('hidden');
    badge.textContent = 'Mode Demo (Lokal)';
    badge.className = 'badge badge-warn';
  } else {
    banner.classList.add('hidden');
    badge.textContent = 'Google Sheets Aktif';
    badge.className = 'badge badge-ok';
  }
}

function renderAuthOrApp() {
  updateModeBanner();
  if (state.token && state.user) {
    $('auth-view').classList.add('hidden');
    $('app-view').classList.remove('hidden');
    renderUserHeader();
    loadAllData();
  } else {
    $('app-view').classList.add('hidden');
    $('auth-view').classList.remove('hidden');
  }
}

function normalizeDateStr(val) {
  if (!val) return '';
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderUserHeader() {
  const u = state.user;
  const dateStr = normalizeDateStr(u.wedding_date);
  $('sidebar-couple').textContent = `${u.name} & ${u.partner_name}`;
  $('set-name').value = u.name || '';
  $('set-partner').value = u.partner_name || '';
  $('set-date').value = dateStr;
  $('set-api-url').value = state.apiUrl || '';

  const cd = $('wedding-countdown');
  if (dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) cd.textContent = `H-${diffDays} menuju hari bahagia (${dateStr})`;
    else if (diffDays === 0) cd.textContent = 'Hari ini adalah Hari Pernikahan Anda!';
    else cd.textContent = `Tanggal pernikahan: ${dateStr}`;
  } else {
    cd.textContent = 'Atur tanggal pernikahan di Pengaturan';
  }
}

async function loadAllData() {
  try {
    const res = await apiCall('getAll');
    state.data = {
      budgets: res.budgets || [],
      guests: res.guests || [],
      vendors: res.vendors || [],
      checklists: res.checklists || [],
      rundowns: res.rundowns || [],
    };
    renderAll();
  } catch (err) {
    showToast(err.message, true);
  }
}

// --- Rendering ---
function renderAll() {
  renderDashboard();
  renderPlans();
  renderBudgets();
  renderGuests();
  renderVendors();
  renderChecklists();
  renderRundowns();
}

const WEDDING_PLANS = [
  {
    id: 'kua-hemat',
    name: 'Plan KUA & Syukuran',
    badge: '50–80 Tamu',
    summary: 'Akad nikah di Kantor KUA pada hari kerja (PNBP Rp 0) dilanjutkan syukuran walimah hangat di rumah bersama keluarga inti.',
    budgets: [
      { category: 'KUA / Penghulu', item: 'Administrasi KUA Jam Kerja (Rp 0) / Transport', estimated: 300000 },
      { category: 'Catering', item: 'Nasi Box / Prasmanan Rumahan (60 pax)', estimated: 4500000 },
      { category: 'Busana & MUA', item: 'Sewa Kebaya/Beskap Akad & Rias Pengantin', estimated: 2500000 },
      { category: 'Venue & Dekorasi', item: 'Backdrop Foto Minimalis di Ruang Tamu', estimated: 1200000 },
      { category: 'Dokumentasi', item: 'Fotografer Freelance (Akad & Keluarga)', estimated: 1500000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Digital + Souvenir Simpel 50 pcs', estimated: 500000 },
      { category: 'Lainnya', item: 'Mahar, Cincin Simpel & Operasional', estimated: 1500000 },
    ],
    checklists: [
      { phase: 'H-3 Bulan', task: 'Urus surat pengantar nikah (N1–N4) ke RT/RW & Kelurahan', pic: 'Calon Pengantin' },
      { phase: 'H-1 Bulan', task: 'Daftar jadwal akad di KUA (pilih hari kerja agar gratis)', pic: 'Calon Pengantin' },
      { phase: 'H-1 Bulan', task: 'Booking MUA, busana akad & fotografer half-day', pic: 'Mempelai Wanita' },
      { phase: 'H-1 Minggu', task: 'Pesan nasi box / catering rumahan & siapkan rumah', pic: 'Keluarga' },
      { phase: 'H-1 Minggu', task: 'Kirim undangan digital WhatsApp ke keluarga & sahabat', pic: 'Calon Pengantin' },
      { phase: 'Hari-H', task: 'Bawa dokumen asli, mahar, dan cincin ke KUA tepat waktu', pic: 'PIC Keluarga' },
    ],
  },
  {
    id: 'sederhana',
    name: 'Plan Sederhana (Rumah/Aula)',
    badge: '100–150 Tamu',
    summary: 'Akad di rumah atau aula warga (PNBP luar KUA Rp 600,000), dilengkapi tenda, pelaminan minimalis, dan prasmanan tamu.',
    budgets: [
      { category: 'KUA / Penghulu', item: 'PNBP Nikah Luar KUA (Rp 600,000) & Administrasi', estimated: 800000 },
      { category: 'Catering', item: 'Prasmanan 120 pax + Snack Akad', estimated: 8500000 },
      { category: 'Venue & Dekorasi', item: 'Tenda, Kursi Tamu & Pelaminan Minimalis Rumah', estimated: 4500000 },
      { category: 'Busana & MUA', item: 'MUA + Busana Pengantin & Orang Tua', estimated: 3500000 },
      { category: 'Dokumentasi', item: 'Fotografer + Cetak Album Standar', estimated: 2500000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Digital + Cetak 50 lbr + Souvenir 120 pcs', estimated: 1200000 },
      { category: 'Lainnya', item: 'Mahar, Cincin, Kebersihan & Parkir Lingkungan', estimated: 2000000 },
    ],
    checklists: [
      { phase: 'H-3 Bulan', task: 'Urus berkas KUA & booking penghulu untuk akad di rumah/aula', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Izin penggunaan aula/lingkungan RT & booking tenda', pic: 'Keluarga' },
      { phase: 'H-1 Bulan', task: 'Booking vendor catering, MUA & dokumentasi', pic: 'Calon Pengantin' },
      { phase: 'H-1 Bulan', task: 'Siapkan mahar, seserahan & cincin nikah', pic: 'Calon Pengantin' },
      { phase: 'H-1 Minggu', task: 'Koordinasi panitia keluarga (penerima tamu & parkir)', pic: 'Keluarga' },
      { phase: 'Hari-H', task: 'Cek kesiapan catering, sound akad & meja buku tamu', pic: 'PIC Keluarga' },
    ],
  },
  {
    id: 'intimate',
    name: 'Plan Intimate (Cafe/Garden)',
    badge: '100–150 Tamu',
    summary: 'Konsep hangat di resto, cafe, atau garden venue (4–6 jam), dekorasi rustic/fairy lights, live akustik, dan sesi mingling santai.',
    budgets: [
      { category: 'Venue & Dekorasi', item: 'Private Cafe/Garden (Min. Spend/Sewa) + Dekorasi Rustic', estimated: 18000000 },
      { category: 'Catering', item: 'Buffet 120 pax + 2 Gubukan (Stall) & Coffee/Tea', estimated: 16000000 },
      { category: 'Busana & MUA', item: 'MUA, Attire Akad & Resepsi + Keluarga Inti', estimated: 7500000 },
      { category: 'Dokumentasi', item: 'Foto & Video Highlight (Full Day)', estimated: 5500000 },
      { category: 'Lainnya', item: 'Sound System, Live Akustik, MC & WO On The Day', estimated: 4500000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Digital RSVP + Souvenir Custom 120 pcs', estimated: 2500000 },
      { category: 'KUA / Penghulu', item: 'Administrasi KUA / Catatan Sipil & Mahar', estimated: 1000000 },
    ],
    checklists: [
      { phase: 'H-6 Bulan', task: 'Survei cafe/garden venue & cek aturan minimum spend', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Booking MUA, foto/video, MC & band akustik', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Food tasting menu cafe & siapkan rencana cadangan hujan (kanopi)', pic: 'Calon Pengantin' },
      { phase: 'H-1 Bulan', task: 'Urus berkas KUA / Catatan Sipil & kirim undangan RSVP', pic: 'Calon Pengantin' },
      { phase: 'H-1 Minggu', task: 'Technical meeting bersama venue, WO & vendor musik', pic: 'WO / PIC' },
      { phase: 'Hari-H', task: 'Pasang QR Absensi di meja penerima tamu & nikmati acara', pic: 'WO / PIC' },
    ],
  },
  {
    id: 'adat-jawa',
    name: 'Plan Adat Jawa (Solo / Yogya)',
    badge: '300–500 Tamu',
    summary: 'Pernikahan pakem Jawa Tengah / DIY: Siraman, Midodareni, Ijab, Upacara Panggih (Balangan Gantal, Wijik Dadi, Kacar-Kucur, Sungkeman) & Paes Ageng / Solo Putri.',
    budgets: [
      { category: 'Venue & Dekorasi', item: 'Gedung/Pendopo + Gebyok Pelaminan Jawa & Janur', estimated: 35000000 },
      { category: 'Catering', item: 'Buffet Jawa 400 pax + Gubukan (Soto, Tengkleng, Es Dawet)', estimated: 44000000 },
      { category: 'Busana & MUA', item: 'Rias Paes Ageng / Solo Putri, Beskap, Ortu & Among Tamu', estimated: 18000000 },
      { category: 'Lainnya', item: 'WO Adat, MC Bahasa Jawa, Cucuk Lampah & Gamelan/Karawitan', estimated: 12000000 },
      { category: 'Dokumentasi', item: 'Foto & Video Liputan Siraman, Midodareni, Akad & Panggih', estimated: 10000000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Batik/Digital & Souvenir 400 pcs', estimated: 4500000 },
      { category: 'KUA / Penghulu', item: 'Administrasi KUA & Perlengkapan Ubo Rampe Panggih', estimated: 1500000 },
    ],
    checklists: [
      { phase: 'H-6 Bulan', task: 'Booking gedung/pendopo & perias spesialis Paes Jawa', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Siapkan ubo rampe Siraman, Kembar Mayang & Upacara Panggih', pic: 'Keluarga / WO' },
      { phase: 'H-3 Bulan', task: 'Booking MC Adat Jawa, Cucuk Lampah & iringan Gamelan', pic: 'WO' },
      { phase: 'H-1 Bulan', task: 'Fitting kebaya/beskap pengantin, orang tua & among tamu', pic: 'MUA / Keluarga' },
      { phase: 'H-1 Minggu', task: 'Technical meeting prosesi Siraman, Midodareni & Panggih', pic: 'WO' },
      { phase: 'Hari-H', task: 'Jalankan Siraman, Midodareni, Ijab & Upacara Panggih lengkap', pic: 'WO / MC Adat' },
    ],
  },
  {
    id: 'adat-sunda',
    name: 'Plan Adat Sunda (Siger)',
    badge: '300–500 Tamu',
    summary: 'Pernikahan adat Sunda Jawa Barat dengan rias Siger Sunda, prosesi Ngeuyeuk Seureuh, Saweran, Meuleum Harupat, Nincak Endog & Huap Lingkung.',
    budgets: [
      { category: 'Venue & Dekorasi', item: 'Gedung/Aula + Pelaminan Sunda & Dekorasi Bunga Melati', estimated: 30000000 },
      { category: 'Catering', item: 'Buffet 400 pax + Stall Khas Sunda (Empal Gentong, Siomay, Batagor)', estimated: 40000000 },
      { category: 'Busana & MUA', item: 'Rias Siger Sunda, Kebaya/Beskap, Orang Tua & Pagar Ayu', estimated: 15000000 },
      { category: 'Lainnya', item: 'WO Adat Sunda, MC, Mapag Panganten & Kacapi Suling', estimated: 10000000 },
      { category: 'Dokumentasi', item: 'Foto & Video Prosesi Ngeuyeuk Seureuh, Akad & Saweran', estimated: 9000000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Cetak/Digital & Souvenir 400 pcs', estimated: 4500000 },
      { category: 'KUA / Penghulu', item: 'Administrasi KUA & Perlengkapan Saweran/Harupat/Endog', estimated: 1500000 },
    ],
    checklists: [
      { phase: 'H-6 Bulan', task: 'Booking gedung/aula & MUA spesialis Siger Sunda', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Booking tim Mapag Panganten (Lengser) & Kacapi Suling', pic: 'WO' },
      { phase: 'H-1 Bulan', task: 'Siapkan perlengkapan Ngeuyeuk Seureuh & Saweran (beras, koin, harupat)', pic: 'Keluarga' },
      { phase: 'H-1 Minggu', task: 'Technical meeting bersama MC Adat Sunda & semua vendor', pic: 'WO' },
      { phase: 'Hari-H', task: 'Jalankan Ijab, Saweran, Meuleum Harupat, Nincak Endog & Huap Lingkung', pic: 'WO / MC Adat' },
    ],
  },
  {
    id: 'adat-betawi',
    name: 'Plan Adat Betawi (Palang Pintu)',
    badge: '300–500 Tamu',
    summary: 'Pernikahan adat Betawi (Jakarta) dengan busana Dandanan Care None Pengantin Cine, tradisi Palang Pintu (silat & pantun), Roti Buaya & Tanjidor.',
    budgets: [
      { category: 'Venue & Dekorasi', item: 'Gedung/Aula + Pelaminan Betawi & Kembang Kelapa', estimated: 28000000 },
      { category: 'Catering', item: 'Buffet 350 pax + Stall Betawi (Soto Betawi, Kerak Telor, Es Selendang Mayang)', estimated: 38000000 },
      { category: 'Busana & MUA', item: 'Rias Care None Pengantin Cine, Busana Pengantin & Keluarga', estimated: 15000000 },
      { category: 'Lainnya', item: 'Tim Palang Pintu (Silat & Pantun), Tanjidor/Gambang Kromong & WO', estimated: 10000000 },
      { category: 'Dokumentasi', item: 'Foto & Video Liputan Palang Pintu & Resepsi', estimated: 8500000 },
      { category: 'Undangan & Souvenir', item: 'Undangan & Souvenir 350 pcs', estimated: 4000000 },
      { category: 'KUA / Penghulu', item: 'Administrasi KUA, Sepasang Roti Buaya & Seserahan Betawi', estimated: 2500000 },
    ],
    checklists: [
      { phase: 'H-6 Bulan', task: 'Booking gedung/aula & sanggar Palang Pintu + Tanjidor', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Booking MUA spesialis rias Betawi & food tasting catering', pic: 'Calon Pengantin' },
      { phase: 'H-1 Bulan', task: 'Pesan sepasang Roti Buaya segar & siapkan seserahan khas Betawi', pic: 'Keluarga Pria' },
      { phase: 'H-1 Minggu', task: 'Technical meeting alur penyambutan Palang Pintu & rundown acara', pic: 'WO' },
      { phase: 'Hari-H', task: 'Prosesi Buka Palang Pintu, Akad Nikah & Resepsi Betawi', pic: 'WO / Sanggar' },
    ],
  },
  {
    id: 'adat-nusantara',
    name: 'Plan Adat Nusantara (Minang/Batak/Bugis)',
    badge: '300–500 Tamu',
    summary: 'Pilihan adat luar Jawa: Minang (Suntiang & Malam Bainai), Batak (Ulos & Sinamot), Bugis-Makassar (Baju Bodo & Mappacci), atau Melayu (Tepung Tawar).',
    budgets: [
      { category: 'Venue & Dekorasi', item: 'Gedung/Aula + Pelaminan Adat Nusantara (Bagonjong/Batak/Bugis)', estimated: 35000000 },
      { category: 'Catering', item: 'Buffet 450 pax + Masakan Khas Daerah', estimated: 48000000 },
      { category: 'Busana & MUA', item: 'Rias Adat (Suntiang/Baju Bodo/Sortali) + Busana Keluarga', estimated: 18000000 },
      { category: 'Lainnya', item: 'WO Adat, Tarian Penyambutan (Tari Piring/Tor-Tor/Padduppa) & MC', estimated: 12000000 },
      { category: 'Dokumentasi', item: 'Foto & Video Prosesi Pra-Nikah Adat (Malam Bainai/Mappacci) & Resepsi', estimated: 11000000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Cetak/Digital & Souvenir 450 pcs', estimated: 5000000 },
      { category: 'KUA / Penghulu', item: 'Administrasi KUA/Catatan Sipil & Perlengkapan Adat (Ulos/Bainai)', estimated: 3000000 },
    ],
    checklists: [
      { phase: 'H-6 Bulan', task: 'Musyawarah keluarga besar tentang pakem adat & gedung', pic: 'Keluarga' },
      { phase: 'H-3 Bulan', task: 'Booking MUA spesialis adat, sanggar tari & pemusik daerah', pic: 'WO' },
      { phase: 'H-1 Bulan', task: 'Siapkan perlengkapan prosesi pra-nikah (Malam Bainai / Mappacci / Ulos)', pic: 'Keluarga' },
      { phase: 'H-1 Minggu', task: 'Technical meeting prosesi adat bersama tetua adat & WO', pic: 'WO' },
      { phase: 'Hari-H', task: 'Jalankan prosesi adat lengkap, tarian penyambutan & resepsi', pic: 'WO / Tetua Adat' },
    ],
  },
  {
    id: 'pesta',
    name: 'Plan Pesta Ballroom',
    badge: '500–800 Tamu',
    summary: 'Resepsi megah di ballroom hotel atau convention hall dengan Full Wedding Organizer, dekorasi lighting, catering besar & live band.',
    budgets: [
      { category: 'Venue & Dekorasi', item: 'Ballroom Hotel/Convention + Pelaminan Megah & Lighting', estimated: 60000000 },
      { category: 'Catering', item: 'Buffet 600 pax + 5 Food Stall Spesial', estimated: 78000000 },
      { category: 'Busana & MUA', item: 'MUA Top, Gaun/Jas Pengantin, Keluarga & Bridesmaid', estimated: 22000000 },
      { category: 'Dokumentasi', item: 'Prewedding + Foto & Video Cinematic (2 Tim)', estimated: 16000000 },
      { category: 'Lainnya', item: 'Full Wedding Organizer, MC Profesional & Live Band', estimated: 15000000 },
      { category: 'Undangan & Souvenir', item: 'Undangan Hardcover/Digital & Souvenir 600 pcs', estimated: 7000000 },
      { category: 'KUA / Penghulu', item: 'Administrasi KUA / Catatan Sipil & Mahar', estimated: 2000000 },
    ],
    checklists: [
      { phase: 'H-6 Bulan', task: 'Booking ballroom hotel & Full Wedding Organizer', pic: 'Calon Pengantin' },
      { phase: 'H-6 Bulan', task: 'Lock vendor dekorasi, catering, MUA & dokumentasi', pic: 'WO' },
      { phase: 'H-3 Bulan', task: 'Sesi foto prewedding & cetak/sebar undangan VIP', pic: 'Calon Pengantin' },
      { phase: 'H-3 Bulan', task: 'Food tasting menu hotel & finalisasi layout ballroom', pic: 'WO' },
      { phase: 'H-1 Bulan', task: 'Urus berkas KUA/Dukcapil & fitting final semua busana', pic: 'Calon Pengantin' },
      { phase: 'H-1 Minggu', task: 'Technical meeting besar bersama hotel, vendor & panitia keluarga', pic: 'WO' },
      { phase: 'Hari-H', task: 'Check-in kamar hotel pengantin, gladi resik & resepsi ballroom', pic: 'WO' },
    ],
  },
];

function renderPlans() {
  const container = $('plans-grid');
  if (!container) return;
  container.innerHTML = WEDDING_PLANS.map((plan) => {
    const totalEst = plan.budgets.reduce((sum, b) => sum + b.estimated, 0);
    return `
      <article class="card plan-card">
        <div class="plan-card-head">
          <h3>${escapeHtml(plan.name)}</h3>
          <span class="badge badge-ok">${escapeHtml(plan.badge)}</span>
        </div>
        <div class="plan-budget-total">Estimasi: ${formatRp(totalEst)}</div>
        <p class="muted">${escapeHtml(plan.summary)}</p>

        <div>
          <div class="plan-section-title">Ringkasan Anggaran (${plan.budgets.length} pos)</div>
          <ul class="plan-preview-list">
            ${plan.budgets.map((b) => `<li><span>${escapeHtml(b.item)}</span><strong>${formatRp(b.estimated)}</strong></li>`).join('')}
          </ul>
        </div>

        <div>
          <div class="plan-section-title">Checklist Persiapan (${plan.checklists.length} tugas)</div>
          <ul class="plan-preview-list">
            ${plan.checklists.map((c) => `<li><span>${escapeHtml(c.task)}</span><span class="muted">${escapeHtml(c.phase)}</span></li>`).join('')}
          </ul>
        </div>

        <div class="plan-card-footer">
          <button type="button" class="btn btn-primary btn-full" onclick="applyWeddingPlan('${plan.id}', this)">Terapkan ${escapeHtml(plan.name)}</button>
        </div>
      </article>
    `;
  }).join('');
}

window.applyWeddingPlan = async (planId, btnEl) => {
  const plan = WEDDING_PLANS.find((p) => p.id === planId);
  if (!plan) return;

  const hasExisting = state.data.budgets.length > 0 || state.data.checklists.length > 0;
  const msg = hasExisting
    ? `Tambahkan ${plan.budgets.length} pos anggaran dan ${plan.checklists.length} checklist dari ${plan.name} ke data Anda?`
    : `Terapkan ${plan.name} (${plan.budgets.length} pos anggaran & ${plan.checklists.length} checklist)?`;

  openConfirmModal({
    title: 'Terapkan Plan',
    message: msg,
    confirmText: 'Ya, Terapkan',
    onConfirm: async () => {
      const origText = btnEl.textContent;
      btnEl.disabled = true;
      const total = plan.budgets.length + plan.checklists.length;
      let done = 0;
      try {
        for (const b of plan.budgets) {
          done += 1;
          btnEl.textContent = `Menyimpan (${done}/${total})...`;
          const res = await apiCall('upsertItem', {
            module: 'budgets',
            item: { ...b, actual: 0, paid: 0, status: 'Belum Bayar', notes: plan.name },
          });
          state.data.budgets.push(res.item);
        }
        for (const c of plan.checklists) {
          done += 1;
          btnEl.textContent = `Menyimpan (${done}/${total})...`;
          const res = await apiCall('upsertItem', {
            module: 'checklists',
            item: { ...c, due_date: '', done: 'Belum' },
          });
          state.data.checklists.push(res.item);
        }
        renderAll();
        showToast(`${plan.name} berhasil diterapkan! Silakan centang item yang sudah selesai.`);
        switchTab('budgets');
      } catch (err) {
        showToast(err.message, true);
      } finally {
        btnEl.disabled = false;
        btnEl.textContent = origText;
      }
    },
  });
};

function statusBadge(text) {
  const map = {
    Lunas: 'badge-ok',
    Hadir: 'badge-ok',
    Selesai: 'badge-ok',
    Deal: 'badge-ok',
    DP: 'badge-warn',
    Survey: 'badge-warn',
    Belum: 'badge-neutral',
    'Belum Bayar': 'badge-neutral',
    'Tidak Hadir': 'badge-bad',
    Batal: 'badge-bad',
  };
  return `<span class="badge ${map[text] || 'badge-neutral'}">${escapeHtml(text)}</span>`;
}

function renderDashboard() {
  const { budgets, guests, vendors, checklists, rundowns } = state.data;

  const estTotal = budgets.reduce((s, b) => s + Number(b.estimated || 0), 0);
  const paidTotal = budgets.reduce((s, b) => s + Number(b.paid || 0), 0);
  $('stat-budget-est').textContent = formatRp(estTotal);
  $('stat-budget-paid').textContent = `Terbayar: ${formatRp(paidTotal)}`;

  const totalPax = guests.reduce((s, g) => s + Number(g.pax || 0), 0);
  const hadirPax = guests.filter((g) => g.rsvp === 'Hadir').reduce((s, g) => s + Number(g.pax || 0), 0);
  $('stat-guests-total').textContent = `${totalPax} Orang`;
  $('stat-guests-rsvp').textContent = `Hadir: ${hadirPax} orang (${guests.length} undangan)`;

  const dealVendors = vendors.filter((v) => v.status === 'Deal' || v.status === 'Lunas').length;
  $('stat-vendors-total').textContent = `${vendors.length} Vendor`;
  $('stat-vendors-deal').textContent = `Deal/Lunas: ${dealVendors}`;

  const doneCount = checklists.filter((c) => c.done === 'Selesai').length;
  const pct = checklists.length ? Math.round((doneCount / checklists.length) * 100) : 0;
  $('stat-checklist-pct').textContent = `${pct}%`;
  $('stat-checklist-count').textContent = `${doneCount} / ${checklists.length} selesai`;

  const pendingTasks = checklists.filter((c) => c.done !== 'Selesai').slice(0, 5);
  $('dash-checklist').innerHTML = pendingTasks.length
    ? pendingTasks.map((c) => `<li><span>${escapeHtml(c.task)}</span><span class="muted">${escapeHtml(c.phase)}</span></li>`).join('')
    : '<li class="muted">Belum ada tugas tertunda.</li>';

  const sortedRundown = [...rundowns].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).slice(0, 5);
  $('dash-rundown').innerHTML = sortedRundown.length
    ? sortedRundown.map((r) => `<li><span>${escapeHtml(r.start_time)} - ${escapeHtml(r.activity)}</span><span class="muted">${escapeHtml(r.event_name)}</span></li>`).join('')
    : '<li class="muted">Belum ada jadwal rundown.</li>';
}

function actionButtons(module, id) {
  return `
    <button type="button" class="btn btn-sm btn-outline" onclick="openEditModal('${module}', '${id}')">Edit</button>
    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('${module}', '${id}')">Hapus</button>
  `;
}

function renderBudgets() {
  const q = $('filter-budget-search').value.toLowerCase();
  const st = $('filter-budget-status').value;
  const rows = state.data.budgets.filter((b) =>
    (!q || (b.item + ' ' + b.category).toLowerCase().includes(q)) &&
    (!st || b.status === st)
  );
  $('tbody-budgets').innerHTML = rows.length
    ? rows.map((b) => `
      <tr>
        <td data-label="Sudah">
          <input type="checkbox" ${b.status === 'Lunas' ? 'checked' : ''} onchange="toggleBudgetDone('${b.id}', this.checked)" />
        </td>
        <td data-label="Kategori">${escapeHtml(b.category)}</td>
        <td data-label="Item"><div style="${b.status === 'Lunas' ? 'text-decoration:line-through;color:var(--muted)' : ''}"><strong>${escapeHtml(b.item)}</strong>${b.notes ? `<div class="muted">${escapeHtml(b.notes)}</div>` : ''}</div></td>
        <td data-label="Estimasi">${formatRp(b.estimated)}</td>
        <td data-label="Aktual">${formatRp(b.actual)}</td>
        <td data-label="Terbayar">${formatRp(b.paid)}</td>
        <td data-label="Status">${statusBadge(b.status)}</td>
        <td data-label="Aksi" class="td-actions">${actionButtons('budgets', b.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="8" class="muted">Belum ada data anggaran.</td></tr>';
}

function renderGuests() {
  const q = $('filter-guest-search').value.toLowerCase();
  const rsvp = $('filter-guest-rsvp').value;
  const rows = state.data.guests.filter((g) =>
    (!q || (g.name + ' ' + g.group).toLowerCase().includes(q)) &&
    (!rsvp || g.rsvp === rsvp)
  );
  $('tbody-guests').innerHTML = rows.length
    ? rows.map((g) => `
      <tr>
        <td data-label="Nama"><div><strong>${escapeHtml(g.name)}</strong>${g.notes ? `<div class="muted">${escapeHtml(g.notes)}</div>` : ''}</div></td>
        <td data-label="Pihak">${escapeHtml(g.side)}</td>
        <td data-label="Grup">${escapeHtml(g.group)}</td>
        <td data-label="Pax">${escapeHtml(g.pax)}</td>
        <td data-label="RSVP">${statusBadge(g.rsvp)}</td>
        <td data-label="No. HP">${escapeHtml(g.phone || '-')}</td>
        <td data-label="Aksi" class="td-actions">${actionButtons('guests', g.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="7" class="muted">Belum ada daftar tamu.</td></tr>';
}

function renderVendors() {
  const q = $('filter-vendor-search').value.toLowerCase();
  const st = $('filter-vendor-status').value;
  const rows = state.data.vendors.filter((v) =>
    (!q || (v.name + ' ' + v.category).toLowerCase().includes(q)) &&
    (!st || v.status === st)
  );
  $('tbody-vendors').innerHTML = rows.length
    ? rows.map((v) => `
      <tr>
        <td data-label="Kategori">${escapeHtml(v.category)}</td>
        <td data-label="Vendor"><div><strong>${escapeHtml(v.name)}</strong>${v.notes ? `<div class="muted">${escapeHtml(v.notes)}</div>` : ''}</div></td>
        <td data-label="PIC">${escapeHtml(v.pic || '-')}</td>
        <td data-label="Kontak">${escapeHtml(v.phone || '-')}</td>
        <td data-label="Harga">${formatRp(v.price)}</td>
        <td data-label="DP">${formatRp(v.dp_paid)}</td>
        <td data-label="Status">${statusBadge(v.status)}</td>
        <td data-label="Aksi" class="td-actions">${actionButtons('vendors', v.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="8" class="muted">Belum ada data vendor.</td></tr>';
}

function renderChecklists() {
  const phase = $('filter-checklist-phase').value;
  const rows = state.data.checklists.filter((c) => !phase || c.phase === phase);
  $('tbody-checklists').innerHTML = rows.length
    ? rows.map((c) => `
      <tr>
        <td data-label="Selesai">
          <input type="checkbox" ${c.done === 'Selesai' ? 'checked' : ''} onchange="toggleChecklist('${c.id}', this.checked)" />
        </td>
        <td data-label="Tahap">${escapeHtml(c.phase)}</td>
        <td data-label="Tugas" style="${c.done === 'Selesai' ? 'text-decoration:line-through;color:var(--muted)' : ''}">${escapeHtml(c.task)}</td>
        <td data-label="PIC">${escapeHtml(c.pic || '-')}</td>
        <td data-label="Target">${escapeHtml(c.due_date || '-')}</td>
        <td data-label="Aksi" class="td-actions">${actionButtons('checklists', c.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="6" class="muted">Belum ada tugas checklist.</td></tr>';
}

function renderRundowns() {
  const ev = $('filter-rundown-event').value;
  const rows = state.data.rundowns
    .filter((r) => !ev || r.event_name === ev)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  $('tbody-rundowns').innerHTML = rows.length
    ? rows.map((r) => `
      <tr>
        <td data-label="Sesi">${escapeHtml(r.event_name)}</td>
        <td data-label="Waktu">${escapeHtml(r.start_time)} - ${escapeHtml(r.end_time)}</td>
        <td data-label="Kegiatan"><strong>${escapeHtml(r.activity)}</strong></td>
        <td data-label="PIC">${escapeHtml(r.pic || '-')}</td>
        <td data-label="Lokasi">${escapeHtml(r.location || '-')}</td>
        <td data-label="Catatan">${escapeHtml(r.notes || '-')}</td>
        <td data-label="Aksi" class="td-actions">${actionButtons('rundowns', r.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="7" class="muted">Belum ada jadwal rundown.</td></tr>';
}

// --- CRUD Modal & Actions ---
function openModal(module, existingItem = null) {
  const schema = MODULE_SCHEMAS[module];
  state.modalContext = { type: 'crud', module, id: existingItem?.id || null };
  $('modal-title').textContent = (existingItem ? 'Edit ' : 'Tambah ') + schema.title;

  $('modal-fields').innerHTML = schema.fields.map((f) => {
    const val = existingItem ? (existingItem[f.key] ?? '') : (f.default ?? '');
    if (f.type === 'select') {
      const opts = f.options.map((o) => `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
      return `<div class="field"><label>${escapeHtml(f.label)}</label><select name="${f.key}" ${f.required ? 'required' : ''}>${opts}</select></div>`;
    }
    if (f.type === 'currency') {
      const formatted = formatNumberComma(val);
      return `<div class="field"><label>${escapeHtml(f.label)}</label><input type="text" inputmode="numeric" data-currency="1" name="${f.key}" value="${escapeHtml(formatted)}" ${f.required ? 'required' : ''} /></div>`;
    }
    return `<div class="field"><label>${escapeHtml(f.label)}</label><input type="${f.type}" name="${f.key}" value="${escapeHtml(val)}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.required ? 'required' : ''} /></div>`;
  }).join('');

  $('modal-fields').querySelectorAll('input[data-currency="1"]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const digits = inp.value.replace(/[^\d]/g, '');
      inp.value = digits ? Number(digits).toLocaleString('en-US') : '';
    });
  });

  document.querySelector('#modal-form .modal-actions').classList.remove('hidden');
  $('modal-backdrop').classList.remove('hidden');
}

function openApiConfigModal() {
  state.modalContext = { type: 'apiConfig' };
  $('modal-title').textContent = 'Konfigurasi Google Apps Script';
  $('modal-fields').innerHTML = `
    <p class="muted">Masukkan URL Web App Google Apps Script Anda. Kosongkan untuk mencoba Mode Demo lokal terlebih dahulu.</p>
    <div class="field">
      <label>URL Web App (/exec)</label>
      <input type="url" name="apiUrl" value="${escapeHtml(state.apiUrl)}" placeholder="https://script.google.com/macros/s/.../exec" />
    </div>
  `;
  document.querySelector('#modal-form .modal-actions').classList.remove('hidden');
  $('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  $('modal-backdrop').classList.add('hidden');
  state.modalContext = null;
}

let confirmActionHandler = null;

function openConfirmModal({ title, message, confirmText = 'Ya, Lanjutkan', isDanger = false, onConfirm }) {
  $('confirm-title').textContent = title || 'Konfirmasi';
  $('confirm-message').textContent = message || 'Apakah Anda yakin?';
  const okBtn = $('confirm-ok');
  okBtn.textContent = confirmText;
  okBtn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'}`;
  confirmActionHandler = onConfirm;
  $('confirm-backdrop').classList.remove('hidden');
}

function closeConfirmModal() {
  $('confirm-backdrop').classList.add('hidden');
  confirmActionHandler = null;
}

window.openEditModal = (module, id) => {
  const item = state.data[module].find((r) => r.id === id);
  if (item) openModal(module, item);
};

window.deleteRecord = (module, id) => {
  openConfirmModal({
    title: 'Konfirmasi Hapus',
    message: 'Data yang dihapus tidak dapat dikembalikan. Yakin ingin menghapus data ini?',
    confirmText: 'Ya, Hapus',
    isDanger: true,
    onConfirm: async () => {
      try {
        await apiCall('deleteItem', { module, id });
        state.data[module] = state.data[module].filter((r) => r.id !== id);
        renderAll();
        showToast('Data dihapus.');
      } catch (err) {
        showToast(err.message, true);
      }
    },
  });
};

window.toggleBudgetDone = async (id, checked) => {
  const item = state.data.budgets.find((b) => b.id === id);
  if (!item) return;
  const updated = {
    ...item,
    status: checked ? 'Lunas' : 'Belum Bayar',
    paid: checked ? (Number(item.paid) > 0 ? item.paid : (item.actual || item.estimated || 0)) : 0,
  };
  try {
    const res = await apiCall('upsertItem', { module: 'budgets', item: updated });
    const idx = state.data.budgets.findIndex((b) => b.id === id);
    state.data.budgets[idx] = res.item;
    renderAll();
  } catch (err) {
    showToast(err.message, true);
    renderBudgets();
  }
};

window.toggleChecklist = async (id, checked) => {
  const item = state.data.checklists.find((c) => c.id === id);
  if (!item) return;
  const updated = { ...item, done: checked ? 'Selesai' : 'Belum' };
  try {
    const res = await apiCall('upsertItem', { module: 'checklists', item: updated });
    const idx = state.data.checklists.findIndex((c) => c.id === id);
    state.data.checklists[idx] = res.item;
    renderAll();
  } catch (err) {
    showToast(err.message, true);
    renderChecklists();
  }
};

// --- Navigation & Mobile Sidebar Drawer ---
function setSidebarOpen(open) {
  $('sidebar').classList.toggle('open', open);
  $('sidebar-backdrop').classList.toggle('hidden', !open);
  document.body.classList.toggle('drawer-open', open);
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== `tab-${tab}`);
  });
  const titles = {
    dashboard: 'Ringkasan',
    plans: 'Rekomendasi Plan',
    budgets: 'Anggaran Pernikahan',
    guests: 'Daftar Tamu & RSVP',
    vendors: 'Manajemen Vendor',
    checklists: 'Checklist Persiapan',
    rundowns: 'Rundown Acara',
    settings: 'Pengaturan',
  };
  $('page-title').textContent = titles[tab] || 'My Weeding Plan';
  setSidebarOpen(false);
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.authTab;
      document.querySelectorAll('.auth-tab').forEach((b) => b.classList.toggle('active', b === btn));
      $('login-form').classList.toggle('hidden', target !== 'login');
      $('register-form').classList.toggle('hidden', target !== 'register');
    });
  });

  // Login submit
  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Memproses...', async () => {
      try {
        const res = await apiCall('login', {
          email: $('login-email').value,
          password: $('login-password').value,
        });
        saveSession(res.token, res.user);
        renderAuthOrApp();
        showToast('Berhasil masuk!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // Register submit
  $('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Mendaftar...', async () => {
      try {
        const res = await apiCall('register', {
          name: $('reg-name').value,
          partner_name: $('reg-partner').value,
          wedding_date: $('reg-date').value,
          email: $('reg-email').value,
          password: $('reg-password').value,
        });
        saveSession(res.token, res.user);
        renderAuthOrApp();
        showToast('Akun berhasil dibuat!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  // Navigation & Mobile Sidebar
  $('btn-menu-toggle').addEventListener('click', () => setSidebarOpen(true));
  $('btn-menu-close').addEventListener('click', () => setSidebarOpen(false));
  $('sidebar-backdrop').addEventListener('click', () => setSidebarOpen(false));
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.jump));
  });

  // Add buttons
  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.add));
  });

  // Filters
  ['filter-budget-search', 'filter-budget-status'].forEach((id) => $(id).addEventListener('input', renderBudgets));
  ['filter-guest-search', 'filter-guest-rsvp'].forEach((id) => $(id).addEventListener('input', renderGuests));
  ['filter-vendor-search', 'filter-vendor-status'].forEach((id) => $(id).addEventListener('input', renderVendors));
  $('filter-checklist-phase').addEventListener('change', renderChecklists);
  $('filter-rundown-event').addEventListener('change', renderRundowns);

  // Modal handlers
  $('modal-close').addEventListener('click', closeModal);
  $('modal-cancel').addEventListener('click', closeModal);
  $('btn-open-api-config').addEventListener('click', openApiConfigModal);
  $('btn-show-qr').addEventListener('click', openGuestQrModal);

  $('modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ctx = state.modalContext;

    if (ctx?.type === 'apiConfig') {
      state.apiUrl = (formData.get('apiUrl') || '').toString().trim();
      localStorage.setItem(STORAGE_KEYS.apiUrl, state.apiUrl);
      updateModeBanner();
      closeModal();
      showToast('URL Google Apps Script diperbarui.');
      return;
    }

    if (ctx?.type === 'crud') {
      const btn = e.target.querySelector('button[type="submit"]');
      const item = Object.fromEntries(formData.entries());
      MODULE_SCHEMAS[ctx.module].fields.forEach((f) => {
        if (f.type === 'currency') {
          item[f.key] = parseCurrency(item[f.key]);
        }
      });
      if (ctx.id) item.id = ctx.id;

      const saveCrud = async () => {
        await withButtonLock(btn, 'Menyimpan...', async () => {
          try {
            const res = await apiCall('upsertItem', { module: ctx.module, item });
            const list = state.data[ctx.module];
            if (ctx.id) {
              const idx = list.findIndex((r) => r.id === ctx.id);
              if (idx !== -1) list[idx] = res.item;
            } else {
              list.push(res.item);
            }
            renderAll();
            closeModal();
            showToast('Data tersimpan.');
          } catch (err) {
            showToast(err.message, true);
          }
        });
      };

      if (ctx.id) {
        openConfirmModal({
          title: 'Konfirmasi Perubahan',
          message: 'Simpan perubahan pada data ini?',
          confirmText: 'Ya, Simpan',
          onConfirm: saveCrud,
        });
      } else {
        saveCrud();
      }
    }
  });

  // Confirmation modal listeners
  $('confirm-close').addEventListener('click', closeConfirmModal);
  $('confirm-cancel').addEventListener('click', closeConfirmModal);
  $('confirm-ok').addEventListener('click', () => {
    const handler = confirmActionHandler;
    if (!handler) return;
    withButtonLock($('confirm-ok'), 'Memproses...', async () => {
      await handler();
      closeConfirmModal();
    });
  });

  // Reset all data for current user
  $('btn-reset-all').addEventListener('click', () => {
    openConfirmModal({
      title: 'Reset Semua Data',
      message: 'Semua data Anggaran, Tamu, Vendor, Checklist, dan Rundown milik akun Anda akan dihapus permanen. Data akun lain tetap aman. Lanjutkan?',
      confirmText: 'Ya, Reset Semua',
      isDanger: true,
      onConfirm: async () => {
        try {
          try {
            await apiCall('resetUserData');
          } catch (err) {
            if (String(err.message).includes('Action tidak dikenal')) {
              for (const mod of ['budgets', 'guests', 'vendors', 'checklists', 'rundowns']) {
                for (const row of [...state.data[mod]]) {
                  await apiCall('deleteItem', { module: mod, id: row.id });
                }
              }
            } else {
              throw err;
            }
          }
          state.data = { budgets: [], guests: [], vendors: [], checklists: [], rundowns: [] };
          renderAll();
          showToast('Semua data akun Anda berhasil direset.');
        } catch (err) {
          showToast(err.message, true);
        }
      },
    });
  });

  // Settings forms
  $('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    openConfirmModal({
      title: 'Simpan Profil',
      message: 'Simpan perubahan profil pernikahan Anda?',
      confirmText: 'Ya, Simpan',
      onConfirm: () => withButtonLock(btn, 'Menyimpan...', async () => {
        try {
          const res = await apiCall('updateProfile', {
            name: $('set-name').value,
            partner_name: $('set-partner').value,
            wedding_date: $('set-date').value,
          });
          saveSession(state.token, res.user);
          renderUserHeader();
          showToast('Profil diperbarui.');
        } catch (err) {
          showToast(err.message, true);
        }
      }),
    });
  });

  $('api-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.apiUrl = $('set-api-url').value.trim();
    localStorage.setItem(STORAGE_KEYS.apiUrl, state.apiUrl);
    updateModeBanner();
    showToast('URL koneksi disimpan. Silakan login ulang jika berpindah server.');
  });

  $('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ user: state.user, data: state.data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nikahplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  $('btn-refresh').addEventListener('click', loadAllData);
  $('btn-logout').addEventListener('click', () => logout(true));

  initTheme();
  $('btn-theme-toggle').addEventListener('click', toggleTheme);

  const checkinUserId = new URLSearchParams(window.location.search).get('checkin');
  if (checkinUserId) {
    initCheckinView(checkinUserId);
  } else {
    renderAuthOrApp();
  }
});

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const lbl = $('theme-toggle-label');
  if (lbl) lbl.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
}

function initTheme() {
  const saved = localStorage.getItem('nikahplan_theme') || 'light';
  applyTheme(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nikahplan_theme', next);
  applyTheme(next);
}

function getCheckinUrl() {
  const base = window.location.origin + window.location.pathname;
  return `${base}?checkin=${encodeURIComponent(state.user.id)}`;
}

function openGuestQrModal() {
  if (!state.user?.id) return;
  const checkinUrl = getCheckinUrl();
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(checkinUrl)}`;
  state.modalContext = { type: 'qr' };
  $('modal-title').textContent = 'QR Absensi Tamu (1 Untuk Semua)';
  $('modal-fields').innerHTML = `
    <div class="qr-box">
      <p class="muted">Tamu cukup scan QR ini dengan kamera HP untuk langsung mengisi kehadiran (tanpa login).</p>
      <img class="qr-img" src="${qrImgUrl}" alt="QR Code Absensi Tamu" />
      <div class="qr-url-box">${escapeHtml(checkinUrl)}</div>
      <div class="btn-row">
        <button type="button" class="btn btn-outline" onclick="copyCheckinUrl('${escapeHtml(checkinUrl)}')">Salin Link</button>
        <a class="btn btn-primary" href="${escapeHtml(checkinUrl)}" target="_blank" rel="noopener">Buka Halaman Scan</a>
      </div>
    </div>
  `;
  document.querySelector('#modal-form .modal-actions').classList.add('hidden');
  $('modal-backdrop').classList.remove('hidden');
}

window.copyCheckinUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link absensi berhasil disalin!');
  } catch {
    showToast('Gagal menyalin, salin manual dari kotak link.', true);
  }
};

async function initCheckinView(userId) {
  $('auth-view').classList.add('hidden');
  $('app-view').classList.add('hidden');
  $('checkin-view').classList.remove('hidden');

  try {
    const info = await apiCall('publicEventInfo', { user_id: userId });
    $('checkin-couple').textContent = `${info.name} & ${info.partner_name}`;
    const dateStr = normalizeDateStr(info.wedding_date);
    $('checkin-date').textContent = dateStr ? `Buku Tamu • ${dateStr}` : 'Buku Tamu Pernikahan';
  } catch (err) {
    showToast(err.message, true);
  }

  $('checkin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('btn-checkin-submit');
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
    try {
      await apiCall('publicCheckin', {
        user_id: userId,
        name: $('ci-name').value.trim(),
        pax: $('ci-pax').value,
        group: $('ci-group').value,
        phone: $('ci-phone').value.trim(),
        notes: $('ci-notes').value.trim(),
      });
      $('checkin-form').classList.add('hidden');
      $('checkin-success').classList.remove('hidden');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Konfirmasi Hadir';
    }
  });

  $('btn-checkin-again').addEventListener('click', () => {
    $('checkin-form').reset();
    $('checkin-success').classList.add('hidden');
    $('checkin-form').classList.remove('hidden');
  });
}
