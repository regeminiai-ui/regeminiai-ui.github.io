/**
 * NikahPlan Frontend Controller
 * Supports Google Apps Script Web App API + automatic local Demo Mode when API URL is unset.
 */

// --- Origin Lock & Encrypted API Config ---
const SEALED_API_HOST = 'bfoHqr6ZujU7XzBTuHF4lFAC5c87q2l0IrBQwP4cn/gq/VybhsXseSpEFGiwPTmJcyS6jjbXY2kFyH/VqD3FuHLRMJX5+fBqFwh1CqcxPcVVGPf8FMl+dHuyTc3WIqfhXcUno6WRoXtwCh0VrX0zkA==';
const SEALED_API_OWNER = '5cucqnbZBUR32aJaMP4AmR5TR1HknniOuXZVvvdZlmqizMebToVTCGbChmE4skGEPXUYEOnicpOeDnqroXjMKvrgq5UxuU8bW47nAy++RcgbSVViy/xvjuB0SLPfZ65z1fS8o23RHgo8jI8cJfJLnQ==';
const OWNER_KEY_HASH = '8dbfe8da05e32a6b04bad033408a2efe713c203d81b01be1d45938df942bf919';
const OWNER_KEY_STORAGE = 'nikahplan_owner_key';

function sha256BytesSync(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const words = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (24 - (bitLen % 32));
  words[(((bitLen + 64) >> 9) << 4) + 15] = bitLen;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < words.length; i += 16) {
    const w = new Array(64);
    for (let t = 0; t < 16; t++) w[t] = words[i + t] | 0;
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push((H[i] >>> 24) & 0xff, (H[i] >>> 16) & 0xff, (H[i] >>> 8) & 0xff, H[i] & 0xff);
  }
  return bytes;
}

function sha256HexSync(str) {
  return sha256BytesSync(str).map((b) => ('0' + b.toString(16)).slice(-2)).join('');
}

function unsealTextSync(b64, pass) {
  try {
    const raw = atob(b64);
    const key = sha256BytesSync(pass);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) ^ key[i % key.length];
    const decoded = new TextDecoder().decode(bytes);
    return decoded.startsWith('https://script.google.com/') ? decoded : '';
  } catch (e) {
    return '';
  }
}

function resolveAuthorizedApiUrl() {
  const host = (window.location.hostname || '').toLowerCase();
  if (host === 'regeminiai-ui.github.io') {
    const url = unsealTextSync(SEALED_API_HOST, host);
    if (url) return url;
  }
  const savedOwnerKey = (localStorage.getItem(OWNER_KEY_STORAGE) || '').trim();
  if (savedOwnerKey && sha256HexSync(savedOwnerKey) === OWNER_KEY_HASH) {
    const url = unsealTextSync(SEALED_API_OWNER, savedOwnerKey);
    if (url) return url;
  }
  return '';
}

