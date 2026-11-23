/* =========================================================
   RAW RP — panel admin connecté à GitHub
   ---------------------------------------------------------
   - « Publier » écrit content.js (et les images) dans le dépôt
     GitHub : le site est mis à jour pour tout le monde.
   - Le mot de passe est le même partout : il déverrouille le
     jeton GitHub, stocké CHIFFRÉ dans admin.json (AES-GCM,
     clé dérivée du mot de passe par PBKDF2, 600 000 tours).
   - La phrase secrète déverrouille une 2e copie chiffrée du
     jeton : elle sert pour « Mot de passe oublié ».
   - Sans le mot de passe ou la phrase, admin.json est inutilisable.
   ========================================================= */

(() => {
const D = window.RAWRP_DEFAULT;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const pad = (n) => String(n).padStart(2, '0');

/* ---------- Fusion avec les valeurs par défaut (comme sur le site) ---------- */
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
  const c = merge(clone(D), raw || {});
  D.sections.forEach((s) => { if (!c.sections.some((x) => x.id === s.id)) c.sections.push({ ...s }); });
  c.sections = c.sections.filter((s) => D.sections.some((d) => d.id === s.id));
  return c;
}
const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };

/* =========================================================
   Ce qu'on peut modifier, onglet par onglet
   ========================================================= */
const FONTS_T = ['Barlow Condensed', 'Bebas Neue', 'Anton', 'Oswald', 'Teko'];
const FONTS_B = ['DM Sans', 'Rajdhani', 'Inter', 'Barlow', 'Outfit'];
const ICON_OPTS = [['maison', 'Maison'], ['balance', 'Balance'], ['flamme', 'Flamme'], ['voiture', 'Voiture'], ['bouclier', 'Bouclier'], ['micro', 'Micro'], ['etoile', 'Étoile'], ['cle', 'Clé'], ['argent', 'Argent']];
const SCENE_OPTS = [['centre', 'Centre-ville au crépuscule'], ['plage', 'Plage de Del Perro'], ['desert', 'Sandy Shores'], ['nuit', 'Vinewood de nuit']];
const SECTION_NAMES = { univers: 'Univers', reglement: 'Règlement', astuces: 'Astuces', galerie: 'Galerie', reseaux: 'Réseaux', rejoindre: 'Rejoindre' };
const TITRE_HINT = 'Une ligne ici = une ligne du titre. Mets *entre étoiles* le texte à afficher en couleur.';
const TEXT_HINT = '**entre doubles étoiles** = gras, *entre étoiles* = en couleur.';
const headFields = (p) => [
  { k: p + '.kicker', l: 'Petit titre au-dessus', t: 'text', h: 'Le numéro (01, 02…) est ajouté automatiquement selon l\'ordre des sections.' },
  { k: p + '.titre', l: 'Grand titre', t: 'textarea', rows: 2, h: TITRE_HINT },
  { k: p + '.intro', l: 'Texte d\'introduction', t: 'textarea', h: TEXT_HINT }
];

