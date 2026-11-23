/**
 * NikahPlan — Google Apps Script Backend (Google Spreadsheet as Database)
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SCHEMAS = {
  users: ['id', 'email', 'name', 'partner_name', 'wedding_date', 'password_hash', 'salt', 'created_at', 'partner_email', 'drive_folder_id', 'tier', 'status', 'expires_at', 'license_code'],
  licenses: ['code', 'tier', 'duration_days', 'status', 'used_by_email', 'used_at', 'created_at'],
  payments: ['id', 'buyer_email', 'tier', 'amount', 'method', 'license_code', 'notes', 'confirmed_at'],
  budgets: ['id', 'user_id', 'category', 'item', 'estimated', 'actual', 'paid', 'status', 'notes', 'receipt_url', 'receipt_uploaded_at', 'receipt_uploaded_by', 'installments_json', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  guests: ['id', 'user_id', 'name', 'side', 'group', 'pax', 'rsvp', 'phone', 'notes', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  vendors: ['id', 'user_id', 'category', 'name', 'pic', 'phone', 'price', 'dp_paid', 'status', 'notes', 'receipt_url', 'receipt_uploaded_at', 'receipt_uploaded_by', 'installments_json', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  checklists: ['id', 'user_id', 'phase', 'task', 'pic', 'due_date', 'done', 'receipt_url', 'receipt_uploaded_at', 'receipt_uploaded_by', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  rundowns: ['id', 'user_id', 'event_name', 'start_time', 'end_time', 'activity', 'pic', 'location', 'notes', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  assets: ['id', 'user_id', 'module', 'item_label', 'file_name', 'drive_url', 'description', 'uploaded_by', 'uploaded_at', 'created_at', 'created_by', 'updated_at', 'updated_by'],
  activity_logs: ['id', 'user_id', 'action', 'module', 'item_label', 'actor_email', 'created_at'],
};

const DATA_MODULES = ['budgets', 'guests', 'vendors', 'checklists', 'rundowns', 'assets'];

function doGet() {
  return jsonResponse({ ok: true, service: 'NikahPlan API', status: 'running' });
}

// Jalankan fungsi ini 1x dari editor Apps Script (klik Run) untuk memberi izin tulis Google Drive
function authorizeDrive() {
  const f = DriveApp.getRootFolder().createFile('_nikahplan_auth_test.txt', 'ok');
  f.setTrashed(true);
  Logger.log('Drive write authorized');
}

// --- Admin License Generators (Jalankan dari Editor Apps Script) ---
function generateSederhanaCodes() { return generateLicenses_('sederhana', 10); }
function generateMediumCodes() { return generateLicenses_('medium', 10); }
function generateRichCodes() { return generateLicenses_('rich', 10); }

function generateLicenses_(tier, count) {
  ensureSchema_();
  const durations = { sederhana: 180, medium: 180, rich: 395 };
  const prefixes = { sederhana: 'SED', medium: 'MED', rich: 'RCH' };
  const days = durations[tier] || 180;
  const prefix = prefixes[tier] || 'GEN';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('licenses');
  const now = new Date().toISOString();
  const codes = [];
  for (let i = 0; i < (count || 10); i++) {
    const rand = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
    const code = 'MWP-' + prefix + '-' + rand;
    sheet.appendRow([code, tier, days, 'unused', '', '', now]);
    codes.push(code);
  }
  Logger.log('Generated ' + codes.length + ' ' + tier + ' codes: ' + codes.join(', '));
  return codes;
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
    if (action === 'publicGuestQrCheckin') return jsonResponse({ ok: true, data: handlePublicGuestQrCheckin_(payload) });

    // Admin routes (protected by Admin Key)
    if (action && action.indexOf('admin') === 0) {
      verifyAdminKey_(payload.admin_key);
      if (action === 'adminDashboard') return jsonResponse({ ok: true, data: handleAdminDashboard_() });
      if (action === 'adminGenerateCodes') return jsonResponse({ ok: true, data: handleAdminGenerateCodes_(payload) });
      if (action === 'adminConfirmPayment') return jsonResponse({ ok: true, data: handleAdminConfirmPayment_(payload) });
      if (action === 'adminSetUserStatus') return jsonResponse({ ok: true, data: handleAdminSetUserStatus_(payload) });
      if (action === 'adminDeleteUser') return jsonResponse({ ok: true, data: handleAdminDeleteUser_(payload) });
      if (action === 'adminUpdateKey') return jsonResponse({ ok: true, data: handleAdminUpdateKey_(payload) });
      return jsonResponse({ ok: false, error: 'Admin action tidak dikenal: ' + action });
    }

    // Protected routes
    const auth = verifyToken_(body.token);
    if (!auth) {
      return jsonResponse({ ok: false, code: 'UNAUTHORIZED', error: 'Sesi berakhir. Silakan login kembali.' });
    }

    if (action === 'updateProfile') return jsonResponse({ ok: true, data: handleUpdateProfile_(auth.userId, payload) });
    if (action === 'redeemLicense') return jsonResponse({ ok: true, data: handleRedeemLicense_(auth.userId, payload) });
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

const TIER_RANK = { sederhana: 1, medium: 2, rich: 3 };

function getUserPlanContext_(userId) {
  const users = readRows_('users');
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User tidak ditemukan.');
  const status = String(user.status || 'active').toLowerCase();
  if (status !== 'active') {
    throw new Error('Akun Anda berstatus "' + status + '". Silakan hubungi Admin.');
  }
  const tier = String(user.tier || 'rich').toLowerCase();
  const expiresAt = user.expires_at ? String(user.expires_at) : '';
  const isExpired = Boolean(expiresAt && Date.now() > new Date(expiresAt).getTime());
  return { user, tier, expiresAt, isExpired };
}

function assertWritablePlan_(ctx) {
  if (ctx.isExpired) {
    throw new Error('Masa aktif paket Anda telah berakhir. Perpanjang dengan Kode Lisensi di menu Pengaturan.');
  }
}

// --- Auth Handlers ---
function handleRegister_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const partnerEmail = String(payload.partner_email || '').trim().toLowerCase();
  const password = String(payload.password || '');
  const licenseCode = String(payload.license_code || '').trim().toUpperCase();
  if (!email || password.length < 6) {
    throw new Error('Email valid dan password minimal 6 karakter wajib diisi.');
  }
  if (!licenseCode) {
    throw new Error('Kode Lisensi wajib diisi untuk mendaftar.');
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

    const licenses = readRows_('licenses');
    const lic = licenses.find((l) => String(l.code || '').trim().toUpperCase() === licenseCode);
    if (!lic || String(lic.status || '').toLowerCase() !== 'unused') {
      throw new Error('Kode Lisensi tidak valid atau sudah digunakan.');
    }

    const tier = String(lic.tier || 'sederhana').toLowerCase();
    const durationDays = Number(lic.duration_days || 180);
    const finalPartnerEmail = tier === 'sederhana' ? '' : partnerEmail;

    const id = 'u_' + Utilities.getUuid().slice(0, 8);
    const salt = Utilities.getUuid().slice(0, 12);
    const hash = sha256Hex_(salt + ':' + password);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

    const userObj = {
      id,
      email,
      name: String(payload.name || '').trim(),
      partner_name: String(payload.partner_name || '').trim(),
      wedding_date: String(payload.wedding_date || ''),
      password_hash: hash,
      salt,
      created_at: now,
      partner_email: finalPartnerEmail,
      drive_folder_id: '',
      tier,
      status: 'active',
      expires_at: expiresAt,
      license_code: lic.code,
    };

    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
    const userHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0];
    userSheet.appendRow(userHeaders.map((h) => userObj[h] ?? ''));

    // Mark license as used
    const licSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('licenses');
    const licHeaders = licSheet.getRange(1, 1, 1, licSheet.getLastColumn()).getValues()[0];
    const updatedLic = Object.assign({}, stripMeta_(lic), {
      status: 'used',
      used_by_email: email,
      used_at: now,
    });
    licSheet.getRange(lic._rowIndex, 1, 1, licHeaders.length).setValues([licHeaders.map((h) => updatedLic[h] ?? '')]);

    return {
      token: signToken_(id, email),
      user: {
        id,
        email,
        partner_email: finalPartnerEmail,
        drive_folder_id: '',
        tier,
        status: 'active',
        expires_at: expiresAt,
        actor_email: email,
        name: userObj.name,
        partner_name: userObj.partner_name,
        wedding_date: userObj.wedding_date,
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

  const status = String(user.status || 'active').toLowerCase();
  if (status !== 'active') {
    throw new Error('Akun Anda berstatus "' + status + '". Silakan hubungi Admin.');
  }

  const tier = String(user.tier || 'rich').toLowerCase();
  return {
    token: signToken_(user.id, email),
    user: {
      id: user.id,
      email: user.email,
      partner_email: user.partner_email || '',
      drive_folder_id: user.drive_folder_id || '',
      tier,
      status,
      expires_at: user.expires_at || '',
      actor_email: email,
      name: user.name,
      partner_name: user.partner_name,
      wedding_date: user.wedding_date,
    },
  };
}

function handleRedeemLicense_(userId, payload) {
  const licenseCode = String(payload.license_code || '').trim().toUpperCase();
  if (!licenseCode) throw new Error('Masukkan Kode Lisensi.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User tidak ditemukan.');

    const licenses = readRows_('licenses');
    const lic = licenses.find((l) => String(l.code || '').trim().toUpperCase() === licenseCode);
    if (!lic || String(lic.status || '').toLowerCase() !== 'unused') {
      throw new Error('Kode Lisensi tidak valid atau sudah digunakan.');
    }

    const now = new Date().toISOString();
    const curTier = String(user.tier || 'sederhana').toLowerCase();
    const newTier = String(lic.tier || 'sederhana').toLowerCase();
    const finalTier = (TIER_RANK[newTier] || 1) >= (TIER_RANK[curTier] || 1) ? newTier : curTier;
    const baseTime = user.expires_at ? Math.max(Date.now(), new Date(user.expires_at).getTime()) : Date.now();
    const newExpiresAt = new Date(baseTime + Number(lic.duration_days || 180) * 86400000).toISOString();

    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
    const userHeaders = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0];
    user.tier = finalTier;
    user.status = 'active';
    user.expires_at = newExpiresAt;
    user.license_code = lic.code;
    userSheet.getRange(user._rowIndex, 1, 1, userHeaders.length).setValues([userHeaders.map((h) => user[h] ?? '')]);

    const licSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('licenses');
    const licHeaders = licSheet.getRange(1, 1, 1, licSheet.getLastColumn()).getValues()[0];
    const updatedLic = Object.assign({}, stripMeta_(lic), {
      status: 'used',
      used_by_email: user.email,
      used_at: now,
    });
    licSheet.getRange(lic._rowIndex, 1, 1, licHeaders.length).setValues([licHeaders.map((h) => updatedLic[h] ?? '')]);

    return {
      user: {
        id: user.id,
        email: user.email,
        partner_email: user.partner_email || '',
        drive_folder_id: user.drive_folder_id || '',
        tier: finalTier,
        status: 'active',
        expires_at: newExpiresAt,
        name: user.name,
        partner_name: user.partner_name,
        wedding_date: user.wedding_date,
      },
    };
  } finally {
    lock.releaseLock();
  }
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
    const ctx = getUserPlanContext_(userId);
    assertWritablePlan_(ctx);
    const users = readRows_('users');
    const user = ctx.user;

    const partnerEmail = ctx.tier === 'sederhana' ? '' : String(payload.partner_email || '').trim().toLowerCase();
    if (partnerEmail && partnerEmail === String(user.email || '').toLowerCase()) {
      throw new Error('Email pasangan harus berbeda dengan email utama.');
    }
    if (isEmailTaken_(users, partnerEmail, userId)) {
      throw new Error('Email pasangan sudah dipakai akun lain.');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    user.name = String(payload.name || '').trim();
    user.partner_name = String(payload.partner_name || '').trim();
    user.wedding_date = String(payload.wedding_date || '');
    user.partner_email = partnerEmail;
    user.drive_folder_id = ctx.tier === 'rich' ? extractDriveFolderId_(payload.drive_folder_id) : (user.drive_folder_id || '');

    const rowValues = headers.map((h) => user[h] ?? '');
    sheet.getRange(user._rowIndex, 1, 1, headers.length).setValues([rowValues]);

    return {
      user: {
        id: user.id,
        email: user.email,
        partner_email: user.partner_email,
        drive_folder_id: user.drive_folder_id || '',
        tier: ctx.tier,
        status: String(user.status || 'active'),
        expires_at: ctx.expiresAt,
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
  const ctx = getUserPlanContext_(userId);
  const result = {};
  DATA_MODULES.forEach((mod) => {
    result[mod] = readRows_(mod)
      .filter((r) => r.user_id === userId)
      .map(stripMeta_);
  });
  result.activity_logs = ctx.tier === 'rich'
    ? readRows_('activity_logs').filter((r) => r.user_id === userId).map(stripMeta_).slice(-30).reverse()
    : [];
  result.plan = {
    tier: ctx.tier,
    status: String(ctx.user.status || 'active'),
    expires_at: ctx.expiresAt,
    is_expired: ctx.isExpired,
  };
  return result;
}

function resolveActorEmail_(auth) {
  if (auth && auth.actorEmail) return auth.actorEmail;
  if (auth && auth.userId) {
    const users = readRows_('users');
    const u = users.find((x) => x.id === auth.userId);
    if (u && u.email) return String(u.email);
  }
  return '-';
}

function handleUpsertItem_(auth, payload) {
  const userId = auth.userId;
  const actor = resolveActorEmail_(auth);
  const mod = payload.module;
  if (DATA_MODULES.indexOf(mod) === -1) throw new Error('Modul tidak valid.');
  const item = payload.item || {};

  const ctx = getUserPlanContext_(userId);
  assertWritablePlan_(ctx);
  if (ctx.tier === 'sederhana' && ['vendors', 'rundowns', 'assets'].indexOf(mod) !== -1) {
    throw new Error('Fitur ini tersedia mulai paket Medium / Rich.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(mod);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
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
      if (ctx.tier === 'sederhana' && mod === 'guests') {
        const count = readRows_('guests').filter((r) => r.user_id === userId).length;
        if (count >= 100) throw new Error('Paket Sederhana maksimal 100 tamu. Upgrade ke Medium/Rich untuk unlimited.');
      }
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
  const actor = resolveActorEmail_(auth);
  const mod = payload.module;
  const id = payload.id;
  if (DATA_MODULES.indexOf(mod) === -1) throw new Error('Modul tidak valid.');
  const ctx = getUserPlanContext_(userId);
  assertWritablePlan_(ctx);

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
  const actor = resolveActorEmail_(auth);
  const ctx = getUserPlanContext_(userId);
  assertWritablePlan_(ctx);
  if (ctx.tier === 'sederhana') {
    throw new Error('Upload bukti ke Google Drive tersedia mulai paket Medium / Rich.');
  }
  const base64 = String(payload.base64 || '');
  const mimeType = String(payload.mimeType || 'image/jpeg');
  const filename = String(payload.filename || ('kwitansi_' + Date.now() + '.jpg'));
  if (!base64) throw new Error('File bukti tidak boleh kosong.');

  const user = ctx.user;
  const customFolderId = ctx.tier === 'rich' ? extractDriveFolderId_(user && user.drive_folder_id) : '';

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
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // Tetap lanjutkan jika folder membatasi perubahan sharing
  }

  const now = new Date().toISOString();
  const fileUrl = file.getUrl();
  const modName = String(payload.module || 'assets');
  const itemLabel = String(payload.item_label || filename);
  const desc = String(payload.description || '');

  const assetObj = {
    id: 'ass_' + Utilities.getUuid().slice(0, 8),
    user_id: userId,
    module: modName,
    item_label: itemLabel,
    file_name: filename,
    drive_url: fileUrl,
    description: desc,
    uploaded_by: actor,
    uploaded_at: now,
    created_at: now,
    created_by: actor,
    updated_at: now,
    updated_by: actor,
  };
  const assetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('assets');
  if (assetSheet) {
    const assetHeaders = assetSheet.getRange(1, 1, 1, assetSheet.getLastColumn()).getValues()[0];
    assetSheet.appendRow(assetHeaders.map((h) => assetObj[h] ?? ''));
  }

  logActivity_(userId, 'UPLOAD_RECEIPT', modName, filename, actor, now);

  return {
    url: fileUrl,
    uploaded_at: now,
    uploaded_by: actor,
    asset: assetObj,
  };
}

function handleResetUserData_(auth) {
  const userId = auth.userId;
  const actor = resolveActorEmail_(auth);
  const ctx = getUserPlanContext_(userId);
  assertWritablePlan_(ctx);
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

    // File di Google Drive client TIDAK dihapus agar bukti tetap aman di Drive client
    logActivity_(userId, 'RESET_ALL', 'all', 'Reset data akun (file Drive tetap aman)', actor, new Date().toISOString());
    return { deleted: totalDeleted };
  } finally {
    lock.releaseLock();
  }
}

// --- Public Guest QR Check-in Handlers ---
function handlePublicEventInfo_(payload) {
  const userId = String(payload.user_id || '').trim();
  const guestId = String(payload.guest_id || '').trim();
  if (!userId) throw new Error('ID acara tidak valid.');
  const users = readRows_('users');
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('Acara tidak ditemukan.');
  let guest = null;
  if (guestId) {
    const guests = readRows_('guests');
    const g = guests.find((x) => x.id === guestId && x.user_id === userId);
    if (g) {
      guest = { id: g.id, name: g.name, pax: g.pax, rsvp: g.rsvp };
    }
  }
  return {
    name: user.name,
    partner_name: user.partner_name,
    wedding_date: user.wedding_date,
    tier: String(user.tier || 'rich').toLowerCase(),
    guest: guest,
  };
}

function handlePublicGuestQrCheckin_(payload) {
  const userId = String(payload.user_id || '').trim();
  const guestId = String(payload.guest_id || '').trim();
  if (!userId || !guestId) throw new Error('Link tamu tidak valid.');
  const ctx = getUserPlanContext_(userId);
  assertWritablePlan_(ctx);
  if (ctx.tier !== 'rich') {
    throw new Error('Scan QR pribadi tamu khusus untuk paket Rich.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('guests');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rows = readRows_('guests');
    const existing = rows.find((r) => r.id === guestId && r.user_id === userId);
    if (!existing) throw new Error('Data tamu tidak ditemukan.');

    const now = new Date().toISOString();
    const actor = existing.name + ' (QR Scan)';
    const merged = Object.assign({}, stripMeta_(existing), {
      rsvp: 'Hadir',
      updated_at: now,
      updated_by: actor,
    });
    sheet.getRange(existing._rowIndex, 1, 1, headers.length).setValues([headers.map((h) => merged[h] ?? '')]);
    logActivity_(userId, 'UPDATE', 'guests', existing.name + ' (Hadir via QR)', actor, now);
    return { guest: merged };
  } finally {
    lock.releaseLock();
  }
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

// --- Admin Panel Handlers ---
function getAdminKey_() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty('NIKAHPLAN_ADMIN_KEY');
  if (!key) {
    key = 'admin-mwp-2026';
    props.setProperty('NIKAHPLAN_ADMIN_KEY', key);
  }
  return key;
}

function verifyAdminKey_(inputKey) {
  if (!inputKey || String(inputKey).trim() !== getAdminKey_()) {
    throw new Error('Admin Key salah.');
  }
}

function handleAdminDashboard_() {
  const users = readRows_('users').map((u) => {
    const clean = stripMeta_(u);
    delete clean.password_hash;
    delete clean.salt;
    return clean;
  });
  const licenses = readRows_('licenses').map(stripMeta_).reverse();
  const payments = readRows_('payments').map(stripMeta_).reverse();
  return { users, licenses, payments };
}

function handleAdminGenerateCodes_(payload) {
  const tier = String(payload.tier || 'medium').toLowerCase();
  const count = Math.min(50, Math.max(1, Number(payload.count || 5)));
  const codes = generateLicenses_(tier, count);
  return { codes };
}

function handleAdminConfirmPayment_(payload) {
  const buyerEmail = String(payload.buyer_email || '').trim().toLowerCase();
  const tier = String(payload.tier || 'medium').toLowerCase();
  const amount = Number(payload.amount || 0);
  const method = String(payload.method || 'Transfer / QRIS').trim();
  const notes = String(payload.notes || '').trim();
  if (!buyerEmail) throw new Error('Email pembeli wajib diisi.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const codes = generateLicenses_(tier, 1);
    const code = codes[0];
    const now = new Date().toISOString();
    const payment = {
      id: 'pay_' + Utilities.getUuid().slice(0, 8),
      buyer_email: buyerEmail,
      tier: tier,
      amount: amount,
      method: method,
      license_code: code,
      notes: notes,
      confirmed_at: now,
    };
    const paySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('payments');
    const payHeaders = paySheet.getRange(1, 1, 1, paySheet.getLastColumn()).getValues()[0];
    paySheet.appendRow(payHeaders.map((h) => payment[h] ?? ''));
    return { payment, license_code: code };
  } finally {
    lock.releaseLock();
  }
}

function handleAdminSetUserStatus_(payload) {
  const userId = String(payload.user_id || '').trim();
  const newStatus = String(payload.status || '').trim().toLowerCase();
  if (!userId || ['active', 'non-active', 'in-active'].indexOf(newStatus) === -1) {
    throw new Error('Status tidak valid (pilih active / non-active / in-active).');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const users = readRows_('users');
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User tidak ditemukan.');

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('users');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    user.status = newStatus;
    if (payload.tier) user.tier = String(payload.tier).toLowerCase();
    sheet.getRange(user._rowIndex, 1, 1, headers.length).setValues([headers.map((h) => user[h] ?? '')]);
    return { user_id: userId, status: newStatus };
  } finally {
    lock.releaseLock();
  }
}

function handleAdminDeleteUser_(payload) {
  const userId = String(payload.user_id || '').trim();
  if (!userId) throw new Error('User ID tidak valid.');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const users = readRows_('users');
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User tidak ditemukan.');

    // Hapus semua data milik user_id (otomatis mencakup email utama & email pasangan)
    // File di Google Drive client TIDAK dihapus
    const sheetsToClean = DATA_MODULES.concat(['activity_logs']);
    sheetsToClean.forEach((mod) => {
      const sheet = ss.getSheetByName(mod);
      if (!sheet) return;
      const rows = readRows_(mod).filter((r) => r.user_id === userId);
      for (let i = rows.length - 1; i >= 0; i--) {
        sheet.deleteRow(rows[i]._rowIndex);
      }
    });

    ss.getSheetByName('users').deleteRow(user._rowIndex);
    return { deleted: true, email: user.email, partner_email: user.partner_email || '' };
  } finally {
    lock.releaseLock();
  }
}

function handleAdminUpdateKey_(payload) {
  const newKey = String(payload.new_key || '').trim();
  if (newKey.length < 6) throw new Error('Admin Key baru minimal 6 karakter.');
  PropertiesService.getScriptProperties().setProperty('NIKAHPLAN_ADMIN_KEY', newKey);
  return { updated: true };
}
