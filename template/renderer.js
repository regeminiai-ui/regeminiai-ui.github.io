/**
 * Pure SVG Botanical, Floral, Heritage & Islamic Illustration Renderer
 * Zero emojis or Unicode symbol icons.
 */
(function (global) {
  'use strict';

  function buildCornerSvg(tpl) {
    const accent = tpl.accent || '#b85d69';
    const leaf = tpl.leaf || '#5c8a68';
    const soft = tpl.softBg || '#f5eee0';
    return `
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M198 4C155 18 125 48 112 90" stroke="${leaf}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M192 22C168 38 148 56 142 82" stroke="${leaf}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M150 28C136 16 122 22 126 36C136 38 146 34 150 28Z" fill="${leaf}" opacity="0.82"/>
        <path d="M124 54C108 46 98 56 106 68C118 68 124 62 124 54Z" fill="${leaf}" opacity="0.72"/>
        <path d="M168 62C176 76 166 88 154 80C154 70 160 64 168 62Z" fill="${leaf}" opacity="0.76"/>
        <circle cx="176" cy="24" r="24" fill="${accent}" opacity="0.22"/>
        <circle cx="176" cy="24" r="16" fill="${accent}" opacity="0.45"/>
        <circle cx="176" cy="24" r="9" fill="${accent}" opacity="0.85"/>
        <circle cx="176" cy="24" r="3.5" fill="${soft}"/>
        <circle cx="142" cy="18" r="14" fill="${accent}" opacity="0.28"/>
        <circle cx="142" cy="18" r="8" fill="${accent}" opacity="0.72"/>
        <circle cx="142" cy="18" r="2.8" fill="${soft}"/>
        <circle cx="182" cy="60" r="15" fill="${accent}" opacity="0.25"/>
        <circle cx="182" cy="60" r="8.5" fill="${accent}" opacity="0.65"/>
        <circle cx="182" cy="60" r="3" fill="${soft}"/>
        <circle cx="110" cy="28" r="7" fill="${accent}" opacity="0.55"/>
        <circle cx="152" cy="94" r="6" fill="${accent}" opacity="0.5"/>
      </svg>`;
  }

  function buildCrestSvg(tpl) {
    const accent = tpl.accent || '#b85d69';
    const leaf = tpl.leaf || '#5c8a68';
    const motif = tpl.motif || 'floral';

    if (motif === 'islamic') {
      return `
        <svg class="invite-crest-svg" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M24 84V46C24 26 44 12 70 8C96 12 116 26 116 46V84" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M34 84V48C34 32 50 20 70 17C90 20 106 32 106 48V84" stroke="${leaf}" stroke-width="1.2" stroke-dasharray="3 3"/>
          <path d="M74 33C64 33 57 41 57 50C57 59 64 67 74 67C68 64 65 57 65 50C65 43 68 36 74 33Z" fill="${accent}"/>
          <path d="M84 44L86 48L90 49L87 52L88 56L84 54L80 56L81 52L78 49L82 48Z" fill="${accent}"/>
        </svg>`;
    }

    if (motif === 'heritage') {
      return `
        <svg class="invite-crest-svg" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M70 8L108 58L94 84H46L32 58L70 8Z" stroke="${accent}" stroke-width="1.8" fill="${accent}" fill-opacity="0.08"/>
          <path d="M70 18L96 56L86 76H54L44 56L70 18Z" stroke="${leaf}" stroke-width="1.3"/>
          <path d="M70 28V74M56 54H84" stroke="${accent}" stroke-width="1.3" stroke-linecap="round"/>
          <circle cx="70" cy="46" r="5" fill="${accent}"/>
        </svg>`;
    }

    if (motif === 'royal') {
      return `
        <svg class="invite-crest-svg" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M36 62L46 30L62 46L70 22L78 46L94 30L104 62H36Z" stroke="${accent}" stroke-width="2" fill="${accent}" fill-opacity="0.16" stroke-linejoin="round"/>
          <rect x="36" y="66" width="68" height="7" rx="3.5" fill="${accent}"/>
          <circle cx="70" cy="18" r="3.5" fill="${accent}"/>
          <circle cx="45" cy="26" r="2.8" fill="${accent}"/>
          <circle cx="95" cy="26" r="2.8" fill="${accent}"/>
          <path d="M26 78C44 88 96 88 114 78" stroke="${leaf}" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
    }

    if (motif === 'minimal') {
      return `
        <svg class="invite-crest-svg" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="58" cy="48" r="24" stroke="${accent}" stroke-width="1.8"/>
          <circle cx="82" cy="48" r="24" stroke="${leaf}" stroke-width="1.8"/>
          <path d="M24 80H116" stroke="${accent}" stroke-width="1.2" opacity="0.6"/>
        </svg>`;
    }

    // Default: floral / botanical laurel wreath with two interlocking rings
    return `
      <svg class="invite-crest-svg" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M44 76C28 64 24 42 36 22" stroke="${leaf}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M96 76C112 64 116 42 104 22" stroke="${leaf}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M30 56C20 50 18 40 26 36C32 42 33 49 30 56Z" fill="${leaf}" opacity="0.8"/>
        <path d="M110 56C120 50 122 40 114 36C108 42 107 49 110 56Z" fill="${leaf}" opacity="0.8"/>
        <path d="M36 36C28 28 30 18 38 18C42 25 40 31 36 36Z" fill="${leaf}" opacity="0.72"/>
        <path d="M104 36C112 28 110 18 102 18C98 25 100 31 104 36Z" fill="${leaf}" opacity="0.72"/>
        <circle cx="62" cy="48" r="14" stroke="${accent}" stroke-width="2"/>
        <circle cx="78" cy="48" r="14" stroke="${accent}" stroke-width="2"/>
        <circle cx="70" cy="78" r="6" fill="${accent}" opacity="0.75"/>
        <circle cx="58" cy="76" r="4" fill="${accent}" opacity="0.5"/>
        <circle cx="82" cy="76" r="4" fill="${accent}" opacity="0.5"/>
      </svg>`;
  }

  function getMiniBadgeSvg(tpl) {
    const color = tpl.accent || '#b85d69';
    return `<svg class="tpl-swatch-svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/></svg>`;
  }

  function renderLivePreview(previewEl, tpl, coupleTitle, dateText) {
    if (!previewEl || !tpl) return;
    const cornerMarkup = buildCornerSvg(tpl);
    const crestMarkup = buildCrestSvg(tpl);
    const fontFamily = tpl.font === 'script'
      ? "'Great Vibes', 'Caveat', cursive"
      : (tpl.font === 'sans' ? "'Plus Jakarta Sans', sans-serif" : "'Cormorant Garamond', Georgia, serif");
    const coupleSize = tpl.font === 'script' ? '2rem' : '1.55rem';
    const textTransform = tpl.font === 'classic' ? 'uppercase' : 'none';

    previewEl.innerHTML = `
      <div class="tpl-preview-head">
        <span>Preview Langsung: <strong>${tpl.code} — ${tpl.name}</strong></span>
        <span class="badge badge-neutral">${tpl.category}</span>
      </div>
      <div class="tpl-preview-stage" style="background:${tpl.bg};">
        <div class="tpl-preview-card" style="background:${tpl.cardBg};border-color:${tpl.border};color:${tpl.text};">
          <div class="invite-corner-svg invite-corner-tr">${cornerMarkup}</div>
          <div class="invite-corner-svg invite-corner-bl">${cornerMarkup}</div>
          <div class="invite-inner-frame">
            ${crestMarkup}
            <div style="color:${tpl.accent};font-size:0.68rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">The Wedding Of</div>
            <div style="font-family:${fontFamily};font-size:${coupleSize};text-transform:${textTransform};font-weight:700;margin:4px 0;">${coupleTitle || 'Nama Pasangan'}</div>
            <div style="color:${tpl.muted};font-size:0.78rem;margin-bottom:10px;">${dateText || 'Sabtu, 23 Januari 2028'}</div>
            <div style="background:${tpl.softBg};border:1px dashed ${tpl.border};border-radius:10px;padding:10px 12px;margin-bottom:10px;">
              <div style="color:${tpl.muted};font-size:0.68rem;">Kepada Yth. Bapak/Ibu/Saudara/i</div>
              <div style="font-weight:700;font-size:0.9rem;">Nama Tamu Undangan</div>
            </div>
            <div style="background:${tpl.accent};color:#fff;border-radius:8px;padding:8px 12px;font-size:0.76rem;font-weight:700;">Scan QR di Lokasi Acara</div>
          </div>
        </div>
      </div>`;
  }

  function renderInvitationTheme(containerEl, crestEl, tpl) {
    if (!containerEl || !tpl) return;
    containerEl.setAttribute('data-invite-themed', 'true');
    containerEl.setAttribute('data-invite-font', tpl.font || 'serif');
    containerEl.style.setProperty('--inv-bg', tpl.bg);
    containerEl.style.setProperty('--inv-card', tpl.cardBg);
    containerEl.style.setProperty('--inv-soft', tpl.softBg);
    containerEl.style.setProperty('--inv-accent', tpl.accent);
    containerEl.style.setProperty('--inv-leaf', tpl.leaf);
    containerEl.style.setProperty('--inv-text', tpl.text);
    containerEl.style.setProperty('--inv-muted', tpl.muted);
    containerEl.style.setProperty('--inv-border', tpl.border);

    const card = containerEl.querySelector('.invite-card');
    if (card) {
      card.querySelectorAll('.invite-corner-svg').forEach((n) => n.remove());
      const cornerMarkup = buildCornerSvg(tpl);
      const tr = document.createElement('div');
      tr.className = 'invite-corner-svg invite-corner-tr';
      tr.innerHTML = cornerMarkup;
      const bl = document.createElement('div');
      bl.className = 'invite-corner-svg invite-corner-bl';
      bl.innerHTML = cornerMarkup;
      card.prepend(bl);
      card.prepend(tr);
    }

    if (crestEl) {
      crestEl.innerHTML = buildCrestSvg(tpl);
    }
  }

  global.InvitationRenderer = {
    renderInvitationTheme,
    getMiniBadgeSvg,
    renderLivePreview,
  };
})(window);