const TABS = [
  { id: 'general', label: 'Général', goto: 'accueil', lead: 'Nom, couleurs, polices et liens utilisés partout sur le site.', fields: [
    { g: 'Identité' },
    { k: 'marque.image', l: 'Logo (image)', t: 'image', h: 'PNG sans fond conseillé. Retire l\'image pour utiliser le logo en texte ci-dessous.' },
    { k: 'marque.logo', l: 'Logo en texte (si pas d\'image)', t: 'text', h: 'Le symbole ★ s\'affiche dans la couleur principale.' },
    { k: 'marque.sousTitre', l: 'Mot à côté du logo', t: 'text' },
    { k: 'marque.footer', l: 'Logo du pied de page en texte (si pas d\'image)', t: 'text' },
    { k: 'meta.titre', l: 'Titre de l\'onglet du navigateur', t: 'text' },
    { k: 'meta.description', l: 'Description pour Google et les partages', t: 'textarea' },
    { g: 'Couleurs et polices' },
    { k: 'theme.accent', l: 'Couleur principale', t: 'color' },
    { k: 'theme.fond', l: 'Couleur de fond', t: 'color', h: 'Garde une couleur très sombre pour que le texte reste lisible.' },
    { k: 'theme.policeTitres', l: 'Police des titres', t: 'select', o: FONTS_T.map((f) => [f, f]) },
    { k: 'theme.policeTexte', l: 'Police du texte', t: 'select', o: FONTS_B.map((f) => [f, f]) },
    { g: 'Liens et serveur' },
    { k: 'liens.discord', l: 'Lien d\'invitation Discord', t: 'url', h: 'Utilise une invitation qui n\'expire jamais.' },
    { k: 'liens.fivem', l: 'Adresse FiveM', t: 'text', h: 'Ex. cfx.re/join/abc123. Laisse vide tant que le serveur n\'est pas ouvert : le site affichera « en développement ».' },
    { k: 'liens.ouverture', l: 'Date d\'ouverture (compte à rebours)', t: 'datetime', h: 'Laisse vide pour ne pas afficher de compte à rebours.' },
    { g: 'Menu et pied de page' },
    { k: 'nav.accueil', l: 'Lien « Accueil » du menu', t: 'text' },
    { k: 'nav.cta', l: 'Bouton en haut à droite', t: 'text' },
    { k: 'footer.texte', l: 'Texte du pied de page', t: 'textarea', h: '« © » et l\'année sont ajoutés automatiquement devant.' },
    { k: 'footer.retour', l: 'Lien « Retour en haut »', t: 'text' },
    { k: 'footer.boutonAdmin', l: 'Étoile d\'accès au panel admin dans le logo (en haut du site)', t: 'toggle', h: 'Si tu la désactives, le panel reste accessible en ouvrant admin.html.' }
  ] },
  { id: 'sections', label: 'Sections', lead: 'Choisis les sections affichées, leur ordre (flèches) et leur nom dans le menu. L\'accueil reste toujours en premier.', fields: [
    { k: 'sections', t: 'list', fixed: true, title: (it) => SECTION_NAMES[it.id] + (it.visible ? '' : ' · masquée'), item: [
      { k: 'visible', l: 'Afficher cette section', t: 'toggle' },
      { k: 'nav', l: 'Nom dans le menu', t: 'text' }
    ] }
  ] },
  { id: 'accueil', label: 'Accueil', goto: 'accueil', lead: 'Le grand écran d\'ouverture du site.', fields: [
    { k: 'hero.bandeau', l: 'Petit texte au-dessus du titre', t: 'text' },
    { k: 'hero.titre', l: 'Grand titre', t: 'textarea', rows: 3, h: TITRE_HINT },
    { k: 'hero.texte', l: 'Texte', t: 'textarea', rows: 4, h: TEXT_HINT },
    { k: 'hero.bouton1', l: 'Bouton principal (mène à « Rejoindre »)', t: 'text' },
    { k: 'hero.bouton2', l: 'Bouton secondaire (mène à la 1re section)', t: 'text' },
    { k: 'hero.statutDev', l: 'Statut avant l\'ouverture', t: 'text' },
    { k: 'hero.statutOuvert', l: 'Statut quand l\'adresse FiveM est remplie', t: 'text' },
    { k: 'hero.lieu', l: 'Lieu', t: 'text' },
    { g: 'Fond' },
    { k: 'hero.scene', l: 'Illustration dessinée', t: 'select', o: SCENE_OPTS },
    { k: 'hero.image', l: 'Ou ta propre image', t: 'image', h: 'Si tu mets une image, elle remplace l\'illustration. Format paysage conseillé.' }
  ] },
  { id: 'univers', label: 'Univers', goto: 'univers', fields: [...headFields('univers'),
    { g: 'Cartes' },
    { k: 'univers.cartes', t: 'list', title: 'titre', add: 'Ajouter une carte', neu: { icone: 'etoile', etiquette: 'NOUVEAU', titre: 'NOUVELLE CARTE', texte: '', points: [] }, item: [
      { k: 'icone', l: 'Icône', t: 'select', o: ICON_OPTS },
      { k: 'etiquette', l: 'Étiquette', t: 'text' },
      { k: 'titre', l: 'Titre', t: 'text' },
      { k: 'texte', l: 'Texte', t: 'textarea' },
      { k: 'points', l: 'Liste à puces (une ligne = un point)', t: 'lines' }
    ] }
  ] },
  { id: 'reglement', label: 'Règlement', goto: 'reglement', fields: [...headFields('reglement'),
    { g: 'Règles' },
    { k: 'reglement.regles', t: 'list', title: 'titre', add: 'Ajouter une règle', neu: { icone: '✦', titre: 'NOUVELLE RÈGLE', resume: '', detail: '' }, item: [
      { k: 'icone', l: 'Symbole', t: 'text', h: 'Un seul caractère, par exemple ✦ ◈ ⚡ ◎ ♜ ♡ ★ ⚠ ✖' },
      { k: 'titre', l: 'Titre', t: 'text' },
      { k: 'resume', l: 'Résumé (sur la carte)', t: 'textarea' },
      { k: 'detail', l: 'Texte complet (dans la fenêtre)', t: 'textarea', rows: 5 }
    ] }
  ] },
  { id: 'astuces', label: 'Astuces', goto: 'astuces', fields: [...headFields('astuces'),
    { g: 'Conseils' },
    { k: 'astuces.cartes', t: 'list', title: 'titre', add: 'Ajouter un conseil', neu: { titre: 'NOUVEAU CONSEIL', texte: '' }, item: [
      { k: 'titre', l: 'Titre', t: 'text' }, { k: 'texte', l: 'Texte', t: 'textarea' }
    ] },
    { g: 'Générateur de background' },
    { k: 'astuces.generateur.visible', l: 'Afficher le générateur', t: 'toggle' },
    { k: 'astuces.generateur.titre', l: 'Titre', t: 'text' },
    { k: 'astuces.generateur.texte', l: 'Texte', t: 'textarea' },
    { k: 'astuces.generateur.profils', t: 'list', title: 'nom', add: 'Ajouter un profil', neu: { nom: 'Nouveau profil', ambitions: [] }, item: [
      { k: 'nom', l: 'Nom du profil (menu déroulant)', t: 'text' },
      { k: 'ambitions', l: 'Ambitions possibles (une par ligne)', t: 'lines' }
    ] },
    { k: 'astuces.generateur.accroches', l: 'Débuts d\'histoire (un par ligne)', t: 'lines', rows: 5, h: '{nom} et {origine} sont remplacés automatiquement.' },
    { k: 'astuces.generateur.origines', l: 'Origines (une par ligne)', t: 'lines', rows: 5 },
    { k: 'astuces.generateur.faiblesses', l: 'Faiblesses (une par ligne)', t: 'lines', rows: 5 },
    { k: 'astuces.generateur.secrets', l: 'Secrets (un par ligne)', t: 'lines', rows: 5 }
  ] },
  { id: 'galerie', label: 'Galerie', goto: 'galerie', fields: [...headFields('galerie'),
    { g: 'Images' },
    { tip: 'Tant que la liste est vide, la galerie montre les 4 illustrations dessinées. Dès que tu ajoutes une image, seules tes images s\'affichent. Les images sont réduites automatiquement avant l\'envoi.' },
    { k: 'galerie.images', t: 'list', title: 'titre', add: 'Ajouter une image', neu: { src: '', titre: 'LOS SANTOS' }, item: [
      { k: 'src', l: 'Image', t: 'image' }, { k: 'titre', l: 'Légende', t: 'text' }
    ] }
  ] },
  { id: 'reseaux', label: 'Réseaux', goto: 'reseaux', fields: [...headFields('reseaux'),
    { g: 'Carte Discord' },
    { tip: 'Le lien Discord se change dans l\'onglet Général.' },
    { k: 'reseaux.carteEtiquette', l: 'Petit texte', t: 'text' },
    { k: 'reseaux.carteTitre', l: 'Titre', t: 'text' },
    { k: 'reseaux.carteTexte', l: 'Texte', t: 'textarea' },
    { g: 'Questions fréquentes' },
    { k: 'reseaux.faqTitre', l: 'Titre de la FAQ', t: 'text' },
    { k: 'reseaux.faq', t: 'list', title: 'q', add: 'Ajouter une question', neu: { q: 'Nouvelle question ?', r: '' }, item: [
      { k: 'q', l: 'Question', t: 'text' }, { k: 'r', l: 'Réponse', t: 'textarea' }
    ] }
  ] },
  { id: 'rejoindre', label: 'Rejoindre', goto: 'rejoindre', fields: [
    { k: 'rejoindre.kicker', l: 'Petit titre au-dessus', t: 'text' },
    { k: 'rejoindre.titre', l: 'Grand titre', t: 'textarea', rows: 2, h: TITRE_HINT },
    { k: 'rejoindre.texte', l: 'Texte', t: 'textarea' },
    { g: 'Étapes' },
    { k: 'rejoindre.etapes', t: 'list', title: 'titre', add: 'Ajouter une étape', neu: { titre: 'NOUVELLE ÉTAPE', texte: '' }, item: [
      { k: 'titre', l: 'Titre', t: 'text' }, { k: 'texte', l: 'Texte', t: 'textarea' }
    ] },
    { g: 'Bas de section' },
    { k: 'rejoindre.bouton', l: 'Bouton Discord', t: 'text' },
    { k: 'rejoindre.noteDev', l: 'Note avant l\'ouverture', t: 'text' },
    { k: 'rejoindre.noteOuvert', l: 'Note une fois l\'adresse FiveM remplie', t: 'textarea' }
  ] }
];

