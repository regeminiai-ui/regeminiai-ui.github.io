#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PLAIN_PATH = path.join(ROOT, 'gas', 'Code.gs');
const ENC_PATH = path.join(ROOT, 'gas', 'Code.gs.enc');

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
  console.log('Berhasil didekripsi ->', PLAIN_PATH);
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
