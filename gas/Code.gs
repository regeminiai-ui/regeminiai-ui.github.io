/**
 * NikahPlan — Google Apps Script Backend (Google Spreadsheet as Database)
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SCHEMAS = {
  users: ['id', 'email', 'name', 'partner_name', 'wedding_date', 'password_hash', 'salt', 'created_at'],
  budgets: ['id', 'user_id', 'category', 'item', 'estimated', 'actual', 'paid', 'status', 'notes', 'updated_at'],
  guests: ['id', 'user_id', 'name', 'side', 'group', 'pax', 'rsvp', 'phone', 'notes', 'updated_at'],
  vendors: ['id', 'user_id', 'category', 'name', 'pic', 'phone', 'price', 'dp_paid', 'status', 'notes', 'updated_at'],
  checklists: ['id', 'user_id', 'phase', 'task', 'pic', 'due_date', 'done', 'updated_at'],
  rundowns: ['id', 'user_id', 'event_name', 'start_time', 'end_time', 'activity', 'pic', 'location', 'notes', 'updated_at'],
};

const DATA_MODULES = ['budgets', 'guests', 'vendors', 'checklists', 'rundowns'];

function doGet() {
  return jsonResponse({ ok: true, service: 'NikahPlan API', status: 'running' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    const payload = body.payload || {};

    ensureSchema_();

    if (action === 'register') return jsonResponse({ ok: true, data: handleRegister_(payload) });
    if (action === 'login') return jsonResponse({ ok: true, data: handleLogin_(payload) });

    // Protected routes
    const userId = verifyToken_(body.token);
    if (!userId) {
      return jsonResponse({ ok: false, code: 'UNAUTHORIZED', error: 'Sesi berakhir. Silakan login kembali.' });
    }

    if (action === 'updateProfile') return jsonResponse({ ok: true, data: handleUpdateProfile_(userId, payload) });
    if (action === 'getAll') return jsonResponse({ ok: true, data: handleGetAll_(userId) });
    if (action === 'upsertItem') return jsonResponse({ ok: true, data: handleUpsertItem_(userId, payload) });
    if (action === 'deleteItem') return jsonResponse({ ok: true, data: handleDeleteItem_(userId, payload) });

    return jsonResponse({ ok: false, error: 'Action tidak dikenal: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Schema Initialization ---
function ensureSchema_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMAS).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(SCHEMAS[name]);
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(SCHEMAS[name]);
      sheet.setFrozenRows(1);
    }
  });
}

// --- Crypto & Auth Helpers ---
function getSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('NIKAHPLAN_HMAC_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('NIKAHPLAN_HMAC_SECRET', secret);
  }
  return secret;
}

function sha256Hex_(input) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  return bytes.map((b) => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function signToken_(userId) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; // 14 days
  const data = userId + '.' + exp;
  const sigBytes = Utilities.computeHmacSha256Signature(data, getSecret_());
  const sig = Utilities.base64EncodeWebSafe(sigBytes);
  return Utilities.base64EncodeWebSafe(data) + '.' + sig;
}

function verifyToken_(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const data = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  const expectedSig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(data, getSecret_()));
  if (parts[1] !== expectedSig) return null;
  const [userId, expStr] = data.split('.');
  if (!userId || Date.now() > Number(expStr)) return null;
  return userId;
}

// --- Sheet Helpers ---
function readRows_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map((row, idx) => {
    const obj = { _rowIndex: idx + 2 };
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function stripMeta_(obj) {
  const copy = Object.assign({}, obj);
  delete copy._rowIndex;
  return copy;
}

// --- Auth Handlers ---
function handleRegister_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  if (!email || password.length < 6) {
    throw new Error('Email valid dan password minimal 6 karakter wajib diisi.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    if (users.some((u) => String(u.email).toLowerCase() === email)) {
      throw new Error('Email sudah terdaftar.');
    }

    const id = 'u_' + Utilities.getUuid().slice(0, 8);
    const salt = Utilities.getUuid().slice(0, 12);
    const hash = sha256Hex_(salt + ':' + password);
    const now = new Date().toISOString();

    const row = [
      id,
      email,
      String(payload.name || '').trim(),
      String(payload.partner_name || '').trim(),
      String(payload.wedding_date || ''),
      hash,
      salt,
      now,
    ];

    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users').appendRow(row);
    return {
      token: signToken_(id),
      user: {
        id,
        email,
        name: row[2],
        partner_name: row[3],
        wedding_date: row[4],
      },
    };
  } finally {
    lock.releaseLock();
  }
}

function handleLogin_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const users = readRows_('users');
  const user = users.find((u) => String(u.email).toLowerCase() === email);
  if (!user) throw new Error('Email atau password salah.');

  const hash = sha256Hex_(user.salt + ':' + password);
  if (hash !== user.password_hash) throw new Error('Email atau password salah.');

  return {
    token: signToken_(user.id),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      partner_name: user.partner_name,
      wedding_date: user.wedding_date,
    },
  };
}

function handleUpdateProfile_(userId, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User tidak ditemukan.');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
    const headers = SCHEMAS.users;
    user.name = String(payload.name || '').trim();
    user.partner_name = String(payload.partner_name || '').trim();
    user.wedding_date = String(payload.wedding_date || '');

    const rowValues = headers.map((h) => user[h] ?? '');
    sheet.getRange(user._rowIndex, 1, 1, headers.length).setValues([rowValues]);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        partner_name: user.partner_name,
        wedding_date: user.wedding_date,
      },
    };
  } finally {
    lock.releaseLock();
  }
}

// --- CRUD Handlers ---
function handleGetAll_(userId) {
  const result = {};
  DATA_MODULES.forEach((mod) => {
    result[mod] = readRows_(mod)
      .filter((r) => r.user_id === userId)
      .map(stripMeta_);
  });
  return result;
}

function handleUpsertItem_(userId, payload) {
  const mod = payload.module;
  if (DATA_MODULES.indexOf(mod) === -1) throw new Error('Modul tidak valid.');
  const item = payload.item || {};
  const headers = SCHEMAS[mod];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(mod);
    const now = new Date().toISOString();

    if (item.id) {
      const rows = readRows_(mod);
      const existing = rows.find((r) => r.id === item.id && r.user_id === userId);
      if (!existing) throw new Error('Data tidak ditemukan atau bukan milik Anda.');

      const merged = Object.assign({}, stripMeta_(existing), item, {
        id: existing.id,
        user_id: userId,
        updated_at: now,
      });
      const rowValues = headers.map((h) => merged[h] ?? '');
      sheet.getRange(existing._rowIndex, 1, 1, headers.length).setValues([rowValues]);
      return { item: merged };
    } else {
      const created = Object.assign({}, item, {
        id: mod.slice(0, 3) + '_' + Utilities.getUuid().slice(0, 8),
        user_id: userId,
        updated_at: now,
      });
      const rowValues = headers.map((h) => created[h] ?? '');
      sheet.appendRow(rowValues);
      return { item: created };
    }
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteItem_(userId, payload) {
  const mod = payload.module;
  const id = payload.id;
  if (DATA_MODULES.indexOf(mod) === -1) throw new Error('Modul tidak valid.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = readRows_(mod);
    const existing = rows.find((r) => r.id === id && r.user_id === userId);
    if (!existing) throw new Error('Data tidak ditemukan.');
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(mod).deleteRow(existing._rowIndex);
    return { deleted: true };
  } finally {
    lock.releaseLock();
  }
}