/* =========================================================
   État
   ========================================================= */
const API = 'https://api.github.com';
const REPO = (() => {
  const d = window.RAWRP_DEPOT || {};
  const h = location.hostname;
  if (h.endsWith('.github.io')) {
    const seg = location.pathname.split('/').filter(Boolean)[0];
    return { owner: h.split('.')[0], repo: seg && !seg.endsWith('.html') ? seg : h, branch: d.branch || 'main' };
  }
  return { owner: d.owner || '', repo: d.repo || '', branch: d.branch || 'main' };
})();
const K_CONTENT = 'rawrp-contenu', K_DRAFT = `rawrp-brouillon:${REPO.owner}/${REPO.repo}`, K_TOKEN = 'rawrp-gh-session';
const MIN_PW = 12, MIN_PHRASE = 20, ITER = 600000;
let token = '';          // jeton GitHub déchiffré (uniquement en mémoire / onglet)
let cfg = null, cfgSha = null;   // admin.json
let sha = null;          // version de content.js sur GitHub
let saved = '';          // dernier contenu publié (JSON)
let draft = null;        // contenu en cours de modification
let previews = {};       // images envoyées, pas encore en ligne
let tab = 'general';
let listDefs = {};
const openItems = new Set();
let hist = [], hpos = -1, histTimer = null;

/* ---------- Notifications ---------- */
function toast(msg, err) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('err', !!err);
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), err ? 6500 : 3500);
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const sess = {
  get() { try { return sessionStorage.getItem(K_TOKEN) || ''; } catch (e) { return ''; } },
  set(v) { try { sessionStorage.setItem(K_TOKEN, v); } catch (e) {} },
  del() { try { sessionStorage.removeItem(K_TOKEN); } catch (e) {} }
};
const strip = (c) => { const o = clone(c); delete o._maj; return o; };

/* =========================================================
   API GitHub
   ========================================================= */
function ghError(status, data) {
  if (status === 401) return 'Le jeton GitHub est refusé : il est invalide ou a expiré.';
  if (status === 403) return data && /rate limit/i.test(data.message || '') ? 'GitHub limite les requêtes pour le moment. Réessaie dans quelques minutes.' : 'Accès refusé : le jeton doit avoir « Contents : Read and write » sur ce dépôt.';
  if (status === 404) return 'Dépôt introuvable, ou le jeton n\'a pas accès à ce dépôt.';
  if (status === 409) return 'Conflit : le fichier a changé entre-temps. Réessaie.';
  return `Erreur GitHub ${status}${data && data.message ? ' : ' + data.message : ''}`;
}
async function gh(path, opt = {}) {
  const tk = opt.token !== undefined ? opt.token : token;
  let r;
  try {
    r = await fetch(`${API}/repos/${encodeURIComponent(REPO.owner)}/${encodeURIComponent(REPO.repo)}${path}`, {
      method: opt.method || 'GET',
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(tk ? { Authorization: `Bearer ${tk}` } : {}), ...(opt.body ? { 'Content-Type': 'application/json' } : {}) },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      cache: 'no-store'
    });
  } catch (e) {
    const x = new Error('Impossible de joindre GitHub. Vérifie ta connexion Internet.'); x.net = true; throw x;
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(ghError(r.status, data)); e.status = r.status; throw e; }
  return data;
}
const fromB64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
function toB64(str) {
  const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : str;
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const ref = () => `?ref=${encodeURIComponent(REPO.branch)}`;
async function putFile(path, contentB64, message, fileSha) {
  const body = (s) => ({ message, content: contentB64, branch: REPO.branch, ...(s ? { sha: s } : {}) });
  try {
    return await gh(`/contents/${path}`, { method: 'PUT', body: body(fileSha) });
  } catch (e) {
    if (e.status !== 409 && e.status !== 422) throw e;
    const f = await gh(`/contents/${path}${ref()}`).catch(() => null);   // version à jour, puis on réessaie
    return gh(`/contents/${path}`, { method: 'PUT', body: body(f ? f.sha : null) });
  }
}

/* =========================================================
   Chiffrement du jeton (mot de passe / phrase secrète)
   ========================================================= */
const te = new TextEncoder(), td = new TextDecoder();
const b64 = (buf) => toB64(new Uint8Array(buf));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const normPhrase = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function keyFrom(secret, salt, iter) {
  const base = await crypto.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function seal(secret, text) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await keyFrom(secret, salt, ITER);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, te.encode(text));
  return { iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function unseal(secret, box) {
  try {
    const k = await keyFrom(secret, unb64(box.salt), box.iter || ITER);
    return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, k, unb64(box.ct)));
  } catch (e) { return null; }
}
async function saveCfg(next) {
  const r = await putFile('admin.json', toB64(JSON.stringify(next, null, 2) + '\n'), 'Mise à jour de l\'accès admin', cfgSha);
  cfg = next; cfgSha = r.content.sha;
}

/* =========================================================
   Écrans de connexion
   ========================================================= */
