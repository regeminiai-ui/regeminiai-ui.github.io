/**
 * NikahAiPlanner — Client-side AI Wedding Plan Generator (Rule & Keyword Engine)
 * Stored strictly in user's browser localStorage (never sent to Google Sheets).
 */
(function (global) {
  'use strict';

  const STORAGE_PREFIX = 'nikahplan_ai_plans_v1_';

  const CONCEPT_CATALOG = [
    {
      id: 'intimate',
      label: 'Intimate',
      keywords: ['intimate', 'akrab', 'keluarga', 'privat', 'private', 'kecil', 'sederhana', 'simpel'],
      defaultBudget: 45000000,
      defaultGuests: 80,
      titlePrefix: 'Intimate Wedding',
      extraChecklists: [
        { phase: 'H-3 Bulan', task: 'Kurasi daftar tamu inti & keluarga terdekat', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Siapkan konsep makan malam hangat & seating chart personal', pic: 'Berdua' },
      ],
    },
    {
      id: 'outdoor',
      label: 'Outdoor / Garden',
      keywords: ['outdoor', 'taman', 'garden', 'rustic', 'alam', 'terbuka', 'villa', 'kebun', 'pantai', 'beach'],
      defaultBudget: 95000000,
      defaultGuests: 200,
      titlePrefix: 'Garden & Rustic Outdoor',
      extraChecklists: [
        { phase: 'H-3 Bulan', task: 'Survei venue outdoor & cek rencana cadangan tenda hujan', pic: 'Berdua' },
        { phase: 'H-2 Minggu', task: 'Pastikan sound system outdoor, genset & pencahayaan malam', pic: 'WO / Vendor' },
      ],
    },
    {
      id: 'ballroom',
      label: 'Gedung / Ballroom',
      keywords: ['gedung', 'ballroom', 'hotel', 'mewah', 'luxury', 'glamour', 'grand', 'megah', 'elegan', 'konglo'],
      defaultBudget: 200000000,
      defaultGuests: 500,
      titlePrefix: 'Grand Ballroom Wedding',
      extraChecklists: [
        { phase: 'H-6 Bulan', task: 'Booking ballroom hotel / gedung & cek kapasitas parkir VIP', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Technical meeting lengkap bersama WO, lighting & multimedia', pic: 'WO / Berdua' },
      ],
    },
    {
      id: 'adat',
      label: 'Adat Tradisional',
      keywords: ['adat', 'jawa', 'sunda', 'minang', 'padang', 'batak', 'bugis', 'bali', 'betawi', 'tradisional', 'siraman', 'midodareni'],
      defaultBudget: 130000000,
      defaultGuests: 350,
      titlePrefix: 'Tradisional Adat',
      extraChecklists: [
        { phase: 'H-4 Bulan', task: 'Konsultasi susunan prosesi adat (siraman/seserahan/akad) dengan sesepuh', pic: 'Keluarga' },
        { phase: 'H-1 Bulan', task: 'Fitting busana adat pengantin, orang tua & besan', pic: 'Berdua' },
      ],
    },
    {
      id: 'syari',
      label: 'Syari / Islami',
      keywords: ['syari', 'islami', 'masjid', 'walimah', 'hijab', 'sederhana berkah', 'kua'],
      defaultBudget: 55000000,
      defaultGuests: 180,
      titlePrefix: 'Walimah Syari',
      extraChecklists: [
        { phase: 'H-3 Bulan', task: 'Koordinasi pemisahan area tamu ikhwan & akhwat (hijab/sekat)', pic: 'Berdua' },
        { phase: 'H-1 Bulan', task: 'Siapkan susunan acara akad & tausiyah singkat bersama MC', pic: 'Berdua' },
      ],
    },
  ];

  const BASE_CHECKLISTS = [
    { phase: 'H-6 Bulan', task: 'Tentukan tanggal acara, kota & kunci prioritas anggaran', pic: 'Berdua' },
    { phase: 'H-4 Bulan', task: 'Booking venue, catering utama & dokumentasi foto/video', pic: 'Berdua' },
    { phase: 'H-2 Bulan', task: 'Urus berkas KUA / Catatan Sipil & tes kesehatan pranikah', pic: 'Berdua' },
    { phase: 'H-1 Bulan', task: 'Finalisasi daftar tamu, sebar undangan & konfirmasi RSVP', pic: 'Berdua' },
    { phase: 'H-1 Minggu', task: 'Pelunasan vendor & briefing rundown hari-H bersama keluarga/WO', pic: 'Berdua' },
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
    const match = text.toLowerCase().match(/(\d{2,4})\s*(?:tamu|pax|orang|undangan|kursi)/i);
    return match ? Math.max(20, Math.min(3000, parseInt(match[1], 10))) : 0;
  }

  function detectConcepts(text) {
    const lower = text.toLowerCase();
    const matched = CONCEPT_CATALOG.filter((c) => c.keywords.some((kw) => lower.includes(kw)));
    return matched.length ? matched : [CONCEPT_CATALOG[0]];
  }

  function roundTo500k(n) {
    return Math.max(500000, Math.round(n / 500000) * 500000);
  }

  function buildBudgetAllocation(totalBudget, guestCount, primaryConcept) {
    const isGrand = primaryConcept.id === 'ballroom' || totalBudget >= 150000000;
    const weights = isGrand
      ? [
          ['Venue & Dekorasi', 'Sewa Ballroom / Venue & Dekorasi Pelaminan', 0.28],
          ['Catering', `Catering Prasmanan & Gubukan (${guestCount} pax)`, 0.36],
          ['Busana & MUA', 'Busana Pengantin, Orang Tua & MUA', 0.11],
          ['Dokumentasi', 'Foto, Video Cinematic & Prewedding', 0.08],
          ['Undangan & Souvenir', `Undangan Digital/Cetak & Souvenir (${guestCount} pcs)`, 0.06],
          ['KUA / Penghulu', 'Administrasi KUA / Catatan Sipil & Mahar', 0.04],
          ['Lainnya', 'WO, MC, Entertainment & Dana Cadangan', 0.07],
        ]
      : [
          ['Venue & Dekorasi', `Venue ${primaryConcept.label} & Dekorasi Akad/Resepsi`, 0.25],
          ['Catering', `Paket Catering & Konsumsi (${guestCount} pax)`, 0.38],
          ['Busana & MUA', 'Rias Pengantin & Sewa Busana Pasangan', 0.12],
          ['Dokumentasi', 'Dokumentasi Foto & Video Liputan', 0.09],
          ['Undangan & Souvenir', `Undangan & Souvenir Tamu (${guestCount} pcs)`, 0.06],
          ['KUA / Penghulu', 'Administrasi Nikah & Mahar', 0.04],
          ['Lainnya', 'MC / Musik Akustik & Dana Cadangan', 0.06],
        ];

    const items = weights.map(([category, item, ratio]) => ({
      category,
      item,
      estimated: roundTo500k(totalBudget * ratio),
    }));

    const diff = totalBudget - items.reduce((s, x) => s + x.estimated, 0);
    if (items.length && diff !== 0) {
      items[0].estimated = Math.max(500000, items[0].estimated + diff);
    }
    return items;
  }

  function generatePlanFromPrompt(promptText) {
    const cleanPrompt = String(promptText || '').trim();
    if (!cleanPrompt) throw new Error('Ceritakan dulu konsep pernikahan yang Anda inginkan.');

    const concepts = detectConcepts(cleanPrompt);
    const primary = concepts[0];
    const parsedBudget = parseBudgetIdr(cleanPrompt);
    const parsedGuests = parseGuestCount(cleanPrompt);

    const budgetTotal = parsedBudget > 0 ? parsedBudget : primary.defaultBudget;
    const guestCount = parsedGuests > 0 ? parsedGuests : primary.defaultGuests;

    const budgets = buildBudgetAllocation(budgetTotal, guestCount, primary);
    const checklists = [...BASE_CHECKLISTS];
    concepts.forEach((c) => {
      c.extraChecklists.forEach((ec) => {
        if (!checklists.some((x) => x.task === ec.task)) checklists.push(ec);
      });
    });

    const conceptNames = concepts.map((c) => c.label).join(' • ');
    return {
      id: 'ai_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: `AI Plan: ${primary.titlePrefix}`,
      badge: conceptNames,
      prompt: cleanPrompt,
      guestCount,
      budgetTotal,
      summary: `Rencana konsep ${conceptNames} untuk ±${guestCount} tamu dengan alokasi anggaran ${budgets.length} pos & ${checklists.length} checklist.`,
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
