# NikahPlan — Aplikasi Rencana Pernikahan (Google Sheets + GitHub Pages)

Aplikasi web perencana pernikahan multi-user tanpa server berbayar:
- **Frontend**: HTML, CSS, JavaScript statis (siap deploy langsung ke `username.github.io`)
- **Database**: Google Spreadsheet via Google Apps Script (`gas/Code.gs`)
- **Autentikasi**: Register & Login per user dengan password hash (SHA-256 + salt) dan isolasi data per `user_id`

## Fitur
- **Ringkasan Dashboard**: Countdown hari-H, total anggaran vs terbayar, jumlah tamu & RSVP, status vendor, progres checklist.
- **Anggaran**: Estimasi vs aktual vs terbayar, filter status (`Belum Bayar`, `DP`, `Lunas`).
- **Daftar Tamu**: Pihak, grup, jumlah pax, status RSVP, kontak.
- **Vendor**: Kategori, PIC, harga paket, DP, status (`Survey`, `Deal`, `Lunas`, `Batal`).
- **Checklist**: Tahap persiapan (`H-6 Bulan` s/d `Hari-H`), toggle selesai langsung.
- **Rundown**: Jadwal acara terurut otomatis berdasarkan jam mulai.
- **Mode Demo Lokal**: Jika URL Google Apps Script belum diisi, aplikasi otomatis berjalan memakai `localStorage` untuk uji coba.

---

## Langkah 1: Setup Google Spreadsheet & Apps Script

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru (misal: `NikahPlan DB`).
2. Klik menu **Extensions → Apps Script**.
3. Hapus kode default di editor, lalu salin seluruh isi file `gas/Code.gs` ke dalamnya.
4. Simpan proyek (`Ctrl+S` / `Cmd+S`).
5. Klik **Deploy → New deployment**:
   - **Select type**: `Web app`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
6. Klik **Deploy**, izinkan akses (*Authorize access*), lalu salin **Web app URL** (`https://script.google.com/macros/s/.../exec`).

> Sheet (`users`, `budgets`, `guests`, `vendors`, `checklists`, `rundowns`) akan dibuat otomatis pada request pertama.

---

## Langkah 2: Hubungkan ke Frontend

Ada 2 cara:
1. **Langsung di kode (disarankan untuk publik/multi-user)**:
   Buka `app.js`, isi `DEFAULT_API_URL` di baris 7 dengan URL Web App Anda:
   ```js
   const DEFAULT_API_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```
2. **Lewat UI**: Klik **Konfigurasi URL Google Apps Script** di halaman login atau menu **Pengaturan**.

---

## Langkah 3: Deploy ke `github.io` (GitHub Pages)

1. Buat repository baru di GitHub (misal `nikahplan` atau `<username>.github.io`).
2. Push file `index.html`, `styles.css`, `app.js`, dan `README.md` ke branch `main`:
   ```bash
   git init
   git add index.html styles.css app.js README.md gas/
   git commit -m "Initial NikahPlan app"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. Di GitHub repository, buka **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
4. Tunggu 1–2 menit, lalu buka `https://<username>.github.io/<repo>/`.