const card = () => $('#loginCard');
const LOGO = '<div class="logo"><img src="images/logo.png" alt="RAW RP"> <small>ADMIN</small></div>';
const FOOT = '<div class="login-foot"><a href="index.html">← Retour au site</a><span class="repo">${repo}</span></div>';
const pwField = (id, label, auto) => `<label>${label}<span class="pw"><input id="${id}" type="password" autocomplete="${auto}" required><button type="button" class="eye" data-eye="${id}" aria-label="Afficher ou masquer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label>`;
function screen(html, onSubmit) {
  card().innerHTML = LOGO + html + `<p class="error" id="lgError" role="alert" hidden></p>` + FOOT.replace('${repo}', esc(`${REPO.owner}/${REPO.repo}`));
  $('#login').hidden = false;
  $('#app').hidden = true;
  card().onsubmit = async (e) => {
    e.preventDefault();
    const btn = card().querySelector('button[type=submit]');
    const label = btn ? btn.textContent : '';
    $('#lgError').hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Vérification…'; }
    try { await onSubmit(); } catch (x) { fail(x.message || 'Erreur inattendue.'); }
    finally { if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = label; } }
  };
  const first = card().querySelector('input');
  if (first) setTimeout(() => first.focus(), 50);
}
function fail(m) { const e = $('#lgError'); if (e) { e.textContent = m; e.hidden = false; } }
const val = (id) => ($('#' + id) ? $('#' + id).value : '');

async function boot() {
  if (!window.crypto || !crypto.subtle) {
    screen('<h1>Navigateur non compatible</h1><p class="sub">Ouvre le panel depuis l\'adresse en https du site, dans un navigateur récent (Chrome, Edge, Safari, Firefox).</p>', async () => {});
    return;
  }
  if (!REPO.owner || !REPO.repo) {
    screen('<h1>Dépôt non défini</h1><p class="sub">Renseigne le compte et le dépôt GitHub dans le fichier <code>depot.js</code>.</p>', async () => {});
    return;
  }
  screen('<h1>Connexion…</h1><p class="sub">Lecture de la configuration sur GitHub.</p>', async () => {});
  try {
    const f = await gh(`/contents/admin.json${ref()}`, { token: '' });
    cfg = JSON.parse(fromB64(f.content)); cfgSha = f.sha;
  } catch (e) {
    if (e.status === 404) { cfg = null; cfgSha = null; return showSetup(); }
    return screen(`<h1>Connexion impossible</h1><p class="sub">${esc(e.message)}</p><button class="btn primary big" type="submit">Réessayer</button>`, async () => boot());
  }
  // déjà connecté dans cet onglet ?
  const tk = sess.get();
  if (tk) {
    token = tk;
    try { await gh(''); return startApp(); } catch (e) { token = ''; sess.del(); }
  }
  showLogin();
}

function showLogin() {
  screen(`<h1>Panel admin</h1><p class="sub">Entre le mot de passe admin.</p>
    ${pwField('lgPw', 'Mot de passe', 'current-password')}
    <button class="btn primary big" type="submit">Se connecter</button>
    <button type="button" class="linkbtn" id="lgForgot">Mot de passe oublié ?</button>`, async () => {
    const tk = await unseal(val('lgPw'), cfg.motDePasse);
    if (!tk) { $('#lgPw').value = ''; return fail('Mot de passe incorrect.'); }
    await enter(tk, val('lgPw'));
  });
  $('#lgForgot').onclick = showForgot;
}

async function enter(tk, pw) {
  token = tk;
  try {
    await gh('');
  } catch (e) {
    token = '';
    if (e.status === 401) return showNewToken(pw);
    throw e;
  }
  sess.set(tk);
  startApp();
}

function showForgot() {
  screen(`<h1>Mot de passe oublié</h1><p class="sub">Entre ta phrase secrète pour choisir un nouveau mot de passe. Les majuscules, accents et la ponctuation ne comptent pas.</p>
    ${cfg.indice ? `<p class="tip">Indice : ${esc(cfg.indice)}</p>` : ''}
    <label>Phrase secrète<textarea id="lgPhrase" rows="2" required autocapitalize="off" spellcheck="false"></textarea></label>
    <button class="btn primary big" type="submit">Vérifier la phrase</button>
    <button type="button" class="linkbtn" id="lgBack">← Retour à la connexion</button>`, async () => {
    await new Promise((r) => setTimeout(r, 400));   // ralentit les essais en série
    const phrase = normPhrase(val('lgPhrase'));
    const tk = await unseal(phrase, cfg.phrase);
    if (!tk) return fail('Phrase secrète incorrecte.');
    showReset(tk, phrase);
  });
  $('#lgBack').onclick = showLogin;
}

function showReset(tk, phrase) {
  screen(`<h1>Nouveau mot de passe</h1><p class="sub">Phrase secrète correcte. Choisis ton nouveau mot de passe (${MIN_PW} caractères minimum).</p>
    ${pwField('rsPw', 'Nouveau mot de passe', 'new-password')}
    ${pwField('rsPw2', 'Confirme le mot de passe', 'new-password')}
    <button class="btn primary big" type="submit">Enregistrer et entrer</button>`, async () => {
    const pw = val('rsPw');
    if (pw.length < MIN_PW) return fail(`Au moins ${MIN_PW} caractères.`);
    if (pw !== val('rsPw2')) return fail('Les deux mots de passe ne sont pas identiques.');
    token = tk;
    try { await gh(''); } catch (e) { token = ''; if (e.status === 401) return showNewToken(pw, phrase); throw e; }
    await saveCfg({ ...cfg, motDePasse: await seal(pw, tk), maj: new Date().toISOString() });
    sess.set(tk);
    toast('Nouveau mot de passe enregistré, valable partout.');
    startApp();
  });
}

function showNewToken(pw, phrase) {
  screen(`<h1>Jeton GitHub expiré</h1><p class="sub">Le jeton GitHub enregistré ne marche plus. Colle un nouveau jeton${phrase ? '' : ' et ta phrase secrète'} pour le remplacer.</p>
    ${tokenHelp()}
    ${pwField('ntToken', 'Nouveau jeton GitHub', 'off')}
    ${phrase ? '' : '<label>Phrase secrète<textarea id="ntPhrase" rows="2" required autocapitalize="off" spellcheck="false"></textarea></label>'}
    <button class="btn primary big" type="submit">Remplacer le jeton</button>`, async () => {
    const ph = phrase || normPhrase(val('ntPhrase'));
    if (!phrase && !(await unseal(ph, cfg.phrase))) return fail('Phrase secrète incorrecte.');
    const tk = val('ntToken').trim();
    await checkToken(tk);
    token = tk;
    await saveCfg({ ...cfg, motDePasse: await seal(pw, tk), phrase: await seal(ph, tk), maj: new Date().toISOString() });
    sess.set(tk);
    toast('Nouveau jeton enregistré.');
    startApp();
  });
}

async function checkToken(tk) {
  if (!tk) throw new Error('Colle le jeton GitHub.');
  const info = await gh('', { token: tk });
  if (info.permissions && info.permissions.push === false) throw new Error('Ce jeton peut lire le dépôt mais pas le modifier.');
}

