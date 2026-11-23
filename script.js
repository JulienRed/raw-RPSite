/* =========================================================
   RAW RP — script du site
   ---------------------------------------------------------
   Le contenu vient de content.js (modifiable via admin.html).
   Si l'admin a enregistré une version plus récente dans ce
   navigateur, c'est elle qui est affichée.
   ========================================================= */
(() => {
const D = window.RAWRP_DEFAULT;
const PREVIEW = new URLSearchParams(location.search).has('apercu');
let C = null;            // contenu affiché
let PREV = {};           // images pas encore en ligne (aperçu admin)
let timers = [];         // compte à rebours
let spy = null;          // observateur de sections

/* ---------- Utilitaires ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Mise en forme simple : *texte* = en couleur, **texte** = gras, retour à la ligne = <br>
const fmt = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\n/g, '<br>');
const src = (p) => esc(PREV[p] || p);
const safeUrl = (u) => /^(https?:|fivem:|mailto:|#|images\/|data:image\/)/i.test(u || '') ? u : '#';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || 'Copié !'); }
  catch (e) { toast('Copie impossible, sélectionne le texte à la main'); }
}

/* ---------- Fusion du contenu avec les valeurs par défaut ---------- */
function merge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === 'object') {
    const o = { ...base };
    if (over && typeof over === 'object' && !Array.isArray(over)) for (const k in over) o[k] = k in base ? merge(base[k], over[k]) : over[k];
    return o;
  }
  return over === undefined || over === null ? base : over;
}
function normalize(raw) {
  const c = merge(D, raw || {});
  // ajoute les sections qui manqueraient
  D.sections.forEach((s) => { if (!c.sections.some((x) => x.id === s.id)) c.sections.push({ ...s }); });
  c.sections = c.sections.filter((s) => D.sections.some((d) => d.id === s.id));
  return c;
}

/* =========================================================
   Illustrations de Los Santos (SVG dessiné, aucune image externe)
   ========================================================= */
const SCENES = {
  centre: {
    titre: 'Centre-ville au crépuscule',
    sky: ['#17121c', '#4b2a2a', '#d98d45'], sun: [1180, 590, 110, '#ffcf8a'],
    hills: '#3d2626',
    layers: [
      { c: '#33232a', base: 900, h: [260, 560], w: [60, 120], win: 0 },
      { c: '#1d171d', base: 900, h: [180, 420], w: [70, 140], win: .22 },
      { c: '#0c0d12', base: 900, h: [70, 210], w: [90, 170], win: .3 }
    ],
    palms: [[120, 380], [250, 300], [1470, 340], [1560, 260]]
  },
  plage: {
    titre: 'Del Perro, côté plage',
    sky: ['#1d1a2b', '#7a3d3a', '#f0a05a'], sun: [800, 560, 120, '#ffd59a'],
    sea: ['#3b2b3a', '#120f16'], horizon: 600,
    layers: [{ c: '#2a1f28', base: 600, h: [30, 140], w: [30, 70], win: .15, from: 0, to: 520 }],
    wheel: [1160, 470, 150], pier: true,
    palms: [[90, 420], [210, 360], [1520, 400]]
  },
  desert: {
    titre: 'Sandy Shores, fin de journée',
    sky: ['#2a1a1a', '#8a4a2e', '#f2b15e'], sun: [420, 520, 90, '#ffe0a3'],
    mountains: ['#5a3328', '#3a2420'], ground: '#1a1210', horizon: 700,
    layers: [{ c: '#0e0b0b', base: 760, h: [40, 90], w: [80, 160], win: .2, from: 980, to: 1500 }],
    poles: true,
    palms: [[1560, 260]]
  },
  nuit: {
    titre: 'Vinewood, de nuit',
    sky: ['#05060a', '#0f1220', '#2a1f30'], moon: [1320, 170, 46], stars: true,
    hills: '#11131c',
    layers: [
      { c: '#151826', base: 900, h: [240, 520], w: [60, 120], win: .2 },
      { c: '#0c0e16', base: 900, h: [160, 400], w: [70, 140], win: .4 },
      { c: '#060709', base: 900, h: [60, 180], w: [90, 170], win: .45 }
    ],
    palms: [[150, 340], [1480, 300]]
  }
};

