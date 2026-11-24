/**
 * Interactive Canva-Style SVG Invitation Renderer (100% Pure SVG, Zero Emojis)
 * - Animated Couple Stick-Man / Silhouette tailored per template motif & palette
 * - Category background SVG pattern (Batik Kawung, Botanical, Islamic Geo, Royal, Minimal)
 * - Top hanging ornament + Bottom scenic SVG (Joglo & Gunungan, Garden Bed, Mosque Arch, Royal Arch)
 * - IntersectionObserver scroll-reveal transitions
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

    return `
      <svg class="invite-crest-svg" viewBox="0 0 140 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M44 76C28 64 24 42 36 22" stroke="${leaf}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M96 76C112 64 116 42 104 22" stroke="${leaf}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M30 56C20 50 18 40 26 36C32 42 33 49 30 56Z" fill="${leaf}" opacity="0.8"/>
        <path d="M110 56C120 50 122 40 114 36C108 42 107 49 110 56Z" fill="${leaf}" opacity="0.8"/>
        <circle cx="62" cy="48" r="14" stroke="${accent}" stroke-width="2"/>
        <circle cx="78" cy="48" r="14" stroke="${accent}" stroke-width="2"/>
        <circle cx="70" cy="78" r="6" fill="${accent}" opacity="0.75"/>
      </svg>`;
  }

  function buildCoupleStickSvg(tpl) {
    const accent = tpl.accent || '#b85d69';
    const leaf = tpl.leaf || '#5c8a68';
    const text = tpl.text || '#2c2420';
    const soft = tpl.softBg || '#f5eee0';
    const motif = tpl.motif || 'floral';

    const groomHat = motif === 'heritage'
      ? `<path d="M62 34C62 24 82 24 82 34L86 38H58L62 34Z" fill="${accent}"/>`
      : (motif === 'islamic'
        ? `<path d="M63 32C65 25 79 25 81 32H63Z" fill="${accent}"/>`
        : (motif === 'royal'
          ? `<path d="M63 30L66 22L72 27L78 22L81 30H63Z" fill="${accent}"/>`
          : ''));

    const brideHead = motif === 'islamic'
      ? `<circle cx="128" cy="40" r="12" fill="${soft}" stroke="${accent}" stroke-width="2.2"/><circle cx="128" cy="39" r="7.5" fill="${tpl.cardBg}" stroke="${text}" stroke-width="1.6"/>`
      : `<circle cx="128" cy="39" r="9" fill="${tpl.cardBg}" stroke="${text}" stroke-width="2.2"/>
         <path d="M118 35C122 25 134 25 138 35" stroke="${accent}" stroke-width="2" fill="none"/>
         <path d="M134 31C144 38 148 56 144 74" stroke="${accent}" stroke-width="1.4" stroke-dasharray="3 2" opacity="0.75"/>`;

    return `
      <svg class="invite-couple-stick-svg" viewBox="0 0 200 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="100" cy="122" rx="64" ry="6" fill="${accent}" opacity="0.14"/>
        <!-- Laurel ring behind couple -->
        <path d="M46 106C28 84 32 46 56 26" stroke="${leaf}" stroke-width="1.6" stroke-linecap="round" opacity="0.65"/>
        <path d="M154 106C172 84 168 46 144 26" stroke="${leaf}" stroke-width="1.6" stroke-linecap="round" opacity="0.65"/>
        <!-- Floating Heart -->
        <path class="stick-heart" d="M100 32C100 32 92 25 92 20.5C92 18 94 16 96.5 16C98.2 16 99.4 17 100 18.2C100.6 17 101.8 16 103.5 16C106 16 108 18 108 20.5C108 25 100 32 100 32Z" fill="${accent}"/>

        <!-- Groom Stick-Man -->
        <g class="stick-groom">
          ${groomHat}
          <circle cx="72" cy="40" r="9" fill="${tpl.cardBg}" stroke="${text}" stroke-width="2.2"/>
          <path d="M72 49V85" stroke="${text}" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M62 54L72 50L82 54L79 84H65L62 54Z" fill="${accent}" fill-opacity="0.88" stroke="${text}" stroke-width="1.6"/>
          <path d="M67 85L63 118M77 85L81 118" stroke="${text}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M63 58L55 76M81 58L96 72" stroke="${text}" stroke-width="2.2" stroke-linecap="round"/>
        </g>

        <!-- Bride Stick-Woman -->
        <g class="stick-bride">
          ${brideHead}
          <path d="M128 50L114 96H142L128 50Z" fill="${soft}" stroke="${accent}" stroke-width="2"/>
          <path d="M122 96L120 118M134 96L136 118" stroke="${text}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M121 56L98 72M135 56L144 74" stroke="${text}" stroke-width="2.2" stroke-linecap="round"/>
          <!-- Bouquet -->
          <circle cx="97" cy="73" r="6" fill="${leaf}" opacity="0.85"/>
          <circle cx="95" cy="70" r="3" fill="${accent}"/>
          <circle cx="100" cy="71" r="2.8" fill="${accent}" opacity="0.8"/>
        </g>
      </svg>`;
  }

  function buildFooterSceneSvg(tpl) {
    const accent = tpl.accent || '#b85d69';
    const leaf = tpl.leaf || '#5c8a68';
    const motif = tpl.motif || 'floral';

    if (motif === 'heritage') {
      return `
        <svg class="invite-footer-scene" viewBox="0 0 400 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <!-- Joglo Roof & Gunungan Silhouette -->
          <path d="M110 48L178 16H222L290 48H110Z" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="1.5"/>
          <path d="M70 64L120 48H280L330 64H70Z" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="1.3"/>
          <path d="M135 64V88M175 64V88M225 64V88M265 64V88M60 88H340" stroke="${accent}" stroke-width="1.4"/>
          <path d="M46 88L62 52L78 88H46Z" fill="${leaf}" fill-opacity="0.22" stroke="${leaf}" stroke-width="1.2"/>
          <path d="M322 88L338 52L354 88H322Z" fill="${leaf}" fill-opacity="0.22" stroke="${leaf}" stroke-width="1.2"/>
        </svg>`;
    }

    if (motif === 'islamic') {
      return `
        <svg class="invite-footer-scene" viewBox="0 0 400 84" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M140 82V52C140 32 166 16 200 12C234 16 260 32 260 52V82" stroke="${accent}" stroke-width="1.6" fill="${accent}" fill-opacity="0.08"/>
          <path d="M90 82V60C90 48 106 40 124 38V82M276 82V38C294 40 310 48 310 60V82" stroke="${leaf}" stroke-width="1.3" opacity="0.65"/>
          <path d="M40 82H360" stroke="${accent}" stroke-width="1.3"/>
        </svg>`;
    }

    return `
      <svg class="invite-footer-scene" viewBox="0 0 400 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M40 66C110 42 290 42 360 66" stroke="${leaf}" stroke-width="1.4" opacity="0.6"/>
        <circle cx="160" cy="54" r="9" fill="${accent}" opacity="0.25"/>
        <circle cx="200" cy="48" r="12" fill="${accent}" opacity="0.32"/>
        <circle cx="240" cy="54" r="9" fill="${accent}" opacity="0.25"/>
        <circle cx="200" cy="48" r="5" fill="${accent}" opacity="0.8"/>
      </svg>`;
  }

  function getMiniBadgeSvg(tpl) {
    const color = tpl.accent || '#b85d69';
    return `<svg class="tpl-swatch-svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/></svg>`;
  }

  function renderCardThumbnail(tpl, coupleTitle, dateText) {
    const cornerMarkup = buildCornerSvg(tpl);
    const coupleSvg = buildCoupleStickSvg(tpl);
    const fontFamily = tpl.font === 'script'
      ? "'Great Vibes', 'Caveat', cursive"
      : (tpl.font === 'sans' ? "'Plus Jakarta Sans', sans-serif" : "'Cormorant Garamond', Georgia, serif");
    const coupleSize = tpl.font === 'script' ? '1.35rem' : '1.05rem';
    const textTransform = tpl.font === 'classic' ? 'uppercase' : 'none';

    return `
      <div class="tpl-thumb-stage" style="background:${tpl.bg};">
        <div class="tpl-thumb-card" style="background:${tpl.cardBg};border-color:${tpl.border};color:${tpl.text};">
          <div class="invite-corner-svg invite-corner-tr">${cornerMarkup}</div>
          <div class="invite-corner-svg invite-corner-bl">${cornerMarkup}</div>
          <div class="invite-inner-frame">
            <div class="tpl-thumb-couple-wrap">${coupleSvg}</div>
            <div style="color:${tpl.accent};font-size:0.55rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">The Wedding Of</div>
            <div style="font-family:${fontFamily};font-size:${coupleSize};text-transform:${textTransform};font-weight:700;margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${coupleTitle}</div>
            <div style="color:${tpl.muted};font-size:0.65rem;margin-bottom:6px;">${dateText}</div>
            <div style="background:${tpl.accent};color:#fff;border-radius:6px;padding:4px 8px;font-size:0.62rem;font-weight:700;">Buka Undangan</div>
          </div>
        </div>
      </div>`;
  }

  function initScrollReveal(rootEl) {
    if (!rootEl) return;
    const items = rootEl.querySelectorAll('.invite-reveal');
    if (!items.length) return;
    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  function renderInvitationTheme(containerEl, crestEl, tpl) {
    if (!containerEl || !tpl) return;
    containerEl.setAttribute('data-invite-themed', 'true');
    containerEl.setAttribute('data-invite-font', tpl.font || 'serif');
    containerEl.setAttribute('data-invite-motif', tpl.motif || 'floral');
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

    const coverCoupleEl = containerEl.querySelector('#gs-cover-couple-svg');
    if (coverCoupleEl) {
      coverCoupleEl.innerHTML = buildCoupleStickSvg(tpl);
    }

    const footerSceneEl = containerEl.querySelector('#gs-footer-scene');
    if (footerSceneEl) {
      footerSceneEl.innerHTML = buildFooterSceneSvg(tpl);
    }
  }

  global.InvitationRenderer = {
    renderInvitationTheme,
    getMiniBadgeSvg,
    renderCardThumbnail,
    initScrollReveal,
  };
})(window);