function tokenHelp() {
  return `<details class="help"><summary>Créer un jeton GitHub (2 minutes)</summary><ol>
    <li>Connecté au compte <b>${esc(REPO.owner)}</b>, ouvre <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub › Fine-grained tokens › Generate new token</a>.</li>
    <li><b>Token name</b> : « Admin RAW RP ». <b>Expiration</b> : la plus longue possible.</li>
    <li><b>Repository access</b> : <i>Only select repositories</i> › <b>${esc(REPO.repo)}</b> uniquement.</li>
    <li><b>Permissions › Contents</b> : <i>Read and write</i>. Rien d'autre.</li>
    <li><b>Generate token</b>, copie-le et colle-le ici.</li></ol></details>`;
}

function showSetup() {
  screen(`<h1>Configurer le panel admin</h1>
    <p class="sub">À faire une seule fois. Le jeton GitHub permet au panel de publier le site. Il est enregistré <b>chiffré</b> : seuls ton mot de passe ou ta phrase secrète peuvent le déverrouiller.</p>
    ${tokenHelp()}
    ${pwField('suToken', 'Jeton GitHub', 'off')}
    ${pwField('suPw', `Mot de passe admin (${MIN_PW} caractères minimum)`, 'new-password')}
    ${pwField('suPw2', 'Confirme le mot de passe', 'new-password')}
    <label>Phrase secrète (pour « mot de passe oublié »)<textarea id="suPhrase" rows="2" required autocapitalize="off" spellcheck="false" placeholder="Ex. : le tracteur rouge de papi dort sous le figuier"></textarea><span class="hint">Au moins ${MIN_PHRASE} caractères, une vraie phrase que toi seul connais. Note-la quelque part en sécurité.</span></label>
    <label>Indice (facultatif, visible par tous)<input id="suHint" maxlength="80" placeholder="Ex. : le tracteur de papi"></label>
    <button class="btn primary big" type="submit">Configurer et entrer</button>`, async () => {
    const tk = val('suToken').trim(), pw = val('suPw'), phrase = normPhrase(val('suPhrase'));
    if (pw.length < MIN_PW) return fail(`Le mot de passe doit faire au moins ${MIN_PW} caractères.`);
    if (pw !== val('suPw2')) return fail('Les deux mots de passe ne sont pas identiques.');
    if (phrase.length < MIN_PHRASE) return fail(`La phrase secrète doit faire au moins ${MIN_PHRASE} caractères.`);
    if (phrase === normPhrase(pw)) return fail('La phrase secrète doit être différente du mot de passe.');
    await checkToken(tk);
    token = tk;
    await saveCfg({ v: 1, indice: val('suHint').trim(), motDePasse: await seal(pw, tk), phrase: await seal(phrase, tk), maj: new Date().toISOString() });
    sess.set(tk);
    toast('Panel configuré. Le même mot de passe marche maintenant partout.');
    startApp();
  });
}

// bouton « œil » pour afficher les mots de passe
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-eye]');
  if (!b) return;
  const i = $('#' + b.dataset.eye);
  i.type = i.type === 'password' ? 'text' : 'password';
});

function logout() {
  if (isDirty() && !confirm('Tu as des modifications non publiées. Elles restent gardées en brouillon sur cet appareil. Se déconnecter quand même ?')) return;
  sess.del();
  token = '';
  location.reload();
}

/* =========================================================
   Démarrage de l'éditeur
   ========================================================= */
async function loadContent() {
  try {
    const f = await gh(`/contents/content.js${ref()}`);
    sha = f.sha;
    const txt = fromB64(f.content);
    saved = JSON.stringify(strip(normalize(JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)))));
  } catch (e) {
    if (e.status !== 404 && !(e instanceof SyntaxError)) throw e;
    sha = null;
    saved = JSON.stringify(strip(normalize(window.RAWRP_CONTENT || null)));
  }
  draft = JSON.parse(saved);
  hist = [saved]; hpos = 0;
}

async function startApp() {
  screen('<h1>Chargement…</h1><p class="sub">Récupération du contenu publié.</p>', async () => {});
  try { await loadContent(); }
  catch (e) { return screen(`<h1>Chargement impossible</h1><p class="sub">${esc(e.message)}</p><button class="btn primary big" type="submit">Réessayer</button>`, async () => startApp()); }
  $('#login').hidden = true;
  $('#app').hidden = false;
  $('#repoBar').innerHTML = `<span class="ok">●</span> Connecté à GitHub : <b>${esc(REPO.owner)}/${esc(REPO.repo)}</b> — « Publier » met le site à jour pour tout le monde (1 à 2 minutes).`;
  $('#histLink').href = `https://github.com/${REPO.owner}/${REPO.repo}/commits/${REPO.branch}/content.js`;
  try {
    const d = JSON.parse(store.get(K_DRAFT) || 'null');
    if (d && d.json && d.json !== saved) $('#draftBanner').hidden = false;
  } catch (e) {}
  renderEditor(true);
  updateState();
  sendPreview();
}

/* =========================================================
   Formulaires
   ========================================================= */
function titleOf(f, it) {
  if (typeof f.title === 'function') return f.title(it);
  return (it && it[f.title]) || 'Sans titre';
}
function imgUrl(v) { return previews[v] || v; }
const isData = (v) => /^data:/.test(v || '');

