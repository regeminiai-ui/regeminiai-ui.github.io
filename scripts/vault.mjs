#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PLAIN_PATH = path.join(ROOT, 'gas', 'Code.gs');
const ENC_PATH = path.join(ROOT, 'gas', 'Code.gs.enc');
const STATE_PATH = path.join(ROOT, '.vault-state.json');
const MAX_ATTEMPTS = 3;
const LOCK_MS = 15 * 60 * 1000;

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { fails: 0, lockUntil: 0 };
  }
}

function writeState(st) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(st), 'utf8');
}

function clearState() {
  if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);
}

function deriveKey(passphrase, salt) {
  return crypto.scryptSync(passphrase, salt, 32);
}

function encryptFile(passphrase) {
  if (!fs.existsSync(PLAIN_PATH)) {
    console.error('File tidak ditemukan:', PLAIN_PATH);
    process.exit(1);
  }
  const plain = fs.readFileSync(PLAIN_PATH);
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = {
    v: 1,
    alg: 'aes-256-gcm',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
  fs.writeFileSync(ENC_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log('Terenkripsi ->', ENC_PATH);
}

function decryptFile(passphrase) {
  if (!fs.existsSync(ENC_PATH)) {
    console.error('File terenkripsi tidak ditemukan:', ENC_PATH);
    process.exit(1);
  }
  const st = readState();
  if (st.lockUntil && Date.now() < st.lockUntil) {
    const secs = Math.ceil((st.lockUntil - Date.now()) / 1000);
    console.error(`Akses diblokir sementara (3x salah). Coba lagi dalam ${secs} detik.`);
    process.exit(1);
  }
  try {
    const payload = JSON.parse(fs.readFileSync(ENC_PATH, 'utf8'));
    const salt = Buffer.from(payload.salt, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const data = Buffer.from(payload.data, 'base64');
    const key = deriveKey(passphrase, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    fs.writeFileSync(PLAIN_PATH, plain);
    clearState();
    console.log('Berhasil didekripsi ->', PLAIN_PATH);
  } catch {
    const nextFails = (st.fails || 0) + 1;
    if (nextFails >= MAX_ATTEMPTS) {
      writeState({ fails: 0, lockUntil: Date.now() + LOCK_MS });
      console.error('Owner Key salah 3x! Vault dikunci selama 15 menit.');
    } else {
      writeState({ fails: nextFails, lockUntil: 0 });
      console.error(`Owner Key salah! Sisa percobaan: ${MAX_ATTEMPTS - nextFails}x.`);
    }
    process.exit(1);
  }
}

const [, , cmd, key] = process.argv;
if (!cmd || !key || !['lock', 'unlock'].includes(cmd)) {
  console.log('Pemakaian:');
  console.log('  node scripts/vault.mjs lock "<OWNER_KEY>"');
  console.log('  node scripts/vault.mjs unlock "<OWNER_KEY>"');
  process.exit(1);
}

if (cmd === 'lock') encryptFile(key);
else decryptFile(key);
