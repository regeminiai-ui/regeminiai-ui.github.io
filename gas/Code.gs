/**
 * NikahPlan — Google Apps Script Backend (Google Spreadsheet as Database)
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SCHEMAS = {
  users: ['id', 'email', 'name', 'partner_name', 'wedding_date', 'password_hash', 'salt', 'created_at', 'partner_email', 'drive_folder_id'],
  budgets: ['id', 'user_id', 'category', 'item', 'estimated', 'actual', 'paid', 'status', 'notes', 'receipt_url', 'receipt_uploaded_at', 'receipt_uploaded_by', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  guests: ['id', 'user_id', 'name', 'side', 'group', 'pax', 'rsvp', 'phone', 'notes', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  vendors: ['id', 'user_id', 'category', 'name', 'pic', 'phone', 'price', 'dp_paid', 'status', 'notes', 'receipt_url', 'receipt_uploaded_at', 'receipt_uploaded_by', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  checklists: ['id', 'user_id', 'phase', 'task', 'pic', 'due_date', 'done', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  rundowns: ['id', 'user_id', 'event_name', 'start_time', 'end_time', 'activity', 'pic', 'location', 'notes', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  activity_logs: ['id', 'user_id', 'action', 'module', 'item_label', 'actor_email', 'created_at'],
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
    if (action === 'publicEventInfo') return jsonResponse({ ok: true, data: handlePublicEventInfo_(payload) });
    if (action === 'publicCheckin') return jsonResponse({ ok: true, data: handlePublicCheckin_(payload) });

    // Protected routes
    const auth = verifyToken_(body.token);
    if (!auth) {
      return jsonResponse({ ok: false, code: 'UNAUTHORIZED', error: 'Sesi berakhir. Silakan login kembali.' });
    }

    if (action === 'updateProfile') return jsonResponse({ ok: true, data: handleUpdateProfile_(auth.userId, payload) });
    if (action === 'getAll') return jsonResponse({ ok: true, data: handleGetAll_(auth.userId) });
    if (action === 'upsertItem') return jsonResponse({ ok: true, data: handleUpsertItem_(auth, payload) });
    if (action === 'deleteItem') return jsonResponse({ ok: true, data: handleDeleteItem_(auth, payload) });
    if (action === 'uploadReceipt') return jsonResponse({ ok: true, data: handleUploadReceipt_(auth, payload) });
    if (action === 'resetUserData') return jsonResponse({ ok: true, data: handleResetUserData_(auth) });

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
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      SCHEMAS[name].forEach((col) => {
        if (existingHeaders.indexOf(col) === -1) {
          sheet.getRange(1, existingHeaders.length + 1).setValue(col);
          existingHeaders.push(col);
        }
      });
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

function signToken_(userId, actorEmail) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 14; // 14 days
  const actor = actorEmail || '';
  const data = userId + '|' + actor + '.' + exp;
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
  const dotIdx = data.lastIndexOf('.');
  if (dotIdx === -1) return null;
  const subject = data.slice(0, dotIdx);
  const expStr = data.slice(dotIdx + 1);
  if (!subject || Date.now() > Number(expStr)) return null;
  const pipeIdx = subject.indexOf('|');
  if (pipeIdx === -1) {
    return { userId: subject, actorEmail: '' };
  }
  return {
    userId: subject.slice(0, pipeIdx),
    actorEmail: subject.slice(pipeIdx + 1),
  };
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

function isEmailTaken_(users, email, excludeUserId) {
  if (!email) return false;
  return users.some((u) => {
    if (excludeUserId && u.id === excludeUserId) return false;
    return String(u.email || '').toLowerCase() === email ||
      String(u.partner_email || '').toLowerCase() === email;
  });
}

// --- Auth Handlers ---
function handleRegister_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const partnerEmail = String(payload.partner_email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  if (!email || password.length < 6) {
    throw new Error('Email valid dan password minimal 6 karakter wajib diisi.');
  }
  if (partnerEmail && partnerEmail === email) {
    throw new Error('Email pasangan harus berbeda dengan email utama.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    if (isEmailTaken_(users, email) || isEmailTaken_(users, partnerEmail)) {
      throw new Error('Salah satu email sudah terdaftar.');
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
      partnerEmail,
    ];

    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users').appendRow(row);
    return {
      token: signToken_(id, email),
      user: {
        id,
        email,
        partner_email: partnerEmail,
        actor_email: email,
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
  const user = users.find((u) =>
    String(u.email || '').toLowerCase() === email ||
    (u.partner_email && String(u.partner_email).toLowerCase() === email)
  );
  if (!user) throw new Error('Email atau password salah.');

  const hash = sha256Hex_(user.salt + ':' + password);
  if (hash !== user.password_hash) throw new Error('Email atau password salah.');

  return {
    token: signToken_(user.id, email),
    user: {
      id: user.id,
      email: user.email,
      partner_email: user.partner_email || '',
      drive_folder_id: user.drive_folder_id || '',
      actor_email: email,
      name: user.name,
      partner_name: user.partner_name,
      wedding_date: user.wedding_date,
    },
  };
}

function extractDriveFolderId_(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  const m = s.match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : s;
}

function handleUpdateProfile_(userId, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User tidak ditemukan.');

    const partnerEmail = String(payload.partner_email || '').trim().toLowerCase();
    if (partnerEmail && partnerEmail === String(user.email || '').toLowerCase()) {
      throw new Error('Email pasangan harus berbeda dengan email utama.');
    }
    if (isEmailTaken_(users, partnerEmail, userId)) {
      throw new Error('Email pasangan sudah dipakai akun lain.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
    const headers = SCHEMAS.users;
    user.name = String(payload.name || '').trim();
    user.partner_name = String(payload.partner_name || '').trim();
    user.wedding_date = String(payload.wedding_date || '');
    user.partner_email = partnerEmail;
    user.drive_folder_id = extractDriveFolderId_(payload.drive_folder_id);

    const rowValues = headers.map((h) => user[h] ?? '');
    sheet.getRange(user._rowIndex, 1, 1, headers.length).setValues([rowValues]);

    return {
      user: {
        id: user.id,
        email: user.email,
        partner_email: user.partner_email,
        drive_folder_id: user.drive_folder_id,
        name: user.name,
        partner_name: user.partner_name,
        wedding_date: user.wedding_date,
      },
    };
  } finally {
    lock.releaseLock();
  }
}

function logActivity_(userId, actionName, mod, itemLabel, actorEmail, now) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activity_logs');
  if (!sheet) return;
  sheet.appendRow([
    'log_' + Utilities.getUuid().slice(0, 8),
    userId,
    actionName,
    mod,
    String(itemLabel || '-'),
    String(actorEmail || '-'),
    now || new Date().toISOString(),
  ]);
}

function getItemLabel_(mod, item) {
  return item.item || item.name || item.task || item.activity || item.id || mod;
}

// --- CRUD Handlers ---
function handleGetAll_(userId) {
  const result = {};
  DATA_MODULES.forEach((mod) => {
    result[mod] = readRows_(mod)
      .filter((r) => r.user_id === userId)
      .map(stripMeta_);
  });
  result.activity_logs = readRows_('activity_logs')
    .filter((r) => r.user_id === userId)
    .map(stripMeta_)
    .slice(-30)
    .reverse();
  return result;
}

function handleUpsertItem_(auth, payload) {
  const userId = auth.userId;
  const actor = auth.actorEmail || userId;
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
        created_at: existing.created_at || existing.updated_at || now,
        created_by: existing.created_by || actor,
        updated_at: now,
        updated_by: actor,
      });
      const rowValues = headers.map((h) => merged[h] ?? '');
      sheet.getRange(existing._rowIndex, 1, 1, headers.length).setValues([rowValues]);
      logActivity_(userId, 'UPDATE', mod, getItemLabel_(mod, merged), actor, now);
      return { item: merged };
    } else {
      const created = Object.assign({}, item, {
        id: mod.slice(0, 3) + '_' + Utilities.getUuid().slice(0, 8),
        user_id: userId,
        created_at: now,
        created_by: actor,
        updated_at: now,
        updated_by: actor,
      });
      const rowValues = headers.map((h) => created[h] ?? '');
      sheet.appendRow(rowValues);
      logActivity_(userId, 'CREATE', mod, getItemLabel_(mod, created), actor, now);
      return { item: created };
    }
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteItem_(auth, payload) {
  const userId = auth.userId;
  const actor = auth.actorEmail || userId;
  const mod = payload.module;
  const id = payload.id;
  if (DATA_MODULES.indexOf(mod) === -1) throw new Error('Modul tidak valid.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = readRows_(mod);
    const existing = rows.find((r) => r.id === id && r.user_id === userId);
    if (!existing) throw new Error('Data tidak ditemukan.');
    const label = getItemLabel_(mod, existing);
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(mod).deleteRow(existing._rowIndex);
    logActivity_(userId, 'DELETE', mod, label, actor, new Date().toISOString());
    return { deleted: true };
  } finally {
    lock.releaseLock();
  }
}

function handleUploadReceipt_(auth, payload) {
  const userId = auth.userId;
  const actor = auth.actorEmail || userId;
  const base64 = String(payload.base64 || '');
  const mimeType = String(payload.mimeType || 'image/jpeg');
  const filename = String(payload.filename || ('kwitansi_' + Date.now() + '.jpg'));
  if (!base64) throw new Error('File bukti tidak boleh kosong.');

  const users = readRows_('users');
  const user = users.find((u) => u.id === userId);
  const customFolderId = extractDriveFolderId_(user && user.drive_folder_id);

  let targetFolder;
  if (customFolderId) {
    targetFolder = DriveApp.getFolderById(customFolderId);
  } else {
    const rootName = 'My Weeding Plan - Bukti Kwitansi';
    const rootFolders = DriveApp.getFoldersByName(rootName);
    const rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootName);
    const userFolders = rootFolder.getFoldersByName(userId);
    targetFolder = userFolders.hasNext() ? userFolders.next() : rootFolder.createFolder(userId);
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
  const file = targetFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Access.VIEW);

  const now = new Date().toISOString();
  logActivity_(userId, 'UPLOAD_RECEIPT', payload.module || 'budgets', filename, actor, now);

  return {
    url: file.getUrl(),
    uploaded_at: now,
    uploaded_by: actor,
  };
}

function handleResetUserData_(auth) {
  const userId = auth.userId;
  const actor = auth.actorEmail || userId;
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let totalDeleted = 0;
    DATA_MODULES.forEach((mod) => {
      const sheet = ss.getSheetByName(mod);
      if (!sheet) return;
      const rows = readRows_(mod).filter((r) => r.user_id === userId);
      for (let i = rows.length - 1; i >= 0; i--) {
        sheet.deleteRow(rows[i]._rowIndex);
        totalDeleted += 1;
      }
    });
    logActivity_(userId, 'RESET_ALL', 'all', 'Reset semua data akun', actor, new Date().toISOString());
    return { deleted: totalDeleted };
  } finally {
    lock.releaseLock();
  }
}

// --- Public Guest QR Check-in Handlers ---
function handlePublicEventInfo_(payload) {
  const userId = String(payload.user_id || '').trim();
  if (!userId) throw new Error('ID acara tidak valid.');
  const users = readRows_('users');
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Acara tidak ditemukan.');
  return {
    name: user.name,
    partner_name: user.partner_name,
    wedding_date: user.wedding_date,
  };
}

function handlePublicCheckin_(payload) {
  const userId = String(payload.user_id || '').trim();
  const guestName = String(payload.name || '').trim();
  if (!userId || !guestName) throw new Error('Nama tamu wajib diisi.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    if (!users.some((u) => u.id === userId)) throw new Error('Acara tidak ditemukan.');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('guests');
    const headers = SCHEMAS.guests;
    const rows = readRows_('guests');
    const existing = rows.find(
      (r) => r.user_id === userId && String(r.name).trim().toLowerCase() === guestName.toLowerCase()
    );
    const now = new Date().toISOString();
    const pax = Math.max(1, Number(payload.pax || 1));

    if (existing) {
      const merged = Object.assign({}, stripMeta_(existing), {
        pax: pax,
        rsvp: 'Hadir',
        group: payload.group || existing.group || 'Teman',
        phone: payload.phone || existing.phone || '',
        notes: payload.notes ? payload.notes : existing.notes,
        updated_at: now,
      });
      const rowValues = headers.map((h) => merged[h] ?? '');
      sheet.getRange(existing._rowIndex, 1, 1, headers.length).setValues([rowValues]);
      return { guest: merged, updated: true };
    } else {
      const created = {
        id: 'gue_' + Utilities.getUuid().slice(0, 8),
        user_id: userId,
        name: guestName,
        side: 'Umum',
        group: payload.group || 'Teman',
        pax: pax,
        rsvp: 'Hadir',
        phone: String(payload.phone || '').trim(),
        notes: String(payload.notes || '').trim(),
        updated_at: now,
      };
      const rowValues = headers.map((h) => created[h] ?? '');
      sheet.appendRow(rowValues);
      return { guest: created, updated: false };
    }
  } finally {
    lock.releaseLock();
  }
}