function fieldHTML(f, base) {
  if (f.g) return `<div class="group">${esc(f.g)}</div>`;
  if (f.tip) return `<p class="tip">${esc(f.tip)}</p>`;
  const p = base ? `${base}.${f.k}` : f.k;
  const v = getP(draft, p);
  const id = 'f-' + p.replace(/\./g, '-');
  const lab = `<span>${esc(f.l)}</span>`;
  const hint = f.h ? `<span class="hint">${esc(f.h)}</span>` : '';
  const dp = `data-p="${esc(p)}"`;
  switch (f.t) {
    case 'text':
    case 'url':
      return `<label class="f" for="${id}">${lab}<input id="${id}" type="${f.t === 'url' ? 'url' : 'text'}" ${dp} data-t="text" value="${esc(v)}" autocomplete="off">${hint}</label>`;
    case 'textarea':
      return `<label class="f" for="${id}">${lab}<textarea id="${id}" rows="${f.rows || 3}" ${dp} data-t="text">${esc(v)}</textarea>${hint}</label>`;
    case 'lines':
      return `<label class="f" for="${id}">${lab}<textarea id="${id}" rows="${f.rows || 4}" ${dp} data-t="lines">${esc((v || []).join('\n'))}</textarea>${hint}</label>`;
    case 'color':
      return `<div class="f">${lab}<div class="color"><input type="color" ${dp} data-t="color" value="${esc(v)}" aria-label="${esc(f.l)}"><input id="${id}" ${dp} data-t="color" value="${esc(v)}" maxlength="7" spellcheck="false"></div>${hint}</div>`;
    case 'select':
      return `<label class="f" for="${id}">${lab}<select id="${id}" ${dp} data-t="text">${f.o.map(([val, txt]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(txt)}</option>`).join('')}</select>${hint}</label>`;
    case 'toggle':
      return `<div class="f"><label class="toggle"><input type="checkbox" ${dp} data-t="bool"${v ? ' checked' : ''}> ${esc(f.l)}</label>${hint}</div>`;
    case 'datetime':
      return `<label class="f" for="${id}">${lab}<input id="${id}" type="datetime-local" ${dp} data-t="text" value="${esc(v)}">${hint}</label>`;
    case 'image': {
      const url = v ? imgUrl(v) : '';
      return `<div class="f">${lab}<div class="img">
        <div class="thumb"${url ? ` style="background-image:url('${esc(url)}')"` : ''}>${url ? '' : 'Aucune image'}</div>
        <div class="acts"><label class="btn small">${v ? 'Changer…' : 'Choisir…'}<input type="file" accept="image/*" data-up="${esc(p)}" hidden></label>${v ? `<button type="button" class="btn small" data-act="imgdel" ${dp}>Retirer</button>` : ''}</div>
        ${v ? `<div class="path">${isData(v) ? 'Image intégrée au contenu' : esc(v)}</div>` : ''}</div>${hint}</div>`;
    }
    case 'list': {
      listDefs[p] = f;
      const arr = v || [];
      const items = arr.map((it, i) => {
        const ip = `${p}.${i}`;
        return `<details class="item" data-item="${esc(ip)}"${openItems.has(ip) ? ' open' : ''}>
          <summary><span class="n">${pad(i + 1)}</span><span class="t">${esc(titleOf(f, it))}</span>
            <button type="button" class="mini" data-act="up" ${dp} data-i="${i}" aria-label="Monter"${i === 0 ? ' disabled' : ''}>↑</button>
            <button type="button" class="mini" data-act="down" ${dp} data-i="${i}" aria-label="Descendre"${i === arr.length - 1 ? ' disabled' : ''}>↓</button>
            ${f.fixed ? '' : `<button type="button" class="mini del" data-act="del" ${dp} data-i="${i}" aria-label="Supprimer">✕</button>`}
          </summary>
          <div class="body">${f.item.map((sf) => fieldHTML(sf, ip)).join('')}</div>
        </details>`;
      }).join('');
      return `<div class="list">${items || '<p class="tip">Aucun élément pour l\'instant.</p>'}</div>${f.fixed ? '' : `<button type="button" class="btn add" data-act="add" ${dp}>+ ${esc(f.add)}</button>`}`;
    }
  }
  return '';
}

function renderTabs() {
  $('#tabs').innerHTML = TABS.map((t) => {
    const sec = draft.sections.find((s) => s.id === t.id);
    return `<button type="button" data-tab="${t.id}" class="${t.id === tab ? 'on' : ''}">${esc(t.label)}${sec && !sec.visible ? '<span class="off">masquée</span>' : ''}</button>`;
  }).join('');
}

function renderEditor(resetScroll) {
  listDefs = {};
  const ed = $('#editor');
  const y = ed.scrollTop;
  const t = TABS.find((x) => x.id === tab);
  const sec = draft.sections.find((s) => s.id === t.id);
  ed.innerHTML = `<h2>${esc(t.label)}</h2>${t.lead ? `<p class="lead">${esc(t.lead)}</p>` : ''}
    ${sec && !sec.visible ? '<p class="tip">Cette section est masquée sur le site. Tu peux la réafficher dans l\'onglet <b>Sections</b>.</p>' : ''}
    ${t.fields.map((f) => fieldHTML(f, '')).join('')}`;
  ed.scrollTop = resetScroll ? 0 : y;
  renderTabs();
}

/* =========================================================
   Modifications, historique, brouillon
   ========================================================= */
const isDirty = () => JSON.stringify(draft) !== saved;

function updateState() {
  const dirty = isDirty();
  const pill = $('#state');
  pill.textContent = dirty ? 'Modifications non publiées' : 'Tout est publié';
  pill.className = 'pill ' + (dirty ? 'dirty' : 'ok');
  $('#publish').classList.toggle('has', dirty);
  $('#undo').disabled = hpos <= 0 && JSON.stringify(draft) === hist[hpos];
  $('#redo').disabled = hpos >= hist.length - 1;
}
function snapshot() {
  clearTimeout(histTimer);
  const j = JSON.stringify(draft);
  if (j !== hist[hpos]) {
    hist = hist.slice(0, hpos + 1);
    hist.push(j);
    if (hist.length > 150) hist.shift();
    hpos = hist.length - 1;
  }
  updateState();
}
function saveDraft() {
  try {
    if (isDirty()) store.set(K_DRAFT, JSON.stringify({ json: JSON.stringify(draft), at: Date.now() }));
    else store.del(K_DRAFT);
  } catch (e) {}
}
function changed(structural) {
  if (structural) renderEditor();
  saveDraft();
  sendPreview();
  clearTimeout(histTimer);
  histTimer = setTimeout(snapshot, 450);
  updateState();
}
function loadState(j) {
  draft = JSON.parse(j);
  renderEditor();
  saveDraft();
  sendPreview();
  updateState();
}
function undo() { snapshot(); if (hpos > 0) { hpos--; loadState(hist[hpos]); } }
function redo() { snapshot(); if (hpos < hist.length - 1) { hpos++; loadState(hist[hpos]); } }

/* ---------- Saisie dans les champs ---------- */
function onField(el) {
  const p = el.dataset.p;
  if (!p) return;
  let v;
  switch (el.dataset.t) {
    case 'bool': v = el.checked; break;
    case 'lines': v = el.value.split('\n').map((s) => s.trim()).filter(Boolean); break;
    case 'color':
      v = el.value.trim();
      if (!/^#[0-9a-f]{6}$/i.test(v)) return;
      $$('[data-p]').forEach((x) => { if (x !== el && x.dataset.p === p) x.value = v; });
      break;
    default: v = el.value;
  }
  if (JSON.stringify(getP(draft, p)) === JSON.stringify(v)) return;
  setP(draft, p, v);
  // met à jour le titre de l'élément de liste concerné
  const det = el.closest('.item');
  if (det) {
    const ip = det.dataset.item, lp = ip.slice(0, ip.lastIndexOf('.'));
    if (listDefs[lp]) det.querySelector(':scope > summary .t').textContent = titleOf(listDefs[lp], getP(draft, ip));
  }
  if (p.startsWith('sections.')) renderTabs();
  changed(false);
}

/* ---------- Images : réduction puis envoi sur GitHub ---------- */
function shrink(file, max, q) {
  return new Promise((res, rej) => {
    const img = new Image();
    const u = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u);
      let d = c.toDataURL('image/webp', q), ext = 'webp';
      if (!d.startsWith('data:image/webp')) { d = c.toDataURL('image/jpeg', q); ext = 'jpg'; }
      res({ dataUrl: d, ext });
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Image illisible. Essaie en JPG ou PNG.')); };
    img.src = u;
  });
}
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';

async function onUpload(input) {
  const p = input.dataset.up, file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return toast('Ce fichier n\'est pas une image.', true);
  input.parentElement.firstChild.textContent = 'Envoi…';
  try {
    const { dataUrl, ext } = await shrink(file, 1920, 0.82);
    const name = `images/${Date.now()}-${slug(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;
    await putFile(name, dataUrl.split(',')[1], `Ajout de l'image ${name}`);
    previews[name] = dataUrl;
    setP(draft, p, name);
    changed(true);
    toast('Image envoyée sur GitHub. Pense à publier.');
  } catch (e) {
    toast(e.message || 'Impossible d\'envoyer l\'image.', true);
    renderEditor();
  }
}