const DEFAULT_API_URL = resolveAuthorizedApiUrl();

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
    assets: [],
    activity_logs: [],
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
      { key: 'actual', label: 'Biaya Aktual (Rp)', type: 'currency', default: 0 },
      { key: 'paid', label: 'Sudah Dibayar (Rp)', type: 'currency', default: 0 },
      { key: 'status', label: 'Status Pembayaran', type: 'select', options: ['Belum Bayar', 'DP', 'Lunas'], default: 'Belum Bayar' },
      { key: 'notes', label: 'Catatan', type: 'text' },
      { key: 'receipt_url', label: 'Bukti Kwitansi (Foto / PDF ke Google Drive)', type: 'receipt' },
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
      { key: 'receipt_url', label: 'Bukti Kwitansi / Invoice (Foto / PDF ke Google Drive)', type: 'receipt' },
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
      { key: 'receipt_url', label: 'Bukti Foto / Dokumen (Wajib sebelum ceklist)', type: 'receipt' },
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
  assets: {
    title: 'Asset & File',
    fields: [
      { key: 'item_label', label: 'Judul / Nama File', type: 'text', required: true },
      { key: 'description', label: 'Keterangan (Tentang Apa)', type: 'text', required: true },
      { key: 'drive_url', label: 'File Foto / PDF (Google Drive)', type: 'receipt' },
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

function isDummyMode() {
  return Boolean(state.user?.is_dummy || state.token === 'dummy_preview_token');
}

const DUMMY_PREVIEW_DATA = {
  budgets: [
    {
      id: 'dum_b1',
      category: 'Venue & Dekorasi',
      item: 'Garden Venue + Dekorasi Rustic',
      actual: 18000000,
      paid: 9000000,
      status: 'DP',
      notes: 'Plan Intimate (Cafe/Garden)',
      installments_json: JSON.stringify([
        { amount: 5000000, date: '2026-11-01', note: 'Booking Fee', uploaded_by: 'dummy@gmail.com', uploaded_at: '2026-11-01T10:00:00Z' },
        { amount: 4000000, date: '2026-11-15', note: 'DP 50%', uploaded_by: 'pasangan@gmail.com', uploaded_at: '2026-11-15T14:30:00Z' },
      ]),
      created_by: 'dummy@gmail.com',
      updated_by: 'pasangan@gmail.com',
      updated_at: '2026-11-15T14:30:00Z',
    },
    {
      id: 'dum_b2',
      category: 'Catering',
      item: 'Buffet 120 Pax + 2 Gubukan',
      actual: 16000000,
      paid: 16000000,
      status: 'Lunas',
      notes: 'Plan Intimate (Cafe/Garden)',
      created_by: 'dummy@gmail.com',
      updated_by: 'dummy@gmail.com',
      updated_at: '2026-11-10T09:15:00Z',
    },
    {
      id: 'dum_b3',
      category: 'Busana & MUA',
      item: 'MUA & Attire Akad/Resepsi',
      actual: 7500000,
      paid: 0,
      status: 'Belum Bayar',
      notes: 'Rencana fitting bulan depan',
      created_by: 'pasangan@gmail.com',
      created_at: '2026-11-20T11:00:00Z',
    },
  ],
  guests: [
    { id: 'dum_g1', name: 'Keluarga Bpk. Hendra', side: 'Mempelai Pria', group: 'Keluarga', pax: 4, rsvp: 'Hadir', phone: '0812xxxx', created_by: 'dummy@gmail.com', created_at: '2026-11-05T08:00:00Z' },
    { id: 'dum_g2', name: 'Rina & Partner', side: 'Mempelai Wanita', group: 'Teman', pax: 2, rsvp: 'Belum', phone: '0856xxxx', created_by: 'pasangan@gmail.com', created_at: '2026-11-06T12:00:00Z' },
  ],
  vendors: [
    { id: 'dum_v1', category: 'Foto & Video', name: 'Lensa Bahagia Studio', pic: 'Dimas', phone: '@lensabahagia', price: 5500000, dp_paid: 2000000, status: 'Deal', created_by: 'dummy@gmail.com', updated_at: '2026-11-12T16:00:00Z' },
  ],
  checklists: [
    { id: 'dum_c1', phase: 'H-3 Bulan', task: 'Food tasting menu catering', pic: 'Raka & Nadia', due_date: '2027-03-20', done: 'Belum', created_by: 'dummy@gmail.com', created_at: '2026-11-01T09:00:00Z' },
    { id: 'dum_c2', phase: 'H-6 Bulan', task: 'Survei & DP venue garden', pic: 'Raka', due_date: '2026-12-20', done: 'Selesai', created_by: 'dummy@gmail.com', updated_at: '2026-11-15T14:30:00Z' },
  ],
  rundowns: [
    { id: 'dum_r1', event_name: 'Akad / Pemberkatan', start_time: '08:00', end_time: '09:30', activity: 'Prosesi Akad Nikah', pic: 'Penghulu & WO', location: 'Pendopo Garden', created_by: 'dummy@gmail.com', created_at: '2026-11-10T10:00:00Z' },
    { id: 'dum_r2', event_name: 'Resepsi', start_time: '11:00', end_time: '14:00', activity: 'Ramah Tamah & Foto Bersama', pic: 'MC & WO', location: 'Area Taman', created_by: 'pasangan@gmail.com', created_at: '2026-11-10T10:15:00Z' },
  ],
  assets: [
    { id: 'dum_a1', module: 'budgets', item_label: 'Garden Venue + Dekorasi Rustic', file_name: 'kwitansi-dp-venue.jpg', drive_url: '', description: 'Contoh bukti DP 50% (Mode Preview)', uploaded_by: 'pasangan@gmail.com', uploaded_at: '2026-11-15T14:30:00Z', created_at: '2026-11-15T14:30:00Z', created_by: 'pasangan@gmail.com' },
  ],
};

// --- API Layer (Google Apps Script + Demo Fallback) ---
async function apiCall(action, payload = {}) {
  if (action === 'login') {
    const email = String(payload.email || '').trim().toLowerCase();
    const pass = String(payload.password || '');
    if (email === 'dummy@gmail.com' && pass === '123456') {
      return {
        token: 'dummy_preview_token',
        user: {
          id: 'dummy_preview',
          email: 'dummy@gmail.com',
          partner_email: 'pasangan@gmail.com',
          actor_email: 'dummy@gmail.com',
          name: 'Raka',
          partner_name: 'Nadia',
          wedding_date: '2027-06-20',
          tier: 'medium',
          status: 'active',
          is_dummy: true,
        },
      };
    }
  }

  if (isDummyMode()) {
    if (action === 'getAll') {
      return {
        ...JSON.parse(JSON.stringify(DUMMY_PREVIEW_DATA)),
        activity_logs: [],
        plan: { tier: 'medium', status: 'active', expires_at: '', is_expired: false },
      };
    }
    throw new Error('Mode Preview (Dummy): Fitur ubah/simpan/hapus dimatikan. Daftar dengan Kode Lisensi untuk akun penuh.');
  }

  if (isDemoMode()) {
    return demoApiCall(action, payload);
  }

  // Use text/plain to avoid CORS preflight OPTIONS on Google Apps Script
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let res;
  try {
    res = await fetch(state.apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: state.token, payload }),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Koneksi ke server timeout (30 detik). Coba Refresh.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

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
    const partnerEmail = (payload.partner_email || '').trim().toLowerCase();
    const code = (payload.license_code || '').trim().toUpperCase();
    const demoCodes = { 'DEMO-SED': ['sederhana', 180], 'DEMO-MED': ['medium', 180], 'DEMO-RCH': ['rich', 395] };
    const [tier, days] = demoCodes[code] || ['rich', 395];
    if (!code) throw new Error('Kode Lisensi wajib diisi (Mode Demo: DEMO-SED / DEMO-MED / DEMO-RCH).');
    if (db.users.some((u) => u.email === email || (u.partner_email && u.partner_email === email))) {
      throw new Error('Email sudah terdaftar.');
    }
    if (partnerEmail && (partnerEmail === email || db.users.some((u) => u.email === partnerEmail || u.partner_email === partnerEmail))) {
      throw new Error('Email pasangan tidak valid atau sudah dipakai.');
    }
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    const user = {
      id: uid(),
      email,
      partner_email: tier === 'sederhana' ? '' : partnerEmail,
      password: payload.password,
      name: payload.name,
      partner_name: payload.partner_name,
      wedding_date: payload.wedding_date || '',
      tier,
      status: 'active',
      expires_at: expiresAt,
      license_code: code,
    };
    db.users.push(user);
    saveDemoDb(db);
    const { password, ...safeUser } = user;
    return { token: 'demo_' + user.id, user: safeUser };
  }

  if (action === 'redeemLicense') {
    const code = (payload.license_code || '').trim().toUpperCase();
    const demoCodes = { 'DEMO-SED': ['sederhana', 180], 'DEMO-MED': ['medium', 180], 'DEMO-RCH': ['rich', 395] };
    if (!demoCodes[code]) throw new Error('Kode tidak valid (Mode Demo: DEMO-SED / DEMO-MED / DEMO-RCH).');
    const [newTier, days] = demoCodes[code];
    const userId = state.token.replace('demo_', '');
    const currentUser = db.users.find((u) => u.id === userId);
    if (!currentUser) throw new Error('Sesi tidak valid.');
    currentUser.tier = newTier;
    currentUser.status = 'active';
    const baseMs = currentUser.expires_at ? Math.max(Date.now(), new Date(currentUser.expires_at).getTime()) : Date.now();
    currentUser.expires_at = new Date(baseMs + days * 86400000).toISOString();
    saveDemoDb(db);
    const { password, ...safeUser } = currentUser;
    return { user: safeUser };
  }

  if (action === 'login') {
    const email = (payload.email || '').trim().toLowerCase();
    const user = db.users.find((u) => (u.email === email || u.partner_email === email) && u.password === payload.password);
    if (!user) throw new Error('Email atau password salah.');
    const { password, ...safeUser } = user;
    return { token: 'demo_' + user.id, user: safeUser };
  }

  if (action === 'publicEventInfo') {
    const u = db.users.find((x) => x.id === payload.user_id);
    if (!u) throw new Error('Acara tidak ditemukan.');
    const g = payload.guest_id ? db.guests.find((x) => x.id === payload.guest_id && x.user_id === u.id) : null;
    return {
      name: u.name,
      partner_name: u.partner_name,
      wedding_date: u.wedding_date,
      guest: g ? { id: g.id, name: g.name, pax: g.pax, rsvp: g.rsvp } : null,
    };
  }

  if (action === 'publicGuestQrCheckin') {
    const idx = db.guests.findIndex((x) => x.id === payload.guest_id && x.user_id === payload.user_id);
    if (idx === -1) throw new Error('Data tamu tidak ditemukan.');
    db.guests[idx].rsvp = 'Hadir';
    db.guests[idx].updated_at = new Date().toISOString();
    db.guests[idx].updated_by = db.guests[idx].name + ' (QR Scan)';
    saveDemoDb(db);
    return { guest: db.guests[idx] };
  }

  if (action === 'publicPricing') {
    return { pricing: db.pricing || getDefaultPricing() };
  }

  if (action && action.startsWith('admin')) {
    const demoKey = localStorage.getItem('nikahplan_demo_admin_key');
    if (!demoKey || payload.admin_key !== demoKey) {
      throw new Error('Mode Demo aktif: hubungkan URL Google Apps Script untuk login Admin.');
    }
    db.licenses = db.licenses || [];
    db.payments = db.payments || [];
    if (action === 'adminDashboard') {
      return {
        users: db.users,
        licenses: [...db.licenses].reverse(),
        payments: [...db.payments].reverse(),
        pricing: db.pricing || getDefaultPricing(),
      };
    }
    if (action === 'adminDeleteLicense') {
      const idx = db.licenses.findIndex((x) => x.code === payload.code);
      if (idx === -1) throw new Error('Kode tidak ditemukan.');
      if (db.licenses[idx].status !== 'unused') throw new Error('Hanya kode unused yang bisa dihapus.');
      db.licenses.splice(idx, 1);
      saveDemoDb(db);
      return { deleted: true };
    }
    if (action === 'adminDeleteUnusedLicenses') {
      const before = db.licenses.length;
      db.licenses = db.licenses.filter((x) => x.status !== 'unused');
      saveDemoDb(db);
      return { deleted: before - db.licenses.length };
    }
    if (action === 'adminSavePricing') {
      db.pricing = payload.pricing || getDefaultPricing();
      saveDemoDb(db);
      return { pricing: db.pricing };
    }
    if (action === 'adminGenerateCodes') {
      const daysMap = { sederhana: 180, medium: 180, rich: 395 };
      const preMap = { sederhana: 'SED', medium: 'MED', rich: 'RCH' };
      const codes = [];
      for (let i = 0; i < (Number(payload.count) || 5); i++) {
        const c = `MWP-${preMap[payload.tier] || 'GEN'}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        db.licenses.push({ code: c, tier: payload.tier, duration_days: daysMap[payload.tier] || 180, status: 'unused', used_by_email: '', used_at: '', created_at: new Date().toISOString() });
        codes.push(c);
      }
      saveDemoDb(db);
      return { codes };
    }
    if (action === 'adminConfirmPayment') {
      const c = `MWP-${(payload.tier || 'med').slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      db.licenses.push({ code: c, tier: payload.tier, duration_days: payload.tier === 'rich' ? 395 : 180, status: 'unused', used_by_email: '', used_at: '', created_at: new Date().toISOString() });
      const pay = { id: uid(), buyer_email: payload.buyer_email, tier: payload.tier, amount: payload.amount || 0, method: payload.method || '', license_code: c, confirmed_at: new Date().toISOString() };
      db.payments.push(pay);
      saveDemoDb(db);
      return { payment: pay, license_code: c };
    }
    if (action === 'adminSetUserStatus') {
      const u = db.users.find((x) => x.id === payload.user_id);
      if (!u) throw new Error('User tidak ditemukan.');
      u.status = payload.status;
      saveDemoDb(db);
      return { user_id: u.id, status: u.status };
    }
    if (action === 'adminDeleteUser') {
      db.users = db.users.filter((x) => x.id !== payload.user_id);
      ['budgets', 'guests', 'vendors', 'checklists', 'rundowns', 'assets'].forEach((m) => {
        db[m] = (db[m] || []).filter((x) => x.user_id !== payload.user_id);
      });
      saveDemoDb(db);
      return { deleted: true };
    }
    if (action === 'adminUpdateKey') {
      localStorage.setItem('nikahplan_demo_admin_key', payload.new_key);
      return { updated: true };
    }
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
    currentUser.partner_email = (payload.partner_email || '').trim().toLowerCase();
    currentUser.drive_folder_id = (payload.drive_folder_id || '').trim();
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
      assets: (db.assets || []).filter((r) => r.user_id === userId),
      activity_logs: (db.activity_logs || []).filter((r) => r.user_id === userId).slice(-30).reverse(),
    };
  }

  if (action === 'uploadReceipt') {
    const now = new Date().toISOString();
    const actor = state.user?.actor_email || currentUser.email;
    const url = '#demo-receipt-' + encodeURIComponent(payload.filename || 'kwitansi.jpg');
    const asset = {
      id: uid(),
      user_id: userId,
      module: payload.module || 'assets',
      item_label: payload.item_label || payload.filename,
      file_name: payload.filename,
      drive_url: url,
      description: payload.description || '',
      uploaded_by: actor,
      uploaded_at: now,
      created_at: now,
      created_by: actor,
      updated_at: now,
      updated_by: actor,
    };
    db.assets = db.assets || [];
    db.assets.push(asset);
    saveDemoDb(db);
    return {
      url,
      uploaded_at: now,
      uploaded_by: actor,
      asset,
    };
  }

  if (action === 'upsertItem') {
    const { module, item } = payload;
    const list = db[module];
    if (!list) throw new Error('Modul tidak dikenal');
    const now = new Date().toISOString();
    const actor = state.user?.actor_email || currentUser.email;
    db.activity_logs = db.activity_logs || [];
    if (item.id) {
      const idx = list.findIndex((r) => r.id === item.id && r.user_id === userId);
      if (idx === -1) throw new Error('Data tidak ditemukan');
      list[idx] = {
        ...list[idx],
        ...item,
        user_id: userId,
        created_at: list[idx].created_at || now,
        created_by: list[idx].created_by || actor,
        updated_at: now,
        updated_by: actor,
      };
      db.activity_logs.push({ id: uid(), user_id: userId, action: 'UPDATE', module, item_label: item.item || item.name || item.task || item.activity || module, actor_email: actor, created_at: now });
      saveDemoDb(db);
      return { item: list[idx] };
    } else {
      const created = {
        ...item,
        id: uid(),
        user_id: userId,
        created_at: now,
        created_by: actor,
        updated_at: now,
        updated_by: actor,
      };
      list.push(created);
      db.activity_logs.push({ id: uid(), user_id: userId, action: 'CREATE', module, item_label: item.item || item.name || item.task || item.activity || module, actor_email: actor, created_at: now });
      saveDemoDb(db);
      return { item: created };
    }
  }

  if (action === 'deleteItem') {
    const { module, id } = payload;
    const target = db[module].find((r) => r.id === id && r.user_id === userId);
    db[module] = db[module].filter((r) => !(r.id === id && r.user_id === userId));
    db.activity_logs = db.activity_logs || [];
    const actor = state.user?.actor_email || currentUser.email;
    db.activity_logs.push({ id: uid(), user_id: userId, action: 'DELETE', module, item_label: target?.item || target?.name || target?.task || target?.activity || id, actor_email: actor, created_at: new Date().toISOString() });
    saveDemoDb(db);
    return { deleted: true };
  }

  if (action === 'resetUserData') {
    ['budgets', 'guests', 'vendors', 'checklists', 'rundowns', 'assets'].forEach((m) => {
      db[m] = (db[m] || []).filter((r) => r.user_id !== userId);
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
  if (isDemoMode()) {
    banner.textContent = 'Mode Demo Aktif (data tersimpan di browser ini).';
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function getDefaultPricing() {
  return {
    promo_banner: '',
    sederhana: { price: 79000, promo_price: 0, promo_label: '' },
    medium: { price: 149000, promo_price: 0, promo_label: '' },
    rich: { price: 249000, promo_price: 0, promo_label: '' },
    konglo: { price: 349000, promo_price: 0, promo_label: '' },
  };
}

function formatPriceRp(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function renderPricingShowcase(pricingData) {
  const p = { ...getDefaultPricing(), ...(pricingData || {}) };
  const bannerEl = $('pricing-promo-banner');
  if (bannerEl) {
    if (p.promo_banner && p.promo_banner.trim()) {
      bannerEl.innerHTML = `<span class="promo-banner-icon">&#10024;</span> <span>${escapeHtml(p.promo_banner.trim())}</span>`;
      bannerEl.classList.remove('hidden');
    } else {
      bannerEl.innerHTML = '';
      bannerEl.classList.add('hidden');
    }
  }

  const gridEl = $('pricing-grid');
  if (!gridEl) return;

  const tiers = [
    {
      key: 'sederhana',
      name: 'Sederhana',
      subtitle: 'Untuk persiapan personal',
      featured: false,
      defaultBadge: '',
      features: [
        'Masa Aktif 6 Bulan',
        '1 Akun (Single)',
        'Overview & Countdown Pernikahan',
        '2 Template Rencana (KUA Hemat & Sederhana)',
        'Rencana Anggaran (Budget)',
        'Daftar Tamu & RSVP',
        'Checklist Tugas',
        'Backup Data JSON',
      ],
    },
    {
      key: 'medium',
      name: 'Medium',
      subtitle: 'Kolaborasi lengkap berdua',
      featured: false,
      defaultBadge: '',
      features: [
        'Masa Aktif 6 Bulan',
        '2 Akun Pasangan (Sync Real-time)',
        'Semua Fitur Sederhana & Semua Template',
        'Vendor, Kontrak & Upload Kwitansi',
        'Rundown Acara & Tabungan / Cicilan',
        'Moodboard / Aset & Dark Mode',
        'Self Check-In Tamu (QR Umum)',
        'Backup Data JSON & Laporan PDF',
      ],
    },
    {
      key: 'rich',
      name: 'Rich',
      subtitle: 'Eksklusif tanpa batas',
      featured: true,
      defaultBadge: 'Paling Lengkap',
      features: [
        'Masa Aktif 13 Bulan (12 + 1 Bonus)',
        'Semua Fitur Medium',
        'Tema Eksklusif Neumorphism (Light & Dark)',
        'Backup Data JSON, Excel & PDF',
        'Link QR & Undangan Personal per Tamu',
        'Tanpa Watermark di Halaman Check-In',
        'Custom Folder Google Drive Pribadi',
        'Riwayat Aktivitas (Audit Log) Pasangan',
      ],
    },
    {
      key: 'konglo',
      name: 'Konglo',
      subtitle: 'Sultan + AI Planner otomatis',
      featured: true,
      defaultBadge: 'VIP AI',
      features: [
        'Masa Aktif 15 + 3 Bulan Bonus',
        'Semua Fitur Rich',
        'AI Wedding Plan Generator (Rekomendasi Otomatis)',
        'Simpan & Kelola Banyak Konsep Pernikahan',
        'Terapkan Plan AI Langsung ke Budget & Checklist',
      ],
    },
  ];

  gridEl.innerHTML = tiers.map((t) => {
    const cfg = p[t.key] || { price: 0, promo_price: 0, promo_label: '' };
    const normalPrice = Number(cfg.price || 0);
    const promoPrice = Number(cfg.promo_price || 0);
    const hasPromo = promoPrice > 0 && promoPrice < normalPrice;
    const discountPct = hasPromo ? Math.round(((normalPrice - promoPrice) / normalPrice) * 100) : 0;
    const effectivePrice = hasPromo ? promoPrice : normalPrice;
    const customLabel = (cfg.promo_label || '').trim();
    const badgeText = customLabel || (hasPromo ? `Hemat ${discountPct}%` : t.defaultBadge);
    const isBestSeller = /best\s*seller/i.test(badgeText);
    const isKonglo = t.key === 'konglo';

    const priceHtml = hasPromo
      ? `
        <div class="price-block">
          <div class="price-promo-row">
            <span class="price-original">${formatPriceRp(normalPrice)}</span>
            <span class="price-discount-pill">-${discountPct}%</span>
          </div>
          <div class="price-tag is-promo">${formatPriceRp(promoPrice)}</div>
        </div>`
      : `
        <div class="price-block">
          <div class="price-tag">${formatPriceRp(normalPrice)}</div>
        </div>`;

    const waMsg = encodeURIComponent(`Halo Admin Ahmad Husain, saya mau beli paket ${t.name} My Weeding Plan (${formatPriceRp(effectivePrice)}).`);
    const waUrl = `https://wa.me/6289509901360?text=${waMsg}`;

    const ribbonCls = isBestSeller
      ? 'is-best-seller'
      : (isKonglo ? 'is-konglo' : (hasPromo || customLabel ? 'is-promo' : 'is-default'));

    return `
      <div class="card pricing-card${t.featured ? ' featured' : ''}${hasPromo ? ' has-promo' : ''}${isBestSeller ? ' is-best-seller' : ''}${isKonglo ? ' is-konglo' : ''}">
        ${badgeText ? `<div class="pricing-ribbon ${ribbonCls}">${escapeHtml(badgeText)}</div>` : ''}
        <div class="pricing-card-head">
          <div>
            <h4>${escapeHtml(t.name)}</h4>
            <p class="pricing-sub">${escapeHtml(t.subtitle)}</p>
          </div>
        </div>
        ${priceHtml}
        <ul class="pricing-features">${t.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        <a class="btn ${t.featured ? 'btn-primary' : 'btn-outline'} btn-full pricing-cta" href="${waUrl}" target="_blank" rel="noopener">Beli</a>
      </div>
    `;
  }).join('');
}

async function loadPublicPricing() {
  renderPricingShowcase(getDefaultPricing());
  try {
    const res = await apiCall('publicPricing', {});
    if (res && res.pricing) renderPricingShowcase(res.pricing);
  } catch (e) {
    // Keep default pricing silently if offline or backend not yet updated
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
    loadPublicPricing();
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

function formatDateId(val) {
  const iso = normalizeDateStr(val);
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatTimeId(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{2}:\d{2}/.test(s)) {
    return s.slice(0, 5).replace(':', '.');
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}.${mm}`;
  }
  return s;
}

function getUserTier() {
  return String(state.user?.tier || 'rich').toLowerCase();
}

function isAccountExpired() {
  const exp = state.user?.expires_at;
  if (!exp) return false;
  return Date.now() > new Date(exp).getTime();
}

function getTierCaps() {
  const t = getUserTier();
  return {
    tier: t,
    collab: t !== 'sederhana',
    vendors: t !== 'sederhana',
    rundowns: t !== 'sederhana',
    assets: t !== 'sederhana',
    receipts: t !== 'sederhana',
    cicilan: t !== 'sederhana',
    darkMode: t !== 'sederhana',
    glassTheme: t === 'rich' || t === 'konglo',
    backupPdf: t !== 'sederhana',
    backupExcel: t === 'rich' || t === 'konglo',
    qrGeneral: t !== 'sederhana',
    qrPersonal: t === 'rich' || t === 'konglo',
    customDrive: t === 'rich' || t === 'konglo',
    auditLog: t === 'rich' || t === 'konglo',
    aiPlanner: t === 'konglo',
    allPlans: t !== 'sederhana',
  };
}

function applyTierUi() {
  if (!state.user) return;
  const caps = getTierCaps();
  const expired = isAccountExpired();
  const tierLabels = {
    sederhana: 'Paket Sederhana',
    medium: 'Paket Medium',
    rich: 'Paket Rich',
    konglo: 'Paket Konglo',
  };
  const label = tierLabels[caps.tier] || 'Paket Rich';

  const exp = state.user.expires_at;
  let daysLeftText = 'Aktif Selamanya';
  if (exp) {
    const diff = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000);
    daysLeftText = diff > 0 ? `Sisa ${diff} hari` : 'Masa Aktif Habis';
  }

  const badge = $('plan-badge');
  if (badge) {
    badge.textContent = isDummyMode() ? 'Mode Preview (Dummy)' : `${label} • ${daysLeftText}`;
    badge.className = `badge ${isDummyMode() ? 'badge-warn' : (expired ? 'badge-bad' : 'badge-ok')}`;
  }
  const infoEl = $('settings-plan-info');
  if (infoEl) {
    infoEl.textContent = isDummyMode()
      ? 'Akun Dummy Preview (fitur Rich disembunyikan & edit/simpan dimatikan).'
      : `Paket saat ini: ${label} • ${daysLeftText}${exp ? ` (s/d ${formatDateId(exp)})` : ''}.`;
  }
  const expBanner = $('expired-banner');
  if (expBanner) {
    if (isDummyMode()) {
      expBanner.innerHTML = '<strong>Mode Preview (Akun Dummy)</strong>: Anda sedang melihat preview aplikasi (fitur khusus paket Rich disembunyikan &amp; fitur simpan/hapus/upload dimatikan).';
      expBanner.classList.remove('hidden');
    } else {
      expBanner.innerHTML = 'Masa aktif paket Anda telah berakhir (<strong>Mode Baca Saja</strong>). Silakan masukkan Kode Lisensi perpanjang di menu <strong>Pengaturan</strong> untuk mengaktifkan kembali.';
      expBanner.classList.toggle('hidden', !expired);
    }
  }

  // Toggle nav items & sections by tier
  document.querySelector('[data-tab="vendors"]')?.classList.toggle('hidden', !caps.vendors);
  document.querySelector('[data-tab="rundowns"]')?.classList.toggle('hidden', !caps.rundowns);
  document.querySelector('[data-tab="assets"]')?.classList.toggle('hidden', !caps.assets);
  $('btn-theme-toggle')?.classList.toggle('hidden', !caps.darkMode);
  if (!caps.darkMode) applyTheme('light');
  $('btn-style-toggle')?.classList.toggle('hidden', !caps.glassTheme);
  if (!caps.glassTheme) {
    applyUiStyle('default');
  } else {
    applyUiStyle(localStorage.getItem('nikahplan_ui_style') || 'default');
  }
  $('btn-show-qr')?.classList.toggle('hidden', !caps.qrGeneral);
  $('btn-export-pdf')?.classList.toggle('hidden', !caps.backupPdf);
  $('btn-export-excel')?.classList.toggle('hidden', !caps.backupExcel);
  document.querySelector('.activity-card')?.classList.toggle('hidden', !caps.auditLog);
  $('set-partner-email')?.closest('.field')?.classList.toggle('hidden', !caps.collab);
  $('set-drive-folder')?.closest('.field')?.classList.toggle('hidden', !caps.customDrive);

  // Read-only lock when expired or dummy preview
  const locked = expired || isDummyMode();
  document.querySelectorAll('[data-add], #btn-reset-all, #profile-form button[type="submit"], #redeem-form button[type="submit"], #btn-export-json, #btn-export-pdf, #btn-export-excel, #btn-show-qr').forEach((el) => {
    el.disabled = locked;
  });
}

function renderUserHeader() {
  const u = state.user;
  const dateStr = normalizeDateStr(u.wedding_date);
  $('sidebar-couple').textContent = `${u.name} & ${u.partner_name}`;
  $('set-name').value = u.name || '';
  $('set-partner').value = u.partner_name || '';
  $('set-partner-email').value = u.partner_email || '';
  $('set-drive-folder').value = u.drive_folder_id || '';
  $('set-date').value = dateStr;
  $('set-api-url').value = state.apiUrl || '';

  const cd = $('wedding-countdown');
  if (dateStr) {
    const prettyDate = formatDateId(dateStr);
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) cd.textContent = `H-${diffDays} menuju hari bahagia (${prettyDate})`;
    else if (diffDays === 0) cd.textContent = 'Hari ini adalah Hari Pernikahan Anda!';
    else cd.textContent = `Tanggal pernikahan: ${prettyDate}`;
  } else {
    cd.textContent = 'Atur tanggal pernikahan di Pengaturan';
  }
  applyTierUi();
}

async function loadAllData() {
  const mc = document.querySelector('#app-view .main-content');
  mc?.classList.add('is-loading');
  try {
    const res = await apiCall('getAll');
    if (res.plan && state.user) {
      state.user.tier = res.plan.tier;
      state.user.status = res.plan.status;
      state.user.expires_at = res.plan.expires_at;
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user));
      applyTierUi();
    }
    state.data = {
      budgets: res.budgets || [],
      guests: res.guests || [],
      vendors: res.vendors || [],
      checklists: res.checklists || [],
      rundowns: res.rundowns || [],
      assets: res.assets || [],
      activity_logs: res.activity_logs || [],
    };
    renderAll();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    mc?.classList.remove('is-loading');
  }
}

function formatDateTimeId(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d) + ' WIB';
}

function resolveDisplayEmail(raw) {
  const s = String(raw || '').trim();
  if (s && s.includes('@')) return s;
  return state.user?.actor_email || state.user?.email || '-';
}

function auditCellsHtml(row) {
  const hasUpdated = Boolean(row.updated_at && String(row.updated_at).trim());
  const rawDate = hasUpdated ? row.updated_at : row.created_at;
  const rawUser = hasUpdated ? (row.updated_by || row.created_by) : (row.created_by || row.updated_by);
  const email = resolveDisplayEmail(rawUser);
  const formattedDate = formatDateTimeId(rawDate) || '-';
  return `
    <td data-label="User">${escapeHtml(email)}</td>
    <td data-label="Tanggal">${escapeHtml(formattedDate)}</td>
  `;
}

function parseInstallments(row) {
  if (!row || !row.installments_json) return [];
  try {
    const arr = typeof row.installments_json === 'string'
      ? JSON.parse(row.installments_json)
      : row.installments_json;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function installmentsHtml(row) {
  const list = parseInstallments(row);
  if (!list.length) return '';
  const total = list.reduce((s, x) => s + Number(x.amount || 0), 0);
  return `
    <div class="installment-box">
      <strong>Cicilan (${list.length}x • Total ${formatRp(total)}):</strong>
      <ul class="installment-list">
        ${list.map((c, idx) => {
          const who = resolveDisplayEmail(c.uploaded_by);
          const when = formatDateTimeId(c.uploaded_at || c.date) || formatDateId(c.date) || '-';
          return `
            <li class="installment-row">
              <div>
                <span>#${idx + 1} ${formatRp(c.amount)}${c.note ? ` (${escapeHtml(c.note)})` : ''}</span>
                <div class="audit-meta">${escapeHtml(who)} • ${escapeHtml(when)}</div>
              </div>
              ${c.receipt_url ? `<a class="receipt-link" href="${escapeHtml(c.receipt_url)}" target="_blank" rel="noopener">Bukti</a>` : ''}
            </li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

function receiptHtml(row) {
  if (!row.receipt_url) return '';
  const meta = row.receipt_uploaded_by
    ? ` (${escapeHtml(row.receipt_uploaded_by)}, ${escapeHtml(formatDateTimeId(row.receipt_uploaded_at))})`
    : '';
  return `<div><a class="receipt-link" href="${escapeHtml(row.receipt_url)}" target="_blank" rel="noopener">Lihat Bukti Kwitansi</a><span class="audit-meta">${meta}</span></div>`;
}

function pushLocalLog(actionName, mod, label) {
  state.data.activity_logs = [
    {
      id: 'local_' + Date.now(),
      action: actionName,
      module: mod,
      item_label: label,
      actor_email: state.user?.actor_email || state.user?.email || '-',
      created_at: new Date().toISOString(),
    },
    ...(state.data.activity_logs || []),
  ].slice(0, 30);
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
  renderAssets();
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

function renderAiPlans() {
  const section = $('ai-planner-section');
  const listEl = $('ai-plans-list');
  if (!section || !listEl) return;
  const caps = getTierCaps();
  section.classList.toggle('hidden', !caps.aiPlanner);
  if (!caps.aiPlanner || !window.NikahAiPlanner) {
    listEl.innerHTML = '';
    return;
  }
  const saved = window.NikahAiPlanner.loadSavedPlans(state.user?.id);
  listEl.innerHTML = saved.length
    ? saved.map((plan) => {
        const totalEst = (plan.budgets || []).reduce((s, b) => s + Number(b.estimated || 0), 0);
        return `
          <article class="card plan-card">
            <div class="plan-card-head">
              <h3>${escapeHtml(plan.name)}</h3>
              <span class="badge badge-promo">${escapeHtml(plan.badge || 'AI')}</span>
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
            <div class="plan-card-footer btn-row">
              <button type="button" class="btn btn-primary" style="flex:1" ${isDummyMode() ? 'disabled' : ''} onclick="applyAiPlan('${escapeHtml(plan.id)}', this)">Terapkan</button>
              <button type="button" class="btn btn-danger" onclick="deleteAiPlan('${escapeHtml(plan.id)}')">Hapus</button>
            </div>
          </article>`;
      }).join('')
    : '<p class="muted">Belum ada rencana AI tersimpan. Tulis konsep pernikahan Anda di atas lalu klik Buat Rencana Otomatis.</p>';
}

function renderPlans() {
  renderAiPlans();
  const container = $('plans-grid');
  if (!container) return;
  const caps = getTierCaps();
  const list = caps.allPlans
    ? WEDDING_PLANS
    : WEDDING_PLANS.filter((p) => p.id === 'kua-hemat' || p.id === 'sederhana');
  container.innerHTML = list.map((plan) => {
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
          <button type="button" class="btn btn-primary btn-full" ${isDummyMode() ? 'disabled' : ''} onclick="applyWeddingPlan('${plan.id}', this)">Terapkan ${escapeHtml(plan.name)}</button>
        </div>
      </article>
    `;
  }).join('');
}

function executeApplyPlan(plan, btnEl) {
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
            item: { ...b, actual: b.estimated, paid: 0, status: 'Belum Bayar', notes: plan.name },
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
}

window.applyWeddingPlan = async (planId, btnEl) => {
  const plan = WEDDING_PLANS.find((p) => p.id === planId);
  executeApplyPlan(plan, btnEl);
};

window.applyAiPlan = async (planId, btnEl) => {
  if (!window.NikahAiPlanner) return;
  const plan = window.NikahAiPlanner.loadSavedPlans(state.user?.id).find((p) => p.id === planId);
  executeApplyPlan(plan, btnEl);
};

window.deleteAiPlan = (planId) => {
  if (!window.NikahAiPlanner) return;
  window.NikahAiPlanner.deletePlan(state.user?.id, planId);
  renderAiPlans();
  showToast('Plan AI dihapus dari browser.');
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

  const sortedChecklist = [...checklists].sort((a, b) => {
    const aDone = a.done === 'Selesai' ? 1 : 0;
    const bDone = b.done === 'Selesai' ? 1 : 0;
    return aDone - bDone;
  });
  $('dash-checklist').innerHTML = sortedChecklist.length
    ? sortedChecklist.map((c) => {
        const isDone = c.done === 'Selesai';
        return `
          <li>
            <span style="${isDone ? 'text-decoration:line-through;color:var(--muted)' : ''}">
              ${escapeHtml(c.task)}
              <small class="muted">(${escapeHtml(c.phase)})</small>
            </span>
            <label class="dash-check-right">
              <span class="badge ${isDone ? 'badge-ok' : 'badge-neutral'}">${isDone ? 'Sudah' : 'Belum'}</span>
              <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleChecklist('${c.id}', this.checked)" />
            </label>
          </li>`;
      }).join('')
    : '<li class="muted">Belum ada tugas checklist.</li>';

  const sortedRundown = [...rundowns].sort((a, b) => formatTimeId(a.start_time).localeCompare(formatTimeId(b.start_time))).slice(0, 5);
  $('dash-rundown').innerHTML = sortedRundown.length
    ? sortedRundown.map((r) => `<li><span>${escapeHtml(formatTimeId(r.start_time))} WIB - ${escapeHtml(r.activity)}</span><span class="muted">${escapeHtml(r.event_name)}</span></li>`).join('')
    : '<li class="muted">Belum ada jadwal rundown.</li>';

  const logs = (state.data.activity_logs || []).slice(0, 10);
  const actionLabels = {
    CREATE: 'Simpan',
    UPDATE: 'Update',
    DELETE: 'Hapus',
    UPLOAD_RECEIPT: 'Upload Bukti',
    RESET_ALL: 'Reset Data',
  };
  const logEl = $('dash-activity');
  if (logEl) {
    logEl.innerHTML = logs.length
      ? logs.map((l) => `
        <li>
          <span><strong>${escapeHtml(actionLabels[l.action] || l.action)}</strong> • ${escapeHtml(l.item_label)} <small class="muted">(${escapeHtml(l.module)})</small></span>
          <span class="muted">${escapeHtml(resolveDisplayEmail(l.actor_email))} • ${escapeHtml(formatDateTimeId(l.created_at))}</span>
        </li>`).join('')
      : '<li class="muted">Belum ada riwayat aktivitas.</li>';
  }
}

function actionButtons(module, id) {
  if (isDummyMode()) {
    return `<span class="muted" style="font-size:0.78rem">Preview</span>`;
  }
  const caps = getTierCaps();
  const cicilanBtn = (caps.cicilan && (module === 'budgets' || module === 'vendors'))
    ? `<button type="button" class="btn btn-sm btn-outline" onclick="openInstallmentModal('${module}', '${id}')">+ Cicilan</button>`
    : '';
  const guestLinkBtn = (caps.qrPersonal && module === 'guests')
    ? `<button type="button" class="btn btn-sm btn-outline" onclick="copyGuestPersonalLink('${id}')">Link Scan</button>`
    : '';
  return `<div class="action-btns">
    ${cicilanBtn}
    ${guestLinkBtn}
    <button type="button" class="btn btn-sm btn-outline" onclick="openEditModal('${module}', '${id}')">Edit</button>
    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('${module}', '${id}')">Hapus</button>
  </div>`;
}

function renderBudgets() {
  const q = $('filter-budget-search').value.toLowerCase();
  const st = $('filter-budget-status').value;
  const rows = state.data.budgets
    .filter((b) =>
      (!q || (b.item + ' ' + b.category).toLowerCase().includes(q)) &&
      (!st || b.status === st)
    )
    .sort((a, b) => (a.status === 'Lunas' ? 1 : 0) - (b.status === 'Lunas' ? 1 : 0));
  $('tbody-budgets').innerHTML = rows.length
    ? rows.map((b) => {
        const aktual = Number(b.actual || b.estimated || 0);
        const terbayar = Number(b.paid || 0);
        const sisaEstimasi = Math.max(0, aktual - terbayar);
        return `
          <tr>
            <td data-label="Sudah">
              <input type="checkbox" ${b.status === 'Lunas' ? 'checked' : ''} onchange="toggleBudgetDone('${b.id}', this.checked)" />
            </td>
            <td data-label="Kategori">${escapeHtml(b.category)}</td>
            <td data-label="Item">
              <div style="${b.status === 'Lunas' ? 'text-decoration:line-through;color:var(--muted)' : ''}">
                <strong>${escapeHtml(b.item)}</strong>
                ${b.notes ? `<div class="muted">${escapeHtml(b.notes)}</div>` : ''}
                ${receiptHtml(b)}
                ${installmentsHtml(b)}
              </div>
            </td>
            <td data-label="Aktual">${formatRp(aktual)}</td>
            <td data-label="Estimasi (Sisa)">${formatRp(sisaEstimasi)}</td>
            <td data-label="Sudah Dibayar">${formatRp(terbayar)}</td>
            <td data-label="Status">${statusBadge(b.status)}</td>
            ${auditCellsHtml(b)}
            <td data-label="Aksi" class="td-actions">${actionButtons('budgets', b.id)}</td>
          </tr>`;
      }).join('')
    : '<tr class="empty-row"><td colspan="10" class="muted">Belum ada data anggaran.</td></tr>';
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
        ${auditCellsHtml(g)}
        <td data-label="Aksi" class="td-actions">${actionButtons('guests', g.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="9" class="muted">Belum ada daftar tamu.</td></tr>';
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
        <td data-label="Vendor"><div><strong>${escapeHtml(v.name)}</strong>${v.notes ? `<div class="muted">${escapeHtml(v.notes)}</div>` : ''}${receiptHtml(v)}${installmentsHtml(v)}</div></td>
        <td data-label="PIC">${escapeHtml(v.pic || '-')}</td>
        <td data-label="Kontak">${escapeHtml(v.phone || '-')}</td>
        <td data-label="Harga">${formatRp(v.price)}</td>
        <td data-label="DP">${formatRp(v.dp_paid)}</td>
        <td data-label="Status">${statusBadge(v.status)}</td>
        ${auditCellsHtml(v)}
        <td data-label="Aksi" class="td-actions">${actionButtons('vendors', v.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="10" class="muted">Belum ada data vendor.</td></tr>';
}

function renderChecklists() {
  const phase = $('filter-checklist-phase').value;
  const rows = state.data.checklists
    .filter((c) => !phase || c.phase === phase)
    .sort((a, b) => (a.done === 'Selesai' ? 1 : 0) - (b.done === 'Selesai' ? 1 : 0));
  $('tbody-checklists').innerHTML = rows.length
    ? rows.map((c) => {
        const isDone = c.done === 'Selesai';
        return `
          <tr>
            <td data-label="Tahap">${escapeHtml(c.phase)}</td>
            <td data-label="Tugas" style="${isDone ? 'text-decoration:line-through;color:var(--muted)' : ''}"><div>${escapeHtml(c.task)}${receiptHtml(c)}</div></td>
            <td data-label="PIC">${escapeHtml(c.pic || '-')}</td>
            <td data-label="Target">${escapeHtml(formatDateId(c.due_date) || '-')}</td>
            <td data-label="Status">
              <label class="dash-check-right">
                <span class="badge ${isDone ? 'badge-ok' : 'badge-neutral'}">${isDone ? 'Sudah' : 'Belum'}</span>
                <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleChecklist('${c.id}', this.checked)" />
              </label>
            </td>
            ${auditCellsHtml(c)}
            <td data-label="Aksi" class="td-actions">${actionButtons('checklists', c.id)}</td>
          </tr>`;
      }).join('')
    : '<tr class="empty-row"><td colspan="8" class="muted">Belum ada tugas checklist.</td></tr>';
}

function renderRundowns() {
  const ev = $('filter-rundown-event').value;
  const rows = state.data.rundowns
    .filter((r) => !ev || r.event_name === ev)
    .sort((a, b) => formatTimeId(a.start_time).localeCompare(formatTimeId(b.start_time)));
  $('tbody-rundowns').innerHTML = rows.length
    ? rows.map((r) => `
      <tr>
        <td data-label="Sesi">${escapeHtml(r.event_name)}</td>
        <td data-label="Waktu">${escapeHtml(formatTimeId(r.start_time))} - ${escapeHtml(formatTimeId(r.end_time))} WIB</td>
        <td data-label="Kegiatan"><div><strong>${escapeHtml(r.activity)}</strong></div></td>
        <td data-label="PIC">${escapeHtml(r.pic || '-')}</td>
        <td data-label="Lokasi">${escapeHtml(r.location || '-')}</td>
        <td data-label="Catatan">${escapeHtml(r.notes || '-')}</td>
        ${auditCellsHtml(r)}
        <td data-label="Aksi" class="td-actions">${actionButtons('rundowns', r.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="9" class="muted">Belum ada jadwal rundown.</td></tr>';
}

function renderAssets() {
  const el = $('tbody-assets');
  if (!el) return;
  const q = ($('filter-asset-search')?.value || '').toLowerCase();
  const modFilter = $('filter-asset-module')?.value || '';
  const modLabels = {
    budgets: 'Anggaran',
    vendors: 'Vendor',
    checklists: 'Checklist',
    assets: 'Upload Langsung',
  };
  const rows = (state.data.assets || []).filter((a) => {
    const text = `${a.item_label || ''} ${a.file_name || ''} ${a.description || ''}`.toLowerCase();
    return (!q || text.includes(q)) && (!modFilter || a.module === modFilter);
  });
  el.innerHTML = rows.length
    ? rows.map((a) => `
      <tr>
        <td data-label="File Drive">
          <div>
            <strong>${escapeHtml(a.item_label || a.file_name || 'File')}</strong>
            ${a.file_name ? `<div class="muted">${escapeHtml(a.file_name)}</div>` : ''}
            ${a.drive_url ? `<div><a class="receipt-link" href="${escapeHtml(a.drive_url)}" target="_blank" rel="noopener">Buka di Google Drive</a></div>` : ''}
          </div>
        </td>
        <td data-label="Keterangan">${escapeHtml(a.description || '-')}</td>
        <td data-label="Sumber"><span class="badge badge-neutral">${escapeHtml(modLabels[a.module] || a.module || 'Umum')}</span></td>
        ${auditCellsHtml(a)}
        <td data-label="Aksi" class="td-actions">${actionButtons('assets', a.id)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="6" class="muted">Belum ada file asset terupload.</td></tr>';
}

// --- CRUD Modal & Actions ---
function openModal(module, existingItem = null) {
  const schema = MODULE_SCHEMAS[module];
  state.modalContext = { type: 'crud', module, id: existingItem?.id || null };
  $('modal-title').textContent = (existingItem ? 'Edit ' : 'Tambah ') + schema.title;

  $('modal-fields').innerHTML = schema.fields.map((f) => {
    let val = existingItem ? (existingItem[f.key] ?? '') : (f.default ?? '');
    if (module === 'budgets' && f.key === 'actual' && existingItem && !Number(val)) {
      val = existingItem.estimated ?? 0;
    }
    if (f.type === 'select') {
      const opts = f.options.map((o) => `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
      return `<div class="field"><label>${escapeHtml(f.label)}</label><select name="${f.key}" ${f.required ? 'required' : ''}>${opts}</select></div>`;
    }
    if (f.type === 'currency') {
      const formatted = formatNumberComma(val);
      return `<div class="field"><label>${escapeHtml(f.label)}</label><input type="text" inputmode="numeric" data-currency="1" name="${f.key}" value="${escapeHtml(formatted)}" ${f.required ? 'required' : ''} /></div>`;
    }
    if (f.type === 'receipt') {
      if (!getTierCaps().receipts && module !== 'assets') {
        return `<div class="muted" style="font-size:0.82rem">Upload bukti Google Drive tersedia di paket Medium / Rich.</div>`;
      }
      const currentLink = val
        ? `<div class="audit-meta">File saat ini: <a class="receipt-link" href="${escapeHtml(val)}" target="_blank" rel="noopener">Lihat Kwitansi</a></div>`
        : '';
      return `
        <div class="field">
          <label>${escapeHtml(f.label)}</label>
          <div class="btn-row">
            <input type="file" accept="image/*,application/pdf" data-receipt-file="1" style="flex:1" />
            <button type="button" class="btn btn-outline btn-sm" onclick="this.nextElementSibling.click()">Kamera HP</button>
            <input type="file" accept="image/*" capture="environment" data-receipt-camera="1" class="hidden" onchange="syncCameraFile(this)" />
          </div>
          <div class="audit-meta" data-receipt-selected="1"></div>
          <input type="hidden" name="receipt_url" value="${escapeHtml(val)}" />
          <input type="hidden" name="receipt_uploaded_at" value="${escapeHtml(existingItem?.receipt_uploaded_at || '')}" />
          <input type="hidden" name="receipt_uploaded_by" value="${escapeHtml(existingItem?.receipt_uploaded_by || '')}" />
          ${currentLink}
        </div>
      `;
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

window.openInstallmentModal = (module, id) => {
  const item = state.data[module].find((r) => r.id === id);
  if (!item) return;
  const list = parseInstallments(item);
  const label = item.item || item.name || '-';
  state.modalContext = { type: 'installment', module, id };
  $('modal-title').textContent = `Tambah Cicilan — ${label}`;

  $('modal-fields').innerHTML = `
    ${installmentsHtml(item) || '<p class="muted">Belum ada riwayat cicilan untuk item ini.</p>'}
    <div class="field">
      <label>Nominal Cicilan (Rp)</label>
      <input type="text" inputmode="numeric" data-currency="1" name="amount" required placeholder="Contoh: 1,000,000" />
    </div>
    <div class="field">
      <label>Tanggal Bayar</label>
      <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required />
    </div>
    <div class="field">
      <label>Keterangan Cicilan</label>
      <input type="text" name="note" placeholder="Contoh: DP 1 / Termin 2" />
    </div>
    <div class="field">
      <label>Bukti Foto / Kamera HP (Opsional)</label>
      <div class="btn-row">
        <input type="file" accept="image/*,application/pdf" data-receipt-file="1" style="flex:1" />
        <button type="button" class="btn btn-outline btn-sm" onclick="this.nextElementSibling.click()">Kamera HP</button>
        <input type="file" accept="image/*" capture="environment" data-receipt-camera="1" class="hidden" onchange="syncCameraFile(this)" />
      </div>
      <div class="audit-meta" data-receipt-selected="1"></div>
    </div>
    <p class="muted">Menambah cicilan akan memperbarui total terbayar & status menjadi DP/Deal tanpa mencentang Lunas otomatis (centang manual jika sudah lunas).</p>
  `;

  $('modal-fields').querySelectorAll('input[data-currency="1"]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const digits = inp.value.replace(/[^\d]/g, '');
      inp.value = digits ? Number(digits).toLocaleString('en-US') : '';
    });
  });

  document.querySelector('#modal-form .modal-actions').classList.remove('hidden');
  $('modal-backdrop').classList.remove('hidden');
};

window.deleteRecord = (module, id) => {
  openConfirmModal({
    title: 'Konfirmasi Hapus',
    message: 'Data yang dihapus tidak dapat dikembalikan. Yakin ingin menghapus data ini?',
    confirmText: 'Ya, Hapus',
    isDanger: true,
    onConfirm: async () => {
      try {
        const target = state.data[module].find((r) => r.id === id);
        await apiCall('deleteItem', { module, id });
        state.data[module] = state.data[module].filter((r) => r.id !== id);
        pushLocalLog('DELETE', module, target?.item || target?.name || target?.task || target?.activity || id);
        renderAll();
        showToast('Data dihapus.');
      } catch (err) {
        showToast(err.message, true);
      }
    },
  });
};

window.syncCameraFile = (camInput) => {
  const file = camInput.files?.[0];
  if (!file) return;
  const field = camInput.closest('.field');
  const mainInput = field?.querySelector('input[data-receipt-file="1"]');
  const label = field?.querySelector('[data-receipt-selected="1"]');
  if (mainInput) {
    const dt = new DataTransfer();
    dt.items.add(file);
    mainInput.files = dt.files;
  }
  if (label) label.textContent = `Foto kamera siap diupload: ${file.name}`;
};

window.toggleBudgetDone = async (id, checked) => {
  const item = state.data.budgets.find((b) => b.id === id);
  if (!item) return;
  if (checked && getTierCaps().receipts && !item.receipt_url) {
    renderBudgets();
    showToast('Wajib upload foto/bukti kwitansi terlebih dahulu sebelum checklist!', true);
    openModal('budgets', item);
    return;
  }
  const updated = {
    ...item,
    status: checked ? 'Lunas' : 'Belum Bayar',
    paid: checked ? (Number(item.paid) > 0 ? item.paid : (item.actual || item.estimated || 0)) : 0,
  };
  try {
    const res = await apiCall('upsertItem', { module: 'budgets', item: updated });
    const idx = state.data.budgets.findIndex((b) => b.id === id);
    state.data.budgets[idx] = res.item;
    pushLocalLog('UPDATE', 'budgets', res.item.item);
    renderAll();
  } catch (err) {
    showToast(err.message, true);
    renderBudgets();
  }
};

window.toggleChecklist = async (id, checked) => {
  const item = state.data.checklists.find((c) => c.id === id);
  if (!item) return;
  if (checked && getTierCaps().receipts && !item.receipt_url) {
    renderChecklists();
    renderDashboard();
    showToast('Wajib upload foto/bukti terlebih dahulu sebelum checklist!', true);
    openModal('checklists', item);
    return;
  }
  const updated = { ...item, done: checked ? 'Selesai' : 'Belum' };
  try {
    const res = await apiCall('upsertItem', { module: 'checklists', item: updated });
    const idx = state.data.checklists.findIndex((c) => c.id === id);
    state.data.checklists[idx] = res.item;
    pushLocalLog('UPDATE', 'checklists', res.item.task);
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
    assets: 'Asset & File Upload',
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
      $('pricing-showcase')?.classList.toggle('hidden', target !== 'register');
      $('auth-view')?.classList.toggle('with-pricing', target === 'register');
    });
  });

  // Login submit
  $('btn-fill-dummy')?.addEventListener('click', () => {
    $('login-email').value = 'dummy@gmail.com';
    $('login-password').value = '123456';
    $('login-form').requestSubmit();
  });

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
          license_code: $('reg-license').value.trim(),
          name: $('reg-name').value,
          partner_name: $('reg-partner').value,
          wedding_date: $('reg-date').value,
          email: $('reg-email').value,
          partner_email: $('reg-partner-email').value,
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
  ['filter-asset-search', 'filter-asset-module'].forEach((id) => $(id).addEventListener('input', renderAssets));

  // Modal handlers
  $('modal-close').addEventListener('click', closeModal);
  $('modal-cancel').addEventListener('click', closeModal);
  $('btn-open-api-config')?.addEventListener('click', openApiConfigModal);
  $('btn-get-kode')?.addEventListener('click', () => {
    $('pricing-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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

    if (ctx?.type === 'installment') {
      const btn = e.target.querySelector('button[type="submit"]');
      const existing = state.data[ctx.module].find((r) => r.id === ctx.id);
      if (!existing) return;
      const amount = parseCurrency(formData.get('amount'));
      if (amount <= 0) {
        showToast('Nominal cicilan harus lebih dari 0.', true);
        return;
      }
      withButtonLock(btn, 'Menyimpan cicilan...', async () => {
        try {
          let receiptUrl = '';
          let uploadedAt = '';
          let uploadedBy = '';
          const fileInput = $('modal-fields').querySelector('input[data-receipt-file="1"]');
          const file = fileInput?.files?.[0];
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              throw new Error('Ukuran file bukti maksimal 5 MB.');
            }
            btn.textContent = 'Mengupload bukti...';
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
              reader.onerror = () => reject(new Error('Gagal membaca file.'));
              reader.readAsDataURL(file);
            });
            const up = await apiCall('uploadReceipt', {
              module: ctx.module,
              item_label: existing.item || existing.name || file.name,
              description: `${ctx.module === 'budgets' ? 'Anggaran' : 'Vendor'}: ${existing.item || existing.name} — Cicilan ${formatRp(amount)}${formData.get('note') ? ' (' + formData.get('note') + ')' : ''}`,
              filename: file.name,
              mimeType: file.type || 'image/jpeg',
              base64,
            });
            if (up.asset) state.data.assets.push(up.asset);
            receiptUrl = up.url;
            uploadedAt = up.uploaded_at;
            uploadedBy = up.uploaded_by;
            pushLocalLog('UPLOAD_RECEIPT', ctx.module, file.name);
          }

          const list = parseInstallments(existing);
          list.push({
            amount,
            date: String(formData.get('date') || ''),
            note: String(formData.get('note') || '').trim(),
            receipt_url: receiptUrl,
            uploaded_at: uploadedAt,
            uploaded_by: uploadedBy,
          });
          const totalCicilan = list.reduce((s, x) => s + Number(x.amount || 0), 0);
          const paidField = ctx.module === 'budgets' ? 'paid' : 'dp_paid';
          const newPaid = Math.max(Number(existing[paidField] || 0) + amount, totalCicilan);
          const targetTotal = Number(ctx.module === 'budgets' ? (existing.actual || existing.estimated || 0) : (existing.price || 0));
          const isAutoLunas = targetTotal > 0 && newPaid >= targetTotal;
          const nextStatus = (existing.status === 'Lunas' || isAutoLunas)
            ? 'Lunas'
            : (ctx.module === 'budgets' ? 'DP' : (existing.status === 'Survey' ? 'Deal' : existing.status));

          const updatedItem = {
            ...existing,
            installments_json: JSON.stringify(list),
            [paidField]: newPaid,
            status: nextStatus,
            receipt_url: receiptUrl || existing.receipt_url || '',
            receipt_uploaded_at: uploadedAt || existing.receipt_uploaded_at || '',
            receipt_uploaded_by: uploadedBy || existing.receipt_uploaded_by || '',
          };

          const res = await apiCall('upsertItem', { module: ctx.module, item: updatedItem });
          const idx = state.data[ctx.module].findIndex((r) => r.id === ctx.id);
          if (idx !== -1) state.data[ctx.module][idx] = res.item;
          pushLocalLog('UPDATE', ctx.module, `${existing.item || existing.name} (+Cicilan ${formatRp(amount)})`);
          renderAll();
          closeModal();
          showToast('Cicilan tersimpan! Centang Lunas secara manual bila sudah selesai.');
        } catch (err) {
          showToast(err.message, true);
        }
      });
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
            const fileInput = $('modal-fields').querySelector('input[data-receipt-file="1"]');
            const file = fileInput?.files?.[0];
            const wantsDone =
              (ctx.module === 'budgets' && item.status === 'Lunas') ||
              (ctx.module === 'checklists' && item.done === 'Selesai');
            if (wantsDone && getTierCaps().receipts && !file && !item.receipt_url) {
              throw new Error('Wajib upload foto/bukti terlebih dahulu untuk menandai Lunas/Selesai!');
            }
            if (file) {
              if (file.size > 5 * 1024 * 1024) {
                throw new Error('Ukuran file bukti maksimal 5 MB.');
              }
              btn.textContent = 'Mengupload bukti...';
              const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
                reader.onerror = () => reject(new Error('Gagal membaca file.'));
                reader.readAsDataURL(file);
              });
              const itemLabel = item.item_label || item.item || item.name || item.task || file.name;
              const desc = item.description || item.notes || `${ctx.module}: ${itemLabel}`;
              const up = await apiCall('uploadReceipt', {
                module: ctx.module,
                item_label: itemLabel,
                description: desc,
                filename: file.name,
                mimeType: file.type || 'image/jpeg',
                base64,
              });
              if (up.asset) state.data.assets.push(up.asset);
              if (ctx.module === 'assets') {
                item.drive_url = up.url;
                item.file_name = file.name;
                item.uploaded_at = up.uploaded_at;
                item.uploaded_by = up.uploaded_by;
                if (!ctx.id && up.asset) {
                  pushLocalLog('UPLOAD_RECEIPT', 'assets', file.name);
                  renderAll();
                  closeModal();
                  showToast('Asset berhasil diupload ke Google Drive.');
                  return;
                }
              } else {
                item.receipt_url = up.url;
                item.receipt_uploaded_at = up.uploaded_at;
                item.receipt_uploaded_by = up.uploaded_by;
              }
              pushLocalLog('UPLOAD_RECEIPT', ctx.module, file.name);
            } else if (ctx.module === 'assets' && !ctx.id) {
              throw new Error('Pilih file foto atau PDF terlebih dahulu.');
            }

            if (ctx.module === 'budgets' && Number(item.actual || 0) > 0 && Number(item.paid || 0) >= Number(item.actual || 0)) {
              item.status = 'Lunas';
            }
            const res = await apiCall('upsertItem', { module: ctx.module, item });
            const list = state.data[ctx.module];
            if (ctx.id) {
              const idx = list.findIndex((r) => r.id === ctx.id);
              if (idx !== -1) list[idx] = res.item;
            } else {
              list.push(res.item);
            }
            pushLocalLog(ctx.id ? 'UPDATE' : 'CREATE', ctx.module, res.item.item || res.item.name || res.item.task || res.item.activity || ctx.module);
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
      message: 'Semua data Anggaran, Tamu, Vendor, Checklist, Rundown, Asset, serta file bukti di Google Drive milik akun Anda akan dihapus permanen. Data akun lain tetap aman. Lanjutkan?',
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
          state.data = { budgets: [], guests: [], vendors: [], checklists: [], rundowns: [], assets: [] };
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
            partner_email: $('set-partner-email').value,
            drive_folder_id: $('set-drive-folder').value,
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

  $('redeem-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Mengaktifkan...', async () => {
      try {
        const res = await apiCall('redeemLicense', {
          license_code: $('set-license-code').value.trim(),
        });
        saveSession(state.token, { ...state.user, ...res.user });
        $('set-license-code').value = '';
        renderUserHeader();
        renderAll();
        showToast('Paket & masa aktif berhasil diperbarui!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  $('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ user: state.user, data: state.data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nikahplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  function buildBackupReportHtml(forExcel = false) {
    const u = state.user || {};
    const d = state.data || {};
    const tableStyle = forExcel
      ? 'border="1" cellspacing="0" cellpadding="5"'
      : 'style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px"';
    const cellStyle = forExcel ? '' : 'style="border:1px solid #d1d5db;padding:6px 8px;text-align:left"';
    const thStyle = forExcel ? '' : 'style="border:1px solid #d1d5db;padding:6px 8px;text-align:left;background:#f3f4f6"';
    const mkTable = (title, cols, rows) => `
      <h3>${escapeHtml(title)} (${rows.length})</h3>
      <table ${tableStyle}>
        <thead><tr>${cols.map((c) => `<th ${thStyle}>${escapeHtml(c)}</th>`).join('')}</tr></thead>
        <tbody>${
          rows.length
            ? rows.map((r) => `<tr>${r.map((v) => `<td ${cellStyle}>${escapeHtml(String(v ?? ''))}</td>`).join('')}</tr>`).join('')
            : `<tr><td colspan="${cols.length}" ${cellStyle}>Belum ada data.</td></tr>`
        }</tbody>
      </table>`;

    const body = `
      <h1>Laporan Pernikahan — ${escapeHtml(u.name || '')} &amp; ${escapeHtml(u.partner_name || '')}</h1>
      <p>Tanggal Acara: ${escapeHtml(u.wedding_date ? formatDateId(u.wedding_date) : '-')} | Paket: ${escapeHtml(String(u.tier || '').toUpperCase())} | Diekspor: ${escapeHtml(new Date().toLocaleString('id-ID'))}</p>
      ${mkTable('Anggaran', ['Kategori', 'Item', 'Estimasi', 'Aktual', 'Dibayar', 'Status', 'Catatan'], (d.budgets || []).map((b) => [b.category, b.item, b.estimated, b.actual, b.paid, b.status, b.notes]))}
      ${mkTable('Daftar Tamu', ['Nama', 'Pihak', 'Grup', 'Pax', 'RSVP', 'No. HP', 'Catatan'], (d.guests || []).map((g) => [g.name, g.side, g.group, g.pax, g.rsvp, g.phone, g.notes]))}
      ${mkTable('Vendor', ['Nama Vendor', 'Kategori', 'Kontak', 'Harga', 'DP', 'Status'], (d.vendors || []).map((v) => [v.name, v.category, v.contact, v.price, v.dp, v.status]))}
      ${mkTable('Checklist', ['Fase', 'Tugas', 'PIC', 'Target', 'Status'], (d.checklists || []).map((c) => [c.phase, c.task, c.pic, c.due_date, c.done]))}
      ${mkTable('Rundown', ['Waktu', 'Agenda', 'Lokasi', 'PIC', 'Catatan'], (d.rundowns || []).map((r) => [r.time, r.agenda, r.location, r.pic, r.notes]))}
    `;
    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Backup My Weeding Plan</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin:0 0 6px}h3{margin:18px 0 6px}</style></head><body>${body}</body></html>`;
  }

  $('btn-export-pdf')?.addEventListener('click', () => {
    if (!getTierCaps().backupPdf) return;
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Pop-up diblokir browser. Izinkan pop-up untuk export PDF.', true);
      return;
    }
    win.document.open();
    win.document.write(buildBackupReportHtml(false));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  });

  $('btn-export-excel')?.addEventListener('click', () => {
    if (!getTierCaps().backupExcel) return;
    const html = '\ufeff' + buildBackupReportHtml(true);
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nikahplan-backup-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    showToast('Backup Excel (.xls) berhasil diunduh!');
  });

  $('btn-refresh').addEventListener('click', loadAllData);
  $('btn-logout').addEventListener('click', () => logout(true));

  initTheme();
  $('btn-theme-toggle').addEventListener('click', toggleTheme);
  $('btn-style-toggle')?.addEventListener('click', toggleUiStyle);
  $('btn-admin-theme-toggle')?.addEventListener('click', toggleTheme);
  $('btn-admin-style-toggle')?.addEventListener('click', toggleUiStyle);

  if (!DEFAULT_API_URL) {
    const OWNER_FAIL_KEY = 'nikahplan_ok_fail';
    const OWNER_LOCK_KEY = 'nikahplan_ok_lock_until';
    const MAX_ATTEMPTS = 3;
    const LOCK_DURATION_MS = 15 * 60 * 1000;

    const renderOwnerLock = () => {
      const lockUntil = Number(localStorage.getItem(OWNER_LOCK_KEY) || 0);
      const isLocked = Date.now() < lockUntil;
      const fails = Number(localStorage.getItem(OWNER_FAIL_KEY) || 0);
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
          <div class="card" style="max-width:420px;width:100%;text-align:center;">
            <h2 style="margin-bottom:8px;">${isLocked ? 'Akses Diblokir' : 'Akses Terenkripsi'}</h2>
            <p id="owner-lock-msg" class="muted" style="margin-bottom:16px;">${
              isLocked
                ? 'Terlalu banyak percobaan salah (3x). State browser dibersihkan.'
                : `Project ini dilindungi. Masukkan Owner Key untuk membuka enkripsi.${fails > 0 ? ` (Sisa percobaan: ${MAX_ATTEMPTS - fails}x)` : ''}`
            }</p>
            <form id="owner-unlock-form" class="form-stack">
              <div class="field">
                <label for="owner-key-input">Owner Key</label>
                <input id="owner-key-input" type="password" placeholder="MWP-VAULT-..." ${isLocked ? 'disabled' : 'required'} />
              </div>
              <button type="submit" class="btn btn-primary btn-full" ${isLocked ? 'disabled' : ''}>${isLocked ? 'Terkunci' : 'Buka Enkripsi'}</button>
            </form>
          </div>
        </div>`;

      if (isLocked) {
        const msgEl = document.getElementById('owner-lock-msg');
        const tick = () => {
          const left = Math.max(0, lockUntil - Date.now());
          if (left <= 0) {
            localStorage.removeItem(OWNER_LOCK_KEY);
            localStorage.removeItem(OWNER_FAIL_KEY);
            renderOwnerLock();
            return;
          }
          const m = Math.floor(left / 60000);
          const s = Math.floor((left % 60000) / 1000);
          if (msgEl) msgEl.textContent = `Akses diblokir sementara (3x salah). Coba lagi dalam ${m}m ${String(s).padStart(2, '0')}d.`;
          setTimeout(tick, 1000);
        };
        tick();
        return;
      }

      document.getElementById('owner-unlock-form')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const k = (document.getElementById('owner-key-input')?.value || '').trim();
        if (sha256HexSync(k) !== OWNER_KEY_HASH) {
          const nextFails = Number(localStorage.getItem(OWNER_FAIL_KEY) || 0) + 1;
          if (nextFails >= MAX_ATTEMPTS) {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem(OWNER_LOCK_KEY, String(Date.now() + LOCK_DURATION_MS));
            renderOwnerLock();
            return;
          }
          localStorage.setItem(OWNER_FAIL_KEY, String(nextFails));
          alert(`Owner Key salah! Sisa percobaan: ${MAX_ATTEMPTS - nextFails}x.`);
          renderOwnerLock();
          return;
        }
        localStorage.removeItem(OWNER_FAIL_KEY);
        localStorage.removeItem(OWNER_LOCK_KEY);
        localStorage.setItem(OWNER_KEY_STORAGE, k);
        window.location.reload();
      });
    };

    renderOwnerLock();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const guestCheckinUserId = params.get('guest_checkin');
  const guestId = params.get('guest_id');
  const checkinUserId = params.get('checkin');
  const isAdminRoute = params.has('adminLogin') || window.location.hash === '#adminLogin';
  if (isAdminRoute) {
    openAdminView();
  } else if (guestCheckinUserId && guestId) {
    initGuestScannerView(guestCheckinUserId, guestId);
  } else if (checkinUserId) {
    initCheckinView(checkinUserId);
  } else {
    renderAuthOrApp();
  }
});

const ADMIN_SESSION_STORAGE = 'nikahplan_admin_session';
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 jam
let adminKeySession = '';

function getValidAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.key || Date.now() > Number(parsed.expiresAt || 0)) {
      localStorage.removeItem(ADMIN_SESSION_STORAGE);
      return '';
    }
    return String(parsed.key);
  } catch (e) {
    localStorage.removeItem(ADMIN_SESSION_STORAGE);
    return '';
  }
}

function saveAdminSession(key, resetExpiry = false) {
  if (!key) return;
  let expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  if (!resetExpiry) {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_STORAGE);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && parsed.expiresAt && Date.now() < Number(parsed.expiresAt)) {
        expiresAt = Number(parsed.expiresAt);
      }
    } catch (e) {}
  }
  localStorage.setItem(ADMIN_SESSION_STORAGE, JSON.stringify({ key, expiresAt }));
}

function clearAdminSession() {
  adminKeySession = '';
  localStorage.removeItem(ADMIN_SESSION_STORAGE);
}

function openAdminView() {
  $('auth-view').classList.add('hidden');
  $('app-view').classList.add('hidden');
  $('checkin-view').classList.add('hidden');
  $('guest-scanner-view').classList.add('hidden');
  $('admin-view').classList.remove('hidden');
  applyUiStyle(localStorage.getItem('nikahplan_ui_style') || 'default');

  const savedKey = getValidAdminSession();
  if (savedKey) {
    adminKeySession = savedKey;
    $('admin-login-box').classList.add('hidden');
    $('admin-content').classList.remove('hidden');
    loadAdminDashboard();
  }
}

function exitAdminView() {
  clearAdminSession();
  $('admin-view').classList.add('hidden');
  $('admin-content').classList.add('hidden');
  $('admin-login-box').classList.remove('hidden');
  renderAuthOrApp();
}

async function loadAdminDashboard() {
  if (!adminKeySession) {
    clearAdminSession();
    $('admin-content').classList.add('hidden');
    $('admin-login-box').classList.remove('hidden');
    return;
  }
  const amc = document.querySelector('#admin-content .main-content');
  amc?.classList.add('is-loading');
  try {
    const data = await apiCall('adminDashboard', { admin_key: adminKeySession });
    saveAdminSession(adminKeySession, false);
    $('admin-login-box').classList.add('hidden');
    $('admin-content').classList.remove('hidden');
    renderAdminTables(data);
  } catch (err) {
    const isAuthErr = /admin key/i.test(err.message || '');
    if (isAuthErr || $('admin-content').classList.contains('hidden')) {
      clearAdminSession();
      $('admin-content').classList.add('hidden');
      $('admin-login-box').classList.remove('hidden');
    }
    showToast(err.message, true);
  } finally {
    amc?.classList.remove('is-loading');
  }
}

function adminSetSidebarOpen(isOpen) {
  const sidebar = $('admin-sidebar');
  const backdrop = $('admin-sidebar-backdrop');
  if (!sidebar) return;
  sidebar.classList.toggle('sidebar-open', Boolean(isOpen));
  if (backdrop) backdrop.classList.toggle('hidden', !isOpen);
}

function switchAdminTab(tabName) {
  const titles = {
    users: 'Manajemen User',
    licenses: 'Kode Lisensi',
    payments: 'Konfirmasi Bayar',
    settings: 'Harga & Promo',
  };
  document.querySelectorAll('.admin-nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.adminTab === tabName);
  });
  ['users', 'licenses', 'payments', 'settings'].forEach((t) => {
    $(`admin-tab-${t}`)?.classList.toggle('hidden', t !== tabName);
  });
  if ($('admin-page-title')) {
    $('admin-page-title').textContent = titles[tabName] || 'Panel Admin';
  }
}

function renderLicenseTable(licenses = []) {
  $('tbody-admin-licenses').innerHTML = licenses.length
    ? licenses.slice(0, 100).map((l) => `
      <tr>
        <td data-label="Kode"><code>${escapeHtml(l.code)}</code></td>
        <td data-label="Paket">${escapeHtml(String(l.tier || '').toUpperCase())}</td>
        <td data-label="Status"><span class="badge ${l.status === 'unused' ? 'badge-ok' : 'badge-neutral'}">${escapeHtml(l.status)}</span></td>
        <td data-label="Dipakai Oleh">${escapeHtml(l.used_by_email || '-')}</td>
        <td data-label="Aksi" class="td-actions">
          <div class="action-btns">
            <button type="button" class="btn btn-sm btn-outline" onclick="copyCheckinUrl('${escapeHtml(l.code)}')">Salin</button>
            ${l.status === 'unused' ? `<button type="button" class="btn btn-sm btn-danger" onclick="adminDeleteCode('${escapeHtml(l.code)}')">Hapus</button>` : ''}
          </div>
        </td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="5" class="muted">Belum ada kode lisensi.</td></tr>';
}

function renderAdminTables({ users = [], licenses = [], payments = [], pricing = null }) {
  $('tbody-admin-users').innerHTML = users.length
    ? users.map((u) => {
        const st = String(u.status || 'active').toLowerCase();
        const badgeCls = st === 'active' ? 'badge-ok' : 'badge-bad';
        return `
          <tr>
            <td data-label="Pasangan"><strong>${escapeHtml(u.name)} & ${escapeHtml(u.partner_name)}</strong></td>
            <td data-label="Email Utama">${escapeHtml(u.email)}</td>
            <td data-label="Email Pasangan">${escapeHtml(u.partner_email || '-')}</td>
            <td data-label="Paket"><span class="badge badge-neutral">${escapeHtml((u.tier || 'rich').toUpperCase())}</span></td>
            <td data-label="Kode Lisensi"><code>${escapeHtml(u.license_code || '-')}</code></td>
            <td data-label="Status"><span class="badge ${badgeCls}">${escapeHtml(st)}</span></td>
            <td data-label="Masa Aktif">${escapeHtml(u.expires_at ? formatDateId(u.expires_at) : 'Tanpa Batas')}</td>
            <td data-label="Aksi" class="td-actions">
              <div class="action-btns">
                ${st !== 'active' ? `<button type="button" class="btn btn-sm btn-outline" onclick="adminChangeStatus('${u.id}', 'active')">Active</button>` : ''}
                ${st !== 'non-active' ? `<button type="button" class="btn btn-sm btn-outline" onclick="adminChangeStatus('${u.id}', 'non-active')">Non-Active</button>` : ''}
                ${st !== 'in-active' ? `<button type="button" class="btn btn-sm btn-outline" onclick="adminChangeStatus('${u.id}', 'in-active')">In-Active</button>` : ''}
                <button type="button" class="btn btn-sm btn-danger" onclick="adminRemoveUser('${u.id}', '${escapeHtml(u.email)}', '${escapeHtml(u.partner_email || '')}')">Hapus</button>
              </div>
            </td>
          </tr>`;
      }).join('')
    : '<tr class="empty-row"><td colspan="8" class="muted">Belum ada user terdaftar.</td></tr>';

  renderLicenseTable(licenses);

  const p = { ...getDefaultPricing(), ...(pricing || {}) };
  if ($('adm-promo-banner')) $('adm-promo-banner').value = p.promo_banner || '';
  const fmtOpt = (n) => (Number(n) > 0 ? Number(n).toLocaleString('en-US') : '');
  if ($('adm-price-sed')) $('adm-price-sed').value = fmtOpt(p.sederhana?.price);
  if ($('adm-promo-sed')) $('adm-promo-sed').value = fmtOpt(p.sederhana?.promo_price);
  if ($('adm-label-sed')) $('adm-label-sed').value = p.sederhana?.promo_label || '';
  if ($('adm-price-med')) $('adm-price-med').value = fmtOpt(p.medium?.price);
  if ($('adm-promo-med')) $('adm-promo-med').value = fmtOpt(p.medium?.promo_price);
  if ($('adm-label-med')) $('adm-label-med').value = p.medium?.promo_label || '';
  if ($('adm-price-rch')) $('adm-price-rch').value = fmtOpt(p.rich?.price);
  if ($('adm-promo-rch')) $('adm-promo-rch').value = fmtOpt(p.rich?.promo_price);
  if ($('adm-label-rch')) $('adm-label-rch').value = p.rich?.promo_label || '';
  if ($('adm-price-kng')) $('adm-price-kng').value = fmtOpt(p.konglo?.price);
  if ($('adm-promo-kng')) $('adm-promo-kng').value = fmtOpt(p.konglo?.promo_price);
  if ($('adm-label-kng')) $('adm-label-kng').value = p.konglo?.promo_label || '';

  $('tbody-admin-payments').innerHTML = payments.length
    ? payments.slice(0, 50).map((p) => `
      <tr>
        <td data-label="Pembeli">${escapeHtml(p.buyer_email)}</td>
        <td data-label="Paket">${escapeHtml(String(p.tier || '').toUpperCase())}</td>
        <td data-label="Nominal">${formatRp(p.amount)}</td>
        <td data-label="Kode"><code>${escapeHtml(p.license_code)}</code></td>
        <td data-label="Tanggal">${escapeHtml(formatDateTimeId(p.confirmed_at))}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="5" class="muted">Belum ada konfirmasi pembayaran.</td></tr>';
}

window.adminChangeStatus = (userId, status) => {
  openConfirmModal({
    title: 'Ubah Status User',
    message: `Ubah status akun ini menjadi "${status}"?`,
    confirmText: 'Ya, Ubah',
    onConfirm: async () => {
      try {
        await apiCall('adminSetUserStatus', { admin_key: adminKeySession, user_id: userId, status });
        showToast(`Status user diubah ke ${status}.`);
        await loadAdminDashboard();
      } catch (err) {
        showToast(err.message, true);
      }
    },
  });
};

window.adminRemoveUser = (userId, email, partnerEmail) => {
  const pairText = partnerEmail ? `${email} & pasangannya (${partnerEmail})` : email;
  openConfirmModal({
    title: 'Hapus User Permanen',
    message: `Hapus akun ${pairText} beserta seluruh datanya? (File di Google Drive tidak dihapus).`,
    confirmText: 'Ya, Hapus User',
    isDanger: true,
    onConfirm: async () => {
      try {
        await apiCall('adminDeleteUser', { admin_key: adminKeySession, user_id: userId });
        showToast(`Akun ${pairText} beserta datanya berhasil dihapus.`);
        await loadAdminDashboard();
      } catch (err) {
        showToast(err.message, true);
      }
    },
  });
};

window.adminDeleteCode = (code) => {
  openConfirmModal({
    title: 'Hapus Kode Lisensi',
    message: `Hapus kode unused "${code}"?`,
    confirmText: 'Ya, Hapus',
    isDanger: true,
    onConfirm: async () => {
      try {
        await apiCall('adminDeleteLicense', { admin_key: adminKeySession, code });
        showToast(`Kode ${code} dihapus.`);
        await loadAdminDashboard();
      } catch (err) {
        showToast(err.message, true);
      }
    },
  });
};

document.addEventListener('DOMContentLoaded', () => {
  $('btn-admin-exit')?.addEventListener('click', exitAdminView);
  $('btn-admin-back')?.addEventListener('click', exitAdminView);
  $('btn-admin-refresh')?.addEventListener('click', loadAdminDashboard);

  $('btn-admin-menu-toggle')?.addEventListener('click', () => adminSetSidebarOpen(true));
  $('btn-admin-menu-close')?.addEventListener('click', () => adminSetSidebarOpen(false));
  $('admin-sidebar-backdrop')?.addEventListener('click', () => adminSetSidebarOpen(false));

  document.querySelectorAll('.admin-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchAdminTab(btn.dataset.adminTab);
      adminSetSidebarOpen(false);
    });
  });

  $('btn-admin-del-unused')?.addEventListener('click', () => {
    openConfirmModal({
      title: 'Hapus Semua Kode Unused',
      message: 'Hapus seluruh kode lisensi yang belum terpakai (status unused)? Admin dapat generate ulang setelahnya.',
      confirmText: 'Ya, Hapus Semua',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await apiCall('adminDeleteUnusedLicenses', { admin_key: adminKeySession });
          showToast(`${res.deleted || 0} kode unused berhasil dihapus.`);
          await loadAdminDashboard();
        } catch (err) {
          showToast(err.message, true);
        }
      },
    });
  });

  ['adm-price-sed', 'adm-promo-sed', 'adm-price-med', 'adm-promo-med', 'adm-price-rch', 'adm-promo-rch', 'adm-price-kng', 'adm-promo-kng'].forEach((id) => {
    $(id)?.addEventListener('input', (e) => {
      const digits = e.target.value.replace(/[^\d]/g, '');
      e.target.value = digits ? Number(digits).toLocaleString('en-US') : '';
    });
  });

  document.querySelectorAll('.ai-prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if ($('ai-plan-prompt')) $('ai-plan-prompt').value = chip.dataset.prompt || '';
    });
  });

  $('ai-plan-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!getTierCaps().aiPlanner || !window.NikahAiPlanner) return;
    const prompt = ($('ai-plan-prompt')?.value || '').trim();
    if (!prompt) return;
    const btn = $('btn-ai-generate');
    withButtonLock(btn, 'AI sedang merancang...', async () => {
      await new Promise((r) => setTimeout(r, 850));
      const plan = window.NikahAiPlanner.generatePlanFromPrompt(prompt);
      window.NikahAiPlanner.savePlan(state.user?.id, plan);
      renderAiPlans();
      showToast('Rencana AI berhasil dibuat & disimpan!');
    });
  });

  $('admin-pricing-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Menyimpan...', async () => {
      try {
        const pricing = {
          promo_banner: $('adm-promo-banner').value.trim(),
          sederhana: {
            price: parseCurrency($('adm-price-sed').value),
            promo_price: parseCurrency($('adm-promo-sed').value),
            promo_label: $('adm-label-sed').value.trim(),
          },
          medium: {
            price: parseCurrency($('adm-price-med').value),
            promo_price: parseCurrency($('adm-promo-med').value),
            promo_label: $('adm-label-med').value.trim(),
          },
          rich: {
            price: parseCurrency($('adm-price-rch').value),
            promo_price: parseCurrency($('adm-promo-rch').value),
            promo_label: $('adm-label-rch').value.trim(),
          },
          konglo: {
            price: parseCurrency($('adm-price-kng').value),
            promo_price: parseCurrency($('adm-promo-kng').value),
            promo_label: $('adm-label-kng').value.trim(),
          },
        };
        const res = await apiCall('adminSavePricing', { admin_key: adminKeySession, pricing });
        if (res?.pricing) renderPricingShowcase(res.pricing);
        showToast('Harga & promo berhasil disimpan!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  $('admin-auth-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    adminKeySession = $('admin-key-input').value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Memeriksa...', loadAdminDashboard);
  });

  $('adm-pay-amount')?.addEventListener('input', (e) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    e.target.value = digits ? Number(digits).toLocaleString('en-US') : '';
  });

  $('admin-payment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Memproses...', async () => {
      try {
        const res = await apiCall('adminConfirmPayment', {
          admin_key: adminKeySession,
          buyer_email: $('adm-pay-email').value.trim(),
          tier: $('adm-pay-tier').value,
          amount: parseCurrency($('adm-pay-amount').value),
          method: $('adm-pay-method').value.trim(),
        });
        const box = $('adm-pay-result');
        box.innerHTML = `Pembayaran dikonfirmasi! Kode Lisensi: <strong>${escapeHtml(res.license_code)}</strong> <button type="button" class="link-btn" onclick="copyCheckinUrl('${escapeHtml(res.license_code)}')">Salin</button>`;
        box.classList.remove('hidden');
        e.target.reset();
        showToast('Pembayaran dikonfirmasi & kode dibuat!');
        await loadAdminDashboard();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  $('admin-gen-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Generating...', async () => {
      try {
        const res = await apiCall('adminGenerateCodes', {
          admin_key: adminKeySession,
          tier: $('adm-gen-tier').value,
          count: $('adm-gen-count').value,
        });
        const box = $('adm-gen-result');
        const listText = (res.codes || []).join(', ');
        box.innerHTML = `Berhasil generate ${res.codes.length} kode:<br><code>${escapeHtml(listText)}</code> <button type="button" class="link-btn" onclick="copyCheckinUrl('${escapeHtml(listText)}')">Salin Semua</button>`;
        box.classList.remove('hidden');
        showToast(`${res.codes.length} kode lisensi berhasil dibuat!`);
        if (Array.isArray(res.licenses)) {
          renderLicenseTable(res.licenses);
        } else {
          await loadAdminDashboard();
        }
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  $('admin-key-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newKey = $('adm-new-key').value.trim();
    if (newKey.length < 6) {
      showToast('Admin Key baru minimal 6 karakter.', true);
      return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    withButtonLock(btn, 'Menyimpan...', async () => {
      try {
        await apiCall('adminUpdateKey', { admin_key: adminKeySession, new_key: newKey });
        adminKeySession = newKey;
        saveAdminSession(newKey, false);
        $('adm-new-key').value = '';
        showToast('Admin Key berhasil diperbarui!');
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });
});

window.copyGuestPersonalLink = async (guestId) => {
  if (!state.user?.id) return;
  const base = window.location.origin + window.location.pathname;
  const url = `${base}?guest_checkin=${encodeURIComponent(state.user.id)}&guest_id=${encodeURIComponent(guestId)}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link scan QR pribadi tamu disalin!');
  } catch {
    prompt('Salin link tamu ini:', url);
  }
};

async function initGuestScannerView(userId, guestId) {
  $('auth-view').classList.add('hidden');
  $('app-view').classList.add('hidden');
  $('checkin-view').classList.add('hidden');
  $('guest-scanner-view').classList.remove('hidden');

  try {
    const info = await apiCall('publicEventInfo', { user_id: userId, guest_id: guestId });
    $('gs-couple').textContent = `${info.name} & ${info.partner_name}`;
    const guestName = info.guest ? info.guest.name : 'Tamu Undangan';
    $('gs-guest-greeting').textContent = `Halo, ${guestName}!`;
    $('gs-watermark')?.classList.toggle('hidden', info.tier === 'rich');
    if (info.guest && info.guest.rsvp === 'Hadir') {
      $('gs-scan-box').classList.add('hidden');
      $('gs-success-msg').textContent = `Terima kasih ${guestName}, kehadiran Anda sudah tercatat Hadir.`;
      $('gs-scan-success').classList.remove('hidden');
      return;
    }
  } catch (err) {
    showToast(err.message, true);
  }

  let scanner = null;
  $('btn-start-scan').addEventListener('click', async () => {
    const btn = $('btn-start-scan');
    if (typeof Html5Qrcode === 'undefined') {
      showToast('Library kamera QR belum termuat. Refresh halaman.', true);
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Membuka kamera...';
    try {
      scanner = new Html5Qrcode('qr-reader');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (decodedText.includes(userId)) {
            await scanner.stop().catch(() => {});
            const res = await apiCall('publicGuestQrCheckin', { user_id: userId, guest_id: guestId });
            $('gs-scan-box').classList.add('hidden');
            $('gs-success-msg').textContent = `Terima kasih ${res.guest?.name || ''}, status Anda otomatis tercatat Hadir!`;
            $('gs-scan-success').classList.remove('hidden');
            showToast('Kehadiran berhasil tercatat!');
          } else {
            showToast('QR Code tidak sesuai dengan acara ini.', true);
          }
        },
        () => {}
      );
      btn.textContent = 'Kamera Aktif — Arahkan ke QR';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Buka Kamera Scan QR';
      showToast('Gagal membuka kamera: ' + (err.message || err), true);
    }
  });
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const text = isDark ? 'Mode Terang' : 'Mode Gelap';
  if ($('theme-toggle-label')) $('theme-toggle-label').textContent = text;
  if ($('admin-theme-toggle-label')) $('admin-theme-toggle-label').textContent = text;
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

function applyUiStyle(style) {
  const isNeu = style === 'neumorphism' || style === 'glass';
  document.documentElement.setAttribute('data-ui-style', isNeu ? 'neumorphism' : 'default');
  const text = isNeu ? 'Tema: Neumorphism' : 'Tema: Default';
  if ($('style-toggle-label')) $('style-toggle-label').textContent = text;
  if ($('admin-style-toggle-label')) $('admin-style-toggle-label').textContent = text;
}

function toggleUiStyle() {
  const cur = document.documentElement.getAttribute('data-ui-style') === 'neumorphism' ? 'neumorphism' : 'default';
  const next = cur === 'neumorphism' ? 'default' : 'neumorphism';
  localStorage.setItem('nikahplan_ui_style', next);
  applyUiStyle(next);
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
    const dateStr = formatDateId(info.wedding_date);
    $('checkin-date').textContent = dateStr ? `Buku Tamu • ${dateStr}` : 'Buku Tamu Pernikahan';
    $('checkin-watermark')?.classList.toggle('hidden', info.tier === 'rich');
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