function drawScene(svg, key, seed) {
  const p = SCENES[key];
  let s = seed || 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const id = 'g' + key + Math.floor(rnd() * 1e6);
  const W = 1600, H = 900;
  let o = `<defs>
    <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset=".55" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/></linearGradient>
    <radialGradient id="${id}g"><stop offset="0" stop-color="#ffd8a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></radialGradient>
    ${p.sea ? `<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sea[0]}"/><stop offset="1" stop-color="${p.sea[1]}"/></linearGradient>` : ''}
  </defs>`;
  o += `<rect width="${W}" height="${H}" fill="url(#${id}s)"/>`;

  // étoiles + lune
  if (p.stars) for (let i = 0; i < 120; i++) o += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * 520).toFixed(0)}" r="${(rnd() * 1.6 + .4).toFixed(1)}" fill="#fff" opacity="${(rnd() * .7 + .2).toFixed(2)}"/>`;
  if (p.moon) { const [x, y, r] = p.moon; o += `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="url(#${id}g)" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f3ead6"/><circle cx="${x + 14}" cy="${y - 8}" r="${r * .9}" fill="${p.sky[0]}" opacity=".25"/>`; }

  // soleil
  if (p.sun) { const [x, y, r, c] = p.sun; o += `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#${id}g)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`; }

  // montagnes (désert)
  if (p.mountains) {
    p.mountains.forEach((c, k) => {
      let d = `M0 ${p.horizon}`, x = 0;
      while (x < W) { x += 120 + rnd() * 180; d += ` L${x.toFixed(0)} ${(p.horizon - 80 - rnd() * (k ? 120 : 220)).toFixed(0)}`; x += 80 + rnd() * 120; d += ` L${x.toFixed(0)} ${(p.horizon - 20 - rnd() * 40).toFixed(0)}`; }
      o += `<path d="${d} L${W} ${p.horizon} Z" fill="${c}"/>`;
    });
    o += `<rect y="${p.horizon}" width="${W}" height="${H - p.horizon}" fill="${p.ground}"/>`;
  }

  // collines (ville)
  if (p.hills) o += `<path d="M0 640 Q240 520 520 590 T1040 560 T1600 520 V900 H0Z" fill="${p.hills}"/>`;

  // mer (plage)
  if (p.sea) {
    o += `<rect y="${p.horizon}" width="${W}" height="${H - p.horizon}" fill="url(#${id}w)"/>`;
    for (let i = 0; i < 26; i++) { const y = p.horizon + 10 + i * 11, w = 260 - i * 7 + rnd() * 60; o += `<rect x="${(p.sun[0] - w / 2 + (rnd() - .5) * 40).toFixed(0)}" y="${y}" width="${w.toFixed(0)}" height="3" fill="#ffd59a" opacity="${(.5 - i * .017).toFixed(2)}"/>`; }
  }

  // immeubles
  (p.layers || []).forEach((L) => {
    let x = (L.from || 0) - 20;
    const end = L.to || W + 20;
    while (x < end) {
      const w = L.w[0] + rnd() * (L.w[1] - L.w[0]);
      const h = L.h[0] + rnd() * (L.h[1] - L.h[0]);
      const y = L.base - h;
      o += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${L.c}"/>`;
      if (rnd() > .7) o += `<rect x="${(x + w / 2 - 2).toFixed(0)}" y="${(y - 30).toFixed(0)}" width="3" height="30" fill="${L.c}"/>`;
      if (L.win) for (let wy = y + 14; wy < L.base - 14; wy += 18) for (let wx = x + 9; wx < x + w - 9; wx += 13) if (rnd() < L.win) o += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="8" fill="${rnd() > .3 ? '#ffc977' : '#20E8B7'}" opacity="${(.45 + rnd() * .55).toFixed(2)}"/>`;
      x += w + rnd() * 8;
    }
  });

  // grande roue + ponton (plage)
  if (p.wheel) {
    const [cx, cy, r] = p.wheel;
    o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1a1218" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${r * .82}" fill="none" stroke="#1a1218" stroke-width="2"/>`;
    for (let a = 0; a < 16; a++) { const t = a * Math.PI / 8, x2 = cx + Math.cos(t) * r, y2 = cy + Math.sin(t) * r; o += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="#1a1218" stroke-width="2"/><rect x="${(x2 - 9).toFixed(0)}" y="${(y2 - 4).toFixed(0)}" width="18" height="14" fill="#1a1218"/><circle cx="${x2.toFixed(0)}" cy="${(y2 - 4).toFixed(0)}" r="2.5" fill="#20E8B7"/>`; }
    o += `<path d="M${cx - 70} ${p.horizon + 20} L${cx} ${cy} L${cx + 70} ${p.horizon + 20}" fill="none" stroke="#1a1218" stroke-width="9"/>`;
  }
  if (p.pier) {
    o += `<rect x="880" y="${p.horizon + 12}" width="720" height="16" fill="#140e12"/>`;
    for (let x = 900; x < W; x += 46) o += `<rect x="${x}" y="${p.horizon + 26}" width="7" height="70" fill="#140e12"/>`;
  }

  // poteaux électriques (désert)
  if (p.poles) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 170, h = 220 - i * 22, y = p.horizon + 60 - i * 8;
      o += `<rect x="${x}" y="${y - h}" width="6" height="${h}" fill="#0e0b0b"/><rect x="${x - 26}" y="${y - h + 10}" width="58" height="5" fill="#0e0b0b"/>`;
      if (i) { const px = 80 + (i - 1) * 170, ph = 220 - (i - 1) * 22, py = p.horizon + 60 - (i - 1) * 8; d += `M${px + 3} ${py - ph + 12} Q${(px + x) / 2 + 3} ${(py - ph + y - h) / 2 + 40} ${x + 3} ${y - h + 12} `; }
    }
    o += `<path d="${d}" fill="none" stroke="#0e0b0b" stroke-width="2"/>`;
    o += `<rect x="1180" y="${p.horizon - 170}" width="90" height="70" rx="35" fill="#0e0b0b"/><path d="M1190 ${p.horizon - 105} L1175 ${p.horizon + 40} M1260 ${p.horizon - 105} L1275 ${p.horizon + 40}" stroke="#0e0b0b" stroke-width="7"/>`;
  }

  // palmiers
  (p.palms || []).forEach(([x, h]) => {
    o += `<g transform="translate(${x} ${H})"><path d="M0 0 Q14 -${h / 2} -8 -${h}" stroke="#07080b" stroke-width="12" fill="none"/>`;
    for (let a = 0; a < 8; a++) { const t = (-170 + a * 45) * Math.PI / 180; o += `<path d="M-8 -${h} q${(Math.cos(t) * 55).toFixed(0)} ${(Math.sin(t) * 40 - 14).toFixed(0)} ${(Math.cos(t) * 110).toFixed(0)} ${(Math.sin(t) * 55 + 30).toFixed(0)}" stroke="#07080b" stroke-width="9" fill="none" stroke-linecap="round"/>`; }
    o += '</g>';
  });

  svg.innerHTML = o;
}


/* =========================================================
   Thème : couleurs + polices
   ========================================================= */
const FONTS = {
  'Barlow Condensed': 'wght@600;700;800;900', 'Bebas Neue': '', 'Anton': '', 'Oswald': 'wght@500;600;700', 'Teko': 'wght@500;600;700',
  'DM Sans': 'wght@400;500;700', 'Rajdhani': 'wght@500;600;700', 'Inter': 'wght@400;500;700', 'Barlow': 'wght@400;500;700', 'Outfit': 'wght@400;500;700'
};
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 0;
  const n = parseInt(m[1], 16), ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2];
}
function applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--gold', t.accent);
  r.setProperty('--bg', t.fond);
  r.setProperty('--on-accent', luminance(t.accent) > .3 ? '#04100D' : '#ffffff');
  r.setProperty('--ft', `'${t.policeTitres}', Impact, sans-serif`);
  r.setProperty('--fb', `'${t.policeTexte}', system-ui, sans-serif`);
  const fam = [t.policeTitres, t.policeTexte].filter((f, i, a) => FONTS[f] !== undefined && a.indexOf(f) === i)
    .map((f) => 'family=' + f.replace(/ /g, '+') + (FONTS[f] ? ':' + FONTS[f] : '')).join('&');
  const href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
  if ($('#fonts').href !== href) $('#fonts').href = href;
  document.querySelector('meta[name=theme-color]').content = t.fond;
}

/* =========================================================
   Icônes des cartes « Univers »
   ========================================================= */
const ICONS = {
  maison: '<path d="M8 40V20l16-12 16 12v20H30V28H18v12z"/>',
  balance: '<path d="M24 6v36M10 42h28M8 14h32M14 14l-6 14h12zM34 14l-6 14h12z"/>',
  flamme: '<path d="M24 6c8 10 16 14 16 22a8 8 0 0 1-14 5l2 9h-8l2-9a8 8 0 0 1-14-5c0-8 8-12 16-22z"/>',
  voiture: '<path d="M6 30l5-12h26l5 12v8H6z M6 30h36"/><circle cx="14" cy="38" r="3"/><circle cx="34" cy="38" r="3"/>',
  bouclier: '<path d="M24 6l16 6v11c0 10-7 17-16 20C15 40 8 33 8 23V12z"/>',
  micro: '<rect x="18" y="6" width="12" height="22" rx="6"/><path d="M11 23c0 8 6 12 13 12s13-4 13-12M24 35v7"/>',
  etoile: '<path d="M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"/>',
  cle: '<circle cx="16" cy="24" r="8"/><path d="M24 24h18M36 24v6M41 24v5"/>',
  argent: '<rect x="6" y="14" width="36" height="20"/><circle cx="24" cy="24" r="5"/><path d="M11 19v10M37 19v10"/>'
};

/* =========================================================
   Affichage de chaque section
   ========================================================= */
function head(n, s) {
  return `<div class="section-head"><div><div class="kicker">${pad(n)} — ${esc(s.kicker)}</div><h2>${fmt(s.titre)}</h2></div><p>${fmt(s.intro)}</p></div>`;
}

const RENDER = {
  univers(s, n) {
    return `<section class="section universe" id="univers">${head(n, s)}
      <div class="feature-grid n${s.cartes.length}">${s.cartes.map((c, i) => `
        <article class="feature${i === 0 ? ' big' : ''}">
          <svg class="feature-icon" viewBox="0 0 48 48" aria-hidden="true">${ICONS[c.icone] || ICONS.etoile}</svg>
          <div><small>${pad(i + 1)} / ${esc(c.etiquette)}</small><h3>${fmt(c.titre)}</h3><p>${fmt(c.texte)}</p>
          ${(c.points || []).length ? `<ul>${c.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>
        </article>`).join('')}</div></section>`;
  },
  reglement(s, n) {
    return `<section class="section rules" id="reglement">${head(n, s)}
      <div class="rule-grid">${s.regles.map((r, i) => `
        <button class="rule" data-rule="${i}" aria-haspopup="dialog"><div class="rule-top"><span aria-hidden="true">${esc(r.icone)}</span><small>${pad(i + 1)} ↗</small></div><div><h3>${esc(r.titre)}</h3><p>${esc(r.resume)}</p></div></button>`).join('')}</div></section>`;
  },
  astuces(s, n) {
    const g = s.generateur;
    return `<section class="section tips" id="astuces">${head(n, s)}
      <div class="tip-layout">${s.cartes.map((c, i) => `<div class="tip-card"><span class="num">${pad(i + 1)}</span><h3>${fmt(c.titre)}</h3><p>${fmt(c.texte)}</p></div>`).join('')}</div>
      ${g.visible ? `<div class="generator">
        <div><div class="kicker">OUTIL CRÉATIF</div><h3>${esc(g.titre)}</h3><p>${fmt(g.texte)}</p></div>
        <form class="generator-form" id="genForm">
          <label for="character">Nom du personnage</label>
          <input id="character" maxlength="40" placeholder="Ex. : Alex Morgan" autocomplete="off">
          <label for="archetype">Profil</label>
          <select id="archetype">${g.profils.map((p, i) => `<option value="${i}">${esc(p.nom)}</option>`).join('')}</select>
          <button class="btn primary" type="submit">GÉNÉRER UNE HISTOIRE <span aria-hidden="true">↗</span></button>
        </form>
        <div class="generated" id="generated" aria-live="polite" hidden>
          <div id="genText"></div>
          <div class="gen-actions"><button class="btn ghost small" id="genCopy" type="button">COPIER LA FICHE</button><button class="btn ghost small" id="genAgain" type="button">UNE AUTRE IDÉE ↻</button></div>
        </div></div>` : ''}</section>`;
  },
  galerie(s, n) {
    return `<section class="section gallery" id="galerie">${head(n, s)}
      <div class="gallery-stage" id="galleryStage" tabindex="0" aria-roledescription="carrousel" aria-label="Galerie">
        <div class="gallery-photo" id="galleryPhoto"></div>
        <div class="gallery-caption"><span id="galleryTitle"></span>
          <span class="gallery-nav"><button id="galPrev" aria-label="Image précédente">←</button><span id="galleryCount"></span><button id="galNext" aria-label="Image suivante">→</button></span></div>
      </div></section>`;
  },
  reseaux(s, n) {
    return `<section class="section socials" id="reseaux">${head(n, s)}
      <a class="discord-card" href="${esc(safeUrl(C.liens.discord))}" target="_blank" rel="noopener noreferrer">
        <svg class="discord-symbol" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 12c4-2 7-2 10-2s6 0 10 2c4 6 6 12 6 20-3 3-7 5-10 5l-2-4c2-1 3-1 4-2-4 2-7 2-8 2s-4 0-8-2c1 1 2 1 4 2l-2 4c-3 0-7-2-10-5 0-8 2-14 6-20z"/><circle cx="18.5" cy="25" r="3"/><circle cx="29.5" cy="25" r="3"/></svg>
        <div><small>${esc(s.carteEtiquette)}</small><h3>${esc(s.carteTitre)}</h3><p>${fmt(s.carteTexte)}</p></div>
        <span class="discord-arrow" aria-hidden="true">↗</span></a>
      ${s.faq.length ? `<div class="faq"><h3>${esc(s.faqTitre)}</h3>${s.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${fmt(f.r)}</p></details>`).join('')}</div>` : ''}
    </section>`;
  },
  rejoindre(s, n) {
    const fivem = (C.liens.fivem || '').replace(/^https?:\/\//, '').trim();
    return `<section class="join" id="rejoindre">
      <div class="kicker">${pad(n)} — ${esc(s.kicker)}</div>
      <h2>${fmt(s.titre)}</h2><p>${fmt(s.texte)}</p>
      <ol class="steps">${s.etapes.map((e, i) => `<li><span>${pad(i + 1)}</span><b>${esc(e.titre)}</b><small>${fmt(e.texte)}</small></li>`).join('')}</ol>
      ${fivem ? `<p class="connect">Commande FiveM : <code>connect ${esc(fivem)}</code></p>` : ''}
      <div class="countdown" id="countdown" hidden></div>
      <div class="join-actions">
        <a class="btn primary" href="${esc(safeUrl(C.liens.discord))}" target="_blank" rel="noopener noreferrer">${esc(s.bouton)} <span aria-hidden="true">↗</span></a>
        ${fivem ? `<a class="btn ghost" href="fivem://connect/${esc(fivem)}">SE CONNECTER À FIVEM</a><button class="btn ghost" type="button" data-copy="connect ${esc(fivem)}">COPIER L'ADRESSE</button>` : ''}
      </div>
      <p class="launch-note" id="launchNote">${esc(fivem ? s.noteOuvert : s.noteDev)}</p>
    </section>`;
  }
};

function renderHero(h, firstId) {
  const live = !!(C.liens.fivem || '').trim();
  return `<section class="hero" id="accueil">
    ${h.image ? `<img class="city" src="${src(h.image)}" alt="">` : '<svg class="city" id="heroScene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true"></svg>'}
    <div class="noise" aria-hidden="true"></div>
    <div class="hero-content">
      <div class="eyebrow"><span class="dot"></span> ${esc(h.bandeau)}</div>
      <div class="stars" aria-hidden="true">★★★★★</div>
      <h1>${fmt(h.titre)}</h1>
      <p>${fmt(h.texte)}</p>
      <div class="actions">
        <a class="btn primary" href="#rejoindre">${esc(h.bouton1)} <span aria-hidden="true">↗</span></a>
        ${firstId ? `<a class="btn ghost" href="#${firstId}">${esc(h.bouton2)} <span aria-hidden="true">↓</span></a>` : ''}
      </div>
      <div class="hero-foot"><span class="status${live ? ' live' : ''}"><span class="pulse"></span> ${esc(live ? h.statutOuvert : h.statutDev)}</span><span>${esc(h.lieu)}</span></div>
    </div>
    <div class="hero-number" id="secNum" aria-hidden="true"></div>
  </section>`;
}

/* =========================================================
   Affichage complet
   ========================================================= */
function render(content) {
  C = content;
  applyTheme(C.theme);
  document.title = C.meta.titre;
  document.querySelector('meta[name=description]').content = C.meta.description;

  // en-tête
  // logo + étoile d'accès au panel admin
  const logoImg = C.marque.image ? `<img src="${src(C.marque.image)}" alt="RAW RP">` : '';
  const starA = C.footer.boutonAdmin ? '<a class="admin-star" href="admin.html" title="Panel admin" aria-label="Panel admin">★</a>' : '';
  const parts = String(C.marque.logo).split('★');
  let brand;
  if (logoImg) brand = `<a class="brand-mark has-img" href="#accueil" aria-label="Retour à l'accueil">${logoImg}</a>${starA}`;
  else if (parts.length > 1) brand = `<span class="brand-mark"><a href="#accueil">${esc(parts[0])}</a>${starA || '<span>★</span>'}<a href="#accueil">${esc(parts.slice(1).join('★'))}</a></span>`;
  else brand = `<a class="brand-mark" href="#accueil">${esc(C.marque.logo)}</a>${starA}`;
  $('#brand').innerHTML = brand + `<small>${esc(C.marque.sousTitre)}</small>`;
  const vis = C.sections.filter((s) => s.visible);
  $('#nav').innerHTML = [`<a href="#accueil">${esc(C.nav.accueil)}</a>`, ...vis.map((s) => `<a href="#${s.id}">${esc(s.nav)}</a>`)].join('');
  const joinVisible = vis.some((s) => s.id === 'rejoindre');
  $('#navCta').hidden = !joinVisible;
  $('#navCta').innerHTML = `${esc(C.nav.cta)} <span aria-hidden="true">↗</span>`;

  // contenu
  $('#app').innerHTML = renderHero(C.hero, vis[0] && vis[0].id) + vis.map((s, i) => RENDER[s.id](C[s.id], i + 1)).join('');
  $('#footer').innerHTML = `<div class="footer-logo">${logoImg || esc(C.marque.footer).replace(/★/g, '<span>★</span>')}</div><span>© ${new Date().getFullYear()} ${fmt(C.footer.texte)}</span><a href="#accueil">${esc(C.footer.retour)} ↑</a>`;

  if (!C.hero.image) drawScene($('#heroScene'), SCENES[C.hero.scene] ? C.hero.scene : 'centre', 11);
  bind(vis);
}

/* =========================================================
   Interactions (rebranchées à chaque affichage)
   ========================================================= */
function bind(vis) {
  // liens à copier
  $$('[data-copy]').forEach((b) => (b.onclick = () => copy(b.dataset.copy, 'Commande copiée : colle-la dans FiveM (touche F8)')));

  // compte à rebours
  timers.forEach(clearInterval); timers = [];
  const box = $('#countdown');
  if (box && C.liens.ouverture) {
    const cible = new Date(C.liens.ouverture).getTime();
    const tick = () => {
      const ms = cible - Date.now();
      if (isNaN(cible) || ms <= 0) { box.hidden = true; return; }
      const j = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      box.hidden = false;
      box.innerHTML = [[j, 'JOURS'], [h, 'HEURES'], [m, 'MIN'], [s, 'SEC']].map(([v, l]) => `<div><b>${pad(v)}</b><small>${l}</small></div>`).join('');
    };
    tick(); timers.push(setInterval(tick, 1000));
    if (!C.liens.fivem && !isNaN(cible) && cible > Date.now()) $('#launchNote').textContent = 'Ouverture le ' + new Date(cible).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }) + '.';
  }

  // règlement
  $$('[data-rule]').forEach((b) => (b.onclick = () => openRule(+b.dataset.rule)));

  // générateur
  const form = $('#genForm');
  if (form) {
    form.onsubmit = (e) => { e.preventDefault(); generate(); };
    $('#genAgain').onclick = generate;
    $('#genCopy').onclick = () => copy(lastFiche, 'Fiche copiée');
  }

  // galerie
  if ($('#galleryStage')) setupGallery();

  // section active + numéro
  if (spy) spy.disconnect();
  const ids = ['accueil', ...vis.map((s) => s.id)];
  const total = vis.length;
  const links = [...$$('#nav a')];
  $('#secNum').textContent = `00 / ${pad(total)}`;
  spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    $('#secNum').textContent = `${pad(Math.max(ids.indexOf(en.target.id), 0))} / ${pad(total)}`;
  }), { rootMargin: '-45% 0px -50% 0px' });
  ids.forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  $$('#nav a').forEach((a) => (a.onclick = () => setMenu(false)));
}

/* ---------- Règlement ---------- */
const dialog = $('#ruleDialog');
let ruleIdx = 0;
function openRule(i) {
  const R = C.reglement.regles;
  ruleIdx = (i + R.length) % R.length;
  $('#dialogNum').textContent = `RÈGLEMENT · ${pad(ruleIdx + 1)} / ${pad(R.length)}`;
  $('#dialogTitle').textContent = R[ruleIdx].titre;
  $('#dialogText').textContent = R[ruleIdx].detail;
  if (!dialog.open) dialog.showModal();
}
$('#closeDialog').onclick = () => dialog.close();
$('#understood').onclick = () => dialog.close();
$('#dialogPrev').onclick = () => openRule(ruleIdx - 1);
$('#dialogNext').onclick = () => openRule(ruleIdx + 1);
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') openRule(ruleIdx + 1); if (e.key === 'ArrowLeft') openRule(ruleIdx - 1); });

/* ---------- Générateur ---------- */
const pick = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : '');
let lastFiche = '';
function generate() {
  const g = C.astuces.generateur;
  const nom = ($('#character').value.trim() || 'Alex Morgan').slice(0, 40);
  const prof = g.profils[+$('#archetype').value] || g.profils[0] || { nom: '', ambitions: [] };
  const origine = pick(g.origines);
  const histoire = pick(g.accroches).replace(/\{nom\}/g, nom).replace(/\{origine\}/g, origine);
  const lignes = [['Profil', prof.nom], ['Origine', origine.charAt(0).toUpperCase() + origine.slice(1)], ['Ambition', pick(prof.ambitions)], ['Faiblesse', pick(g.faiblesses)], ['Secret', pick(g.secrets)]].filter((l) => l[1]);
  const box = $('#genText');
  box.innerHTML = `<h4>${esc(nom)}</h4><p class="story">${esc(histoire)}</p><dl>${lignes.map(([k, v]) => `<dt>${k.toUpperCase()}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  $('#generated').hidden = false;
  lastFiche = `${nom}\n\n${histoire}\n\n` + lignes.map(([k, v]) => `${k} : ${v}`).join('\n');
}

/* ---------- Galerie ---------- */
let gi = 0, slides = [];
function setupGallery() {
  const imgs = C.galerie.images.filter((g) => g.src);
  slides = imgs.length ? imgs.map((g) => ({ type: 'img', ...g })) : Object.keys(SCENES).map((k) => ({ type: 'scene', key: k, titre: SCENES[k].titre }));
  gi = Math.min(gi, slides.length - 1);
  $('#galPrev').onclick = () => showSlide(gi - 1);
  $('#galNext').onclick = () => showSlide(gi + 1);
  const st = $('#galleryStage');
  st.onkeydown = (e) => { if (e.key === 'ArrowRight') showSlide(gi + 1); if (e.key === 'ArrowLeft') showSlide(gi - 1); };
  let tx = null;
  st.ontouchstart = (e) => (tx = e.touches[0].clientX);
  st.ontouchend = (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) showSlide(gi + (dx < 0 ? 1 : -1)); tx = null; };
  showSlide(gi);
}
function showSlide(i) {
  gi = (i + slides.length) % slides.length;
  const sl = slides[gi], box = $('#galleryPhoto');
  if (sl.type === 'img') {
    box.innerHTML = `<img src="${src(sl.src)}" alt="${esc(sl.titre)}" loading="lazy">`;
  } else {
    box.innerHTML = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img"></svg>';
    box.firstChild.setAttribute('aria-label', sl.titre);
    drawScene(box.firstChild, sl.key, 31 + gi * 17);
  }
  $('#galleryTitle').textContent = (sl.titre || 'Los Santos').toUpperCase();
  $('#galleryCount').textContent = `${pad(gi + 1)} / ${pad(slides.length)}`;
}

/* ---------- Menu mobile ---------- */
const nav = $('#nav'), menu = $('#menu');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
}
menu.onclick = () => setMenu(!nav.classList.contains('open'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Étoiles « avis de recherche » ---------- */
const stars = [...$$('#wanted i')];
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const lit = Math.round((max > 0 ? scrollY / max : 0) * stars.length);
  stars.forEach((s, i) => s.classList.toggle('on', i < lit));
}
addEventListener('scroll', onScroll, { passive: true });

/* =========================================================
   Démarrage
   ========================================================= */
if (PREVIEW) {
  // Mode aperçu : la page admin envoie le brouillon en direct
  addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const d = e.data || {};
    if (d.type === 'rawrp:content') {
      PREV = d.previews || {};
      const y = scrollY;
      render(normalize(d.content));
      scrollTo(0, y);
    }
    if (d.type === 'rawrp:goto') {
      const el = document.getElementById(d.id);
      if (el) el.scrollIntoView();
    }
  });
  render(normalize(null));
  window.parent.postMessage({ type: 'rawrp:ready' }, '*');
} else {
  let data = window.RAWRP_CONTENT || null;
  try {
    const local = JSON.parse(localStorage.getItem('rawrp-contenu') || 'null');
    if (local && (local._maj || 0) > ((data && data._maj) || 0)) data = local;
  } catch (e) {}
  render(normalize(data));
  onScroll();
  if (location.hash) { const el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
}
})();