/* ---------- Boutons des listes ---------- */
function onAction(b) {
  const p = b.dataset.p, i = +b.dataset.i, arr = getP(draft, p);
  switch (b.dataset.act) {
    case 'add': {
      arr.push(clone(listDefs[p].neu));
      openItems.add(`${p}.${arr.length - 1}`);
      changed(true);
      const last = $$(`.item[data-item="${CSS.escape(`${p}.${arr.length - 1}`)}"]`)[0];
      if (last) last.scrollIntoView({ block: 'center', behavior: 'smooth' });
      break;
    }
    case 'del':
      if (!confirm(`Supprimer « ${titleOf(listDefs[p], arr[i])} » ?`)) return;
      arr.splice(i, 1);
      openItems.clear();
      changed(true);
      break;
    case 'up':
    case 'down': {
      const j = b.dataset.act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      openItems.clear();
      openItems.add(`${p}.${j}`);
      changed(true);
      break;
    }
    case 'imgdel':
      setP(draft, p, '');
      changed(true);
      break;
  }
}

/* =========================================================
   Aperçu en direct
   ========================================================= */
let pvTimer = null;
function sendPreview() {
  clearTimeout(pvTimer);
  pvTimer = setTimeout(() => {
    const w = $('#pv').contentWindow;
    if (w && draft) w.postMessage({ type: 'rawrp:content', content: draft, previews }, '*');
  }, 120);
}
function gotoPreview(id) {
  const w = $('#pv').contentWindow;
  if (w && id) w.postMessage({ type: 'rawrp:goto', id }, '*');
}
addEventListener('message', (e) => {
  if (e.source === $('#pv').contentWindow && e.data && e.data.type === 'rawrp:ready') sendPreview();
});

/* =========================================================
   Publication sur GitHub
   ========================================================= */
const contentFile = (c) => `/* Contenu du site RAW RP — publié depuis le panel admin le ${new Date().toLocaleString('fr-FR')}.\n   Pour modifier le site, passe par le panel admin (étoile du logo). */\nwindow.RAWRP_CONTENT = ${JSON.stringify(c, null, 2)};\n`;

async function publish() {
  snapshot();
  if (!isDirty()) return toast('Tout est déjà publié.');
  const btn = $('#publish');
  btn.disabled = true; btn.textContent = 'Publication…';
  const out = { ...clone(draft), _maj: Date.now() };
  try {
    const r = await putFile('content.js', toB64(contentFile(out)), 'Mise à jour du site depuis le panel admin', sha);
    sha = r.content.sha;
    store.set(K_CONTENT, JSON.stringify(out));   // ce navigateur voit le changement tout de suite
    saved = JSON.stringify(draft);
    saveDraft();
    updateState();
    toast('Publié ! Le site sera à jour pour tout le monde d\'ici 1 à 2 minutes.');
  } catch (e) {
    if (e.status === 401) { toast('Le jeton GitHub a expiré. Reconnecte-toi pour le remplacer.', true); }
    else toast(e.message, true);
  } finally {
    btn.disabled = false; btn.textContent = 'Publier';
  }
}
function download() {
  const out = { ...clone(draft), _maj: Date.now() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contentFile(out)], { type: 'text/javascript' }));
  a.download = 'content.js';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* =========================================================
   Sécurité : changer mot de passe, phrase, jeton
   ========================================================= */
