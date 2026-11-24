/**
 * NikahAiPlanner — Client-side AI Wedding Plan Generator
 * Referensi tren & standar biaya pernikahan Pulau Jawa 10 tahun terakhir (2016–2026).
 * Tersimpan 100% di localStorage browser user (tidak dikirim ke Google Sheets admin).
 */
(function (global) {
  'use strict';

  const STORAGE_PREFIX = 'nikahplan_ai_plans_v1_';

  const JAVA_REGIONS = [
    {
      id: 'jabodetabek',
      name: 'Jabodetabek',
      keywords: ['jakarta', 'jaksel', 'jakpus', 'jakbar', 'jaktim', 'jakut', 'bogor', 'depok', 'tangerang', 'tangsel', 'bekasi', 'jabodetabek', 'puncak', 'sentul'],
      costFactor: 1.25,
      perPaxEstimate: 135000,
      venueNote: 'Gedung/Hotel/Resto Jabodetabek',
    },
    {
      id: 'jabar',
      name: 'Bandung & Jawa Barat',
      keywords: ['bandung', 'lembang', 'cimahi', 'garut', 'tasik', 'tasikmalaya', 'cirebon', 'sukabumi', 'purwakarta', 'subang', 'jabar', 'jawa barat', 'ciwidey'],
      costFactor: 1.0,
      perPaxEstimate: 95000,
      venueNote: 'Villa/Garden Lembang atau Gedung Bandung',
    },
    {
      id: 'jateng_diy',
      name: 'Jogja, Solo & Jawa Tengah',
      keywords: ['jogja', 'yogyakarta', 'sleman', 'bantul', 'solo', 'surakarta', 'semarang', 'magelang', 'klaten', 'salatiga', 'purwokerto', 'tegal', 'pekalongan', 'jateng', 'jawa tengah'],
      costFactor: 0.78,
      perPaxEstimate: 70000,
      venueNote: 'Pendopo / Joglo Heritage atau Gedung Lokal',
    },
    {
      id: 'jatim',
      name: 'Surabaya, Malang & Jawa Timur',
      keywords: ['surabaya', 'malang', 'batu', 'sidoarjo', 'gresik', 'kediri', 'mojokerto', 'jember', 'banyuwangi', 'madiun', 'jatim', 'jawa timur'],
      costFactor: 1.05,
      perPaxEstimate: 98000,
      venueNote: 'Ballroom Surabaya / Villa Pegunungan Batu-Malang',
    },
  ];

  const CONCEPT_CATALOG = [
    {
      id: 'kua_hemat',
      label: 'Akad KUA / Hemat',
      keywords: ['kua', 'hemat', 'nikah gratis', 'akad saja', 'keluarga inti', 'syukuran rumah', 'minimalis hemat'],
      defaultBudget: 18000000,
      defaultGuests: 50,
      titlePrefix: 'Akad KUA & Syukuran Hangat',
      extraBudgets: [
        ['KUA / Penghulu', 'Biaya Pencatatan KUA (Gratis jam kerja / Rp600rb luar KUA)', 600000],
      ],
      extraChecklists: [
        { phase: 'H-2 Bulan', task: 'Daftar nikah online SIMKAH & lengkapi surat pengantar RT/RW/Kelurahan', pic: 'Berdua' },
        { phase: 'H-2 Minggu', task: 'Siapkan hantaran ringkas, mahar & konsumsi syukuran keluarga di rumah', pic: 'Keluarga' },
      ],
    },
    {
      id: 'intimate',
      label: 'Intimate Wedding',
      keywords: ['intimate', 'akrab', 'privat', 'private', 'inner circle', 'kecil', 'simpel', 'hangat'],
      defaultBudget: 55000000,
      defaultGuests: 100,
      titlePrefix: 'Intimate Wedding (Inner Circle)',
      extraChecklists: [
        { phase: 'H-3 Bulan', task: 'Kurasi daftar tamu inner circle (50–150 orang) agar tetap hangat & interaktif', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Susun seating chart personal & pilih menu plated/hibrida favorit tamu', pic: 'Berdua' },
        { phase: 'H-2 Minggu', task: 'Siapkan undangan digital + QR Check-in untuk tamu hadir tepat waktu', pic: 'Berdua' },
      ],
    },
    {
      id: 'outdoor',
      label: 'Clean Garden / Rustic Outdoor',
      keywords: ['outdoor', 'taman', 'garden', 'rustic', 'clean garden', 'alam', 'terbuka', 'villa', 'kebun', 'pantai', 'beach', 'semi outdoor'],
      defaultBudget: 95000000,
      defaultGuests: 200,
      titlePrefix: 'Clean Garden & Outdoor',
      extraChecklists: [
        { phase: 'H-4 Bulan', task: 'Survei venue garden/villa & pastikan paket sudah termasuk tenda transparan (Plan B hujan)', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Pilih dekorasi clean garden (dedaunan segar, sculptural arch & warm fairy lights)', pic: 'Berdua' },
        { phase: 'H-2 Minggu', task: 'Pastikan kapasitas genset, sound system outdoor & anti-nyamuk area taman', pic: 'WO / Vendor' },
      ],
    },
    {
      id: 'adat_jawa',
      label: 'Adat Jawa (Modern Heritage)',
      keywords: ['jawa', 'solo', 'jogja', 'paes', 'panggih', 'siraman', 'midodareni', 'joglo', 'pendopo', 'gebyok', 'heritage', 'kebaya'],
      defaultBudget: 120000000,
      defaultGuests: 350,
      titlePrefix: 'Adat Jawa & Modern Heritage',
      extraBudgets: [
        ['Adat & Prosesi', 'Siraman, Ubo Rampe, Kembar Mayang & Midodareni', 6500000],
        ['Adat & Prosesi', 'Paket Upacara Panggih, MC Adat & Perias Paes Solo/Jogja', 4500000],
      ],
      extraChecklists: [
        { phase: 'H-4 Bulan', task: 'Tentukan pakem adat (Solo Putri / Paes Ageng Jogja) & booking dukun/perias paes', pic: 'Keluarga' },
        { phase: 'H-2 Bulan', task: 'Siapkan daftar perlengkapan ubo rampe siraman (kembang setaman, kelapa gading, tumpeng)', pic: 'Keluarga' },
        { phase: 'H-1 Bulan', task: 'Fitting beskap/kebaya pengantin, orang tua & seragam keluarga besar', pic: 'Berdua' },
        { phase: 'H-1 Minggu', task: 'Koordinasi urutan prosesi Panggih (balangan suruh, injak telur, wiji dadi, sindur)', pic: 'MC Adat & WO' },
      ],
    },
    {
      id: 'adat_sunda',
      label: 'Adat Sunda',
      keywords: ['sunda', 'siger', 'lengser', 'mapag', 'saweran', 'nincak endog', 'bakakak', 'harupat', 'ngarajah', 'bandung'],
      defaultBudget: 110000000,
      defaultGuests: 350,
      titlePrefix: 'Adat Sunda & Mapag Panganten',
      extraBudgets: [
        ['Adat & Prosesi', 'Siraman & Ngarajah (Perlengkapan adat Sunda)', 3500000],
        ['Adat & Prosesi', 'Upacara Adat (Aki Lengser, Pemayung, Penari Mapag & Saweran)', 4500000],
      ],
      extraChecklists: [
        { phase: 'H-4 Bulan', task: 'Booking sanggar tari & penampil upacara adat Sunda (Aki Lengser & Mapag Panganten)', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Fitting Siger Sunda, kebaya akad & beskap bersama keluarga', pic: 'Berdua' },
        { phase: 'H-1 Minggu', task: 'Siapkan properti Nincak Endog, Meuleum Harupat, Pabetot Bakakak Ayam & koin saweran', pic: 'Keluarga & WO' },
      ],
    },
    {
      id: 'adat_betawi',
      label: 'Adat Betawi',
      keywords: ['betawi', 'palang pintu', 'roti buaya', 'tanjidor', 'ondel', 'si pitung'],
      defaultBudget: 115000000,
      defaultGuests: 350,
      titlePrefix: 'Adat Betawi & Palang Pintu',
      extraBudgets: [
        ['Adat & Prosesi', 'Tim Palang Pintu, Silat, Pantun & Musik Tanjidor/Gambang Kromong', 4500000],
        ['Adat & Prosesi', 'Seserahan Roti Buaya & Ornamen Dekorasi Betawi', 2500000],
      ],
      extraChecklists: [
        { phase: 'H-3 Bulan', task: 'Booking sanggar Palang Pintu & grup musik tradisional Betawi', pic: 'Keluarga' },
        { phase: 'H-2 Minggu', task: 'Pesan sepasang Roti Buaya & cek naskah pantun penyambutan besan', pic: 'Keluarga' },
      ],
    },
    {
      id: 'syari',
      label: 'Walimah Syari / Islami',
      keywords: ['syari', 'islami', 'masjid', 'walimah', 'hijab', 'muslim', 'halal', 'ikhwan', 'akhwat', 'nasyid'],
      defaultBudget: 60000000,
      defaultGuests: 200,
      titlePrefix: 'Walimah Syari & Khidmat',
      extraChecklists: [
        { phase: 'H-3 Bulan', task: 'Booking aula masjid / gedung dengan tata ruang pemisahan tamu ikhwan & akhwat (hijab/sekat)', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Pilih busana pengantin syar’i (tanpa tabarruj berlebih) & tim nasyid/akustik islami', pic: 'Berdua' },
        { phase: 'H-2 Minggu', task: 'Pastikan katering bersertifikat Halal & siapkan sesi tausiyah nikah singkat saat akad', pic: 'Berdua' },
      ],
    },
    {
      id: 'ballroom',
      label: 'Grand Ballroom / Luxury',
      keywords: ['gedung', 'ballroom', 'hotel', 'mewah', 'luxury', 'glamour', 'grand', 'megah', 'elegan', 'konglo', 'videotron', 'all inclusive'],
      defaultBudget: 220000000,
      defaultGuests: 500,
      titlePrefix: 'Grand Ballroom Modern',
      extraChecklists: [
        { phase: 'H-6 Bulan', task: 'Booking ballroom hotel / gedung all-inclusive & cek kapasitas parkir serta akses VIP keluarga', pic: 'Berdua' },
        { phase: 'H-3 Bulan', task: 'Food tasting menu hibrida (prasmanan + live cooking food stalls kekinian)', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Technical meeting lengkap WO, lighting, LED videotron & live streaming tamu luar kota', pic: 'WO & Berdua' },
      ],
    },
  ];

  const BASE_CHECKLISTS = [
    { phase: 'H-6 Bulan', task: 'Kunci tanggal baik, tentukan kota & batas maksimal total anggaran', pic: 'Berdua' },
    { phase: 'H-4 Bulan', task: 'Booking venue/paket all-in, katering utama & vendor dokumentasi foto/video', pic: 'Berdua' },
    { phase: 'H-2 Bulan', task: 'Urus administrasi KUA / Catatan Sipil & pemeriksaan kesehatan pranikah', pic: 'Berdua' },
    { phase: 'H-1 Bulan', task: 'Finalisasi jumlah porsi (prasmanan + gubukan), sebar undangan digital & pantau RSVP', pic: 'Berdua' },
    { phase: 'H-1 Minggu', task: 'Pelunasan termin akhir semua vendor, serahkan rundown & daftar VIP ke WO/MC', pic: 'Berdua' },
  ];

  function parseBudgetIdr(text) {
    const lower = text.toLowerCase().replace(/\./g, '').replace(/,/g, '.');
    const matchMiliar = lower.match(/(\d+(?:\.\d+)?)\s*(?:miliar|milyar|m\b)/i);
    if (matchMiliar) return Math.round(parseFloat(matchMiliar[1]) * 1000000000);

    const matchJuta = lower.match(/(\d+(?:\.\d+)?)\s*(?:juta|jt\b)/i);
    if (matchJuta) return Math.round(parseFloat(matchJuta[1]) * 1000000);

    const matchRp = lower.match(/rp\s*(\d{6,10})/i);
    if (matchRp) return Math.round(parseFloat(matchRp[1]));

    return 0;
  }

  function parseGuestCount(text) {
    const match = text.toLowerCase().match(/(\d{2,4})\s*(?:tamu|pax|orang|undangan|kursi|porsi)/i);
    return match ? Math.max(20, Math.min(3000, parseInt(match[1], 10))) : 0;
  }

  function detectRegion(text) {
    const lower = text.toLowerCase();
    return JAVA_REGIONS.find((r) => r.keywords.some((kw) => lower.includes(kw))) || null;
  }

  const WEDDING_TOPIC_KEYWORDS = [
    'nikah', 'pernikahan', 'wedding', 'kawin', 'akad', 'resepsi', 'lamaran', 'tunangan',
    'walimah', 'pengantin', 'mempelai', 'tamu', 'undangan', 'rsvp', 'budget', 'anggaran',
    'biaya', 'dana', 'katering', 'catering', 'dekor', 'dekorasi', 'venue', 'gedung',
    'pendopo', 'joglo', 'mua', 'rias', 'kebaya', 'beskap', 'souvenir', 'mahar',
    'seserahan', 'hantaran', 'penghulu', 'rundown', 'organizer', 'vendor', 'dokumentasi',
    'prewed', 'prewedding', 'siraman', 'panggih', 'midodareni', 'saweran', 'prasmanan',
    'gubukan', 'pelaminan', 'janur', 'gebyok', 'check-in', 'checkin', 'rencana', 'konsep',
  ];

  function isWeddingRelatedPrompt(text) {
    const lower = String(text || '').toLowerCase();
    if (parseBudgetIdr(text) > 0 || parseGuestCount(text) > 0) return true;
    if (CONCEPT_CATALOG.some((c) => c.keywords.some((kw) => lower.includes(kw)))) return true;
    return WEDDING_TOPIC_KEYWORDS.some((kw) => lower.includes(kw));
  }

  function detectConcepts(text) {
    const lower = text.toLowerCase();
    const matched = CONCEPT_CATALOG.filter((c) => c.keywords.some((kw) => lower.includes(kw)));
    return matched.length ? matched : [CONCEPT_CATALOG[1]];
  }

  function roundTo500k(n) {
    return Math.max(500000, Math.round(n / 500000) * 500000);
  }

  function buildBudgetAllocation(totalBudget, guestCount, primaryConcept, concepts, region) {
    const extraItems = [];
    concepts.forEach((c) => {
      (c.extraBudgets || []).forEach((eb) => {
        if (!extraItems.some((x) => x[1] === eb[1])) extraItems.push(eb);
      });
    });

    const extraSum = extraItems.reduce((s, x) => s + x[2], 0);
    const distributable = Math.max(Math.round(totalBudget * 0.65), totalBudget - extraSum);
    const hasKuaLine = extraItems.some((x) => x[0] === 'KUA / Penghulu');
    const isGrand = primaryConcept.id === 'ballroom' || totalBudget >= 150000000;

    const weights = isGrand
      ? [
          ['Catering', `Katering Hibrida (Prasmanan + Live Food Stalls, ${guestCount} pax)`, 0.42],
          ['Venue & Dekorasi', `Sewa ${region ? region.venueNote : 'Ballroom / Gedung'} & Dekorasi Utama`, 0.25],
          ['Busana & MUA', 'Busana Pengantin, Orang Tua, MUA & Hair/Hijab Do', 0.10],
          ['Dokumentasi', 'Foto, Video Cinematic, Drone & Same-Day Edit', 0.08],
          ['Undangan & Souvenir', `Undangan Digital/Cetak Terbatas & Souvenir (${guestCount} pcs)`, 0.05],
          ['Lainnya', 'WO Full-Service, MC, Entertainment & Dana Cadangan', 0.10],
        ]
      : [
          ['Catering', `Katering Prasmanan & Gubukan (${guestCount} pax)`, 0.44],
          ['Venue & Dekorasi', `${region ? region.venueNote : 'Venue ' + primaryConcept.label} & Dekorasi`, 0.23],
          ['Busana & MUA', 'Rias Pengantin, Busana Akad/Resepsi & Orang Tua', 0.12],
          ['Dokumentasi', 'Dokumentasi Foto & Video Liputan Akad-Resepsi', 0.08],
          ['Undangan & Souvenir', `Undangan Digital + Cetak Keluarga & Souvenir (${guestCount} pcs)`, 0.05],
          ['Lainnya', 'WO/Koordinator, MC, Musik & Dana Cadangan', 0.08],
        ];

    if (!hasKuaLine) {
      weights.push(['KUA / Penghulu', 'Administrasi KUA / Catatan Sipil & Mahar', 0.04]);
      weights[0][2] -= 0.02;
      weights[5][2] -= 0.02;
    }

    const items = weights.map(([category, item, ratio]) => ({
      category,
      item,
      estimated: roundTo500k(distributable * ratio),
    }));

    extraItems.forEach(([category, item, amount]) => {
      items.push({ category, item, estimated: amount });
    });

    const diff = totalBudget - items.reduce((s, x) => s + x.estimated, 0);
    if (items.length && diff !== 0) {
      items[0].estimated = Math.max(500000, items[0].estimated + diff);
    }
    return items;
  }

  function generatePlanFromPrompt(promptText) {
    const cleanPrompt = String(promptText || '').trim();
    if (!cleanPrompt) throw new Error('Mohon tuliskan terlebih dahulu konsep atau pertanyaan seputar rencana pernikahan Anda.');
    if (!isWeddingRelatedPrompt(cleanPrompt)) {
      throw new Error('Mohon maaf, permintaan tersebut tidak termasuk dalam layanan kami. Silakan tanyakan atau sampaikan hal yang menyangkut rencana dan manajemen pernikahan Anda.');
    }

    const region = detectRegion(cleanPrompt);
    const concepts = detectConcepts(cleanPrompt);
    const primary = concepts[0];
    const parsedBudget = parseBudgetIdr(cleanPrompt);
    const parsedGuests = parseGuestCount(cleanPrompt);

    const guestCount = parsedGuests > 0 ? parsedGuests : primary.defaultGuests;
    let budgetTotal = parsedBudget;
    if (budgetTotal <= 0) {
      const base = primary.defaultBudget * (region ? region.costFactor : 1);
      budgetTotal = roundTo500k(base);
    }

    const budgets = buildBudgetAllocation(budgetTotal, guestCount, primary, concepts, region);
    const checklists = [...BASE_CHECKLISTS];
    concepts.forEach((c) => {
      c.extraChecklists.forEach((ec) => {
        if (!checklists.some((x) => x.task === ec.task)) checklists.push(ec);
      });
    });

    const conceptNames = concepts.map((c) => c.label).join(' • ');
    const regionText = region ? ` di ${region.name}` : ' (Standar Pulau Jawa)';
    return {
      id: 'ai_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: `AI Plan: ${primary.titlePrefix}${region ? ' (' + region.name + ')' : ''}`,
      badge: conceptNames,
      prompt: cleanPrompt,
      guestCount,
      budgetTotal,
      summary: `Rencana konsep ${conceptNames}${regionText} untuk ±${guestCount} tamu (${budgets.length} pos anggaran & ${checklists.length} checklist bertahap).`,
      budgets,
      checklists,
      createdAt: new Date().toISOString(),
    };
  }

  function getStorageKey(userId) {
    return STORAGE_PREFIX + String(userId || 'guest');
  }

  function loadSavedPlans(userId) {
    try {
      const raw = localStorage.getItem(getStorageKey(userId));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function savePlan(userId, plan) {
    const list = loadSavedPlans(userId);
    list.unshift(plan);
    const trimmed = list.slice(0, 15);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(trimmed));
    return trimmed;
  }

  function deletePlan(userId, planId) {
    const list = loadSavedPlans(userId).filter((p) => p.id !== planId);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(list));
    return list;
  }

  global.NikahAiPlanner = {
    generatePlanFromPrompt,
    loadSavedPlans,
    savePlan,
    deletePlan,
  };
})(window);