function modal(title, html, onOk, okLabel) {
  const m = $('#modal');
  m.innerHTML = `<form method="dialog" class="modal-card"><h3>${esc(title)}</h3>${html}<p class="error" id="mdError" hidden></p>
    <div class="modal-actions"><button type="button" class="btn" id="mdCancel">Annuler</button><button type="submit" class="btn primary">${esc(okLabel || 'Enregistrer')}</button></div></form>`;
  const f = m.querySelector('form');
  $('#mdCancel').onclick = () => m.close();
  f.onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#mdError'), btn = f.querySelector('button[type=submit]'), lbl = btn.textContent;
    err.hidden = true; btn.disabled = true; btn.textContent = 'Vérification…';
    try { await onOk(); m.close(); }
    catch (x) { err.textContent = x.message; err.hidden = false; }
    finally { btn.disabled = false; btn.textContent = lbl; }
  };
  m.showModal();
  const first = m.querySelector('input,textarea');
  if (first) first.focus();
}
async function needPw(id) {
  const tk = await unseal(val(id), cfg.motDePasse);
  if (!tk) throw new Error('Mot de passe actuel incorrect.');
  return tk;
}
function changePassword() {
  modal('Changer le mot de passe', `${pwField('cpOld', 'Mot de passe actuel', 'current-password')}${pwField('cpNew', `Nouveau mot de passe (${MIN_PW} caractères min.)`, 'new-password')}${pwField('cpNew2', 'Confirme le nouveau mot de passe', 'new-password')}`, async () => {
    const tk = await needPw('cpOld'), pw = val('cpNew');
    if (pw.length < MIN_PW) throw new Error(`Au moins ${MIN_PW} caractères.`);
    if (pw !== val('cpNew2')) throw new Error('Les deux mots de passe ne sont pas identiques.');
    await saveCfg({ ...cfg, motDePasse: await seal(pw, tk), maj: new Date().toISOString() });
    toast('Mot de passe changé, valable partout.');
  });
}
function changePhrase() {
  modal('Changer la phrase secrète', `${pwField('chOld', 'Mot de passe actuel', 'current-password')}
    <label>Nouvelle phrase secrète (${MIN_PHRASE} caractères min.)<textarea id="chPhrase" rows="2" required autocapitalize="off" spellcheck="false"></textarea></label>
    <label>Indice (facultatif, visible par tous)<input id="chHint" maxlength="80" value="${esc(cfg.indice || '')}"></label>`, async () => {
    const tk = await needPw('chOld'), ph = normPhrase(val('chPhrase'));
    if (ph.length < MIN_PHRASE) throw new Error(`Au moins ${MIN_PHRASE} caractères.`);
    await saveCfg({ ...cfg, indice: val('chHint').trim(), phrase: await seal(ph, tk), maj: new Date().toISOString() });
    toast('Phrase secrète changée.');
  });
}
function changeToken() {
  modal('Remplacer le jeton GitHub', `<p class="sub">Utile quand le jeton arrive à expiration.</p>${tokenHelp()}${pwField('ctToken', 'Nouveau jeton GitHub', 'off')}${pwField('ctPw', 'Mot de passe admin', 'current-password')}
    <label>Phrase secrète<textarea id="ctPhrase" rows="2" required autocapitalize="off" spellcheck="false"></textarea></label>`, async () => {
    await needPw('ctPw');
    const ph = normPhrase(val('ctPhrase'));
    if (!(await unseal(ph, cfg.phrase))) throw new Error('Phrase secrète incorrecte.');
    const tk = val('ctToken').trim();
    await checkToken(tk);
    token = tk;
    await saveCfg({ ...cfg, motDePasse: await seal(val('ctPw'), tk), phrase: await seal(ph, tk), maj: new Date().toISOString() });
    sess.set(tk);
    toast('Nouveau jeton enregistré.');
  });
}


/* =========================================================
   Événements
   ========================================================= */

const ed = $('#editor');
ed.addEventListener('input', (e) => onField(e.target));
ed.addEventListener('change', (e) => {
  if (e.target.dataset.up) onUpload(e.target);
  else if (e.target.dataset.t === 'bool' || e.target.tagName === 'SELECT') onField(e.target);
});
ed.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  e.preventDefault();
  onAction(b);
});
ed.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.classList || !d.classList.contains('item')) return;
  if (d.open) openItems.add(d.dataset.item); else openItems.delete(d.dataset.item);
}, true);

$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  snapshot();
  tab = b.dataset.tab;
  openItems.clear();
  renderEditor(true);
  const t = TABS.find((x) => x.id === tab);
  gotoPreview(t.goto);
});

$('#undo').onclick = undo;
$('#redo').onclick = redo;
$('#publish').onclick = publish;
document.addEventListener('keydown', (e) => {
  const inField = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's' && !$('#app').hidden) { e.preventDefault(); publish(); }
  if (!inField && mod && e.key.toLowerCase() === 'z' && !$('#app').hidden) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
});

// menu « ⋯ »
const more = $('#more'), moreBtn = $('#moreBtn');
moreBtn.onclick = (e) => { e.stopPropagation(); more.hidden = !more.hidden; moreBtn.setAttribute('aria-expanded', !more.hidden); };
more.addEventListener('click', (e) => { if (e.target.closest('button, a, label')) setTimeout(() => { more.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); }, 0); });
document.addEventListener('click', (e) => { if (!more.hidden && !more.contains(e.target)) { more.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); } });
$('#discard').onclick = () => { if (isDirty() && confirm('Annuler toutes les modifications non publiées ?')) { snapshot(); openItems.clear(); loadState(saved); snapshot(); } };
$('#resetBtn').onclick = () => { if (confirm('Remplacer tout le contenu par celui d\'origine ? (rien n\'est publié tant que tu ne cliques pas sur Publier)')) { snapshot(); openItems.clear(); loadState(JSON.stringify(normalize(null))); snapshot(); } };
$('#exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rawrp-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#importFile').onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = strip(normalize(JSON.parse(await f.text())));
    snapshot(); openItems.clear(); loadState(JSON.stringify(data)); snapshot();
    toast('Sauvegarde importée. Vérifie puis publie.');
  } catch (x) { toast('Fichier de sauvegarde illisible.', true); }
  e.target.value = '';
};
$('#logout').onclick = logout;
$('#logoutTop').onclick = logout;
$('#downloadBtn').onclick = download;
$('#changePw').onclick = changePassword;
$('#changePhrase').onclick = changePhrase;
$('#changeToken').onclick = changeToken;

// brouillon
$('#draftResume').onclick = () => {
  try { const d = JSON.parse(store.get(K_DRAFT)); snapshot(); loadState(JSON.stringify(strip(normalize(JSON.parse(d.json))))); snapshot(); } catch (e) {}
  $('#draftBanner').hidden = true;
};
$('#draftDrop').onclick = () => { store.del(K_DRAFT); $('#draftBanner').hidden = true; };

// affichage mobile : Modifier / Aperçu
$$('.views button').forEach((b) => (b.onclick = () => {
  $$('.views button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
  $('#work').dataset.view = b.dataset.view;
  if (b.dataset.view === 'preview') { sendPreview(); setTimeout(() => gotoPreview(TABS.find((x) => x.id === tab).goto), 250); }
}));
// aperçu ordinateur / mobile
$$('.seg button').forEach((b) => (b.onclick = () => {
  $$('.seg button').forEach((x) => x.classList.toggle('on', x === b));
  $('#pvFrame').classList.toggle('mob', b.dataset.dev === 'mob');
}));

addEventListener('beforeunload', (e) => { if (draft && isDirty()) { e.preventDefault(); e.returnValue = ''; } });

boot();
})();
