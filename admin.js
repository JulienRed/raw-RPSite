/* =========================================================
   RAW RP — panel admin (version locale)
   ---------------------------------------------------------
   - Connexion par mot de passe, gardé dans ce navigateur.
   - « Enregistrer » garde le contenu dans ce navigateur : le site
     ouvert sur cet ordinateur l'affiche tout de suite.
   - Avec Chrome ou Edge, « Relier le dossier du site » écrit aussi
     content.js et les images directement dans le dossier.
   - Sinon, « Télécharger content.js » puis remplace le fichier
     dans le dossier du site.
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
const K_CONTENT = 'rawrp-contenu', K_DRAFT = 'rawrp-brouillon', K_PW = 'rawrp-admin-pw', K_SESSION = 'rawrp-admin-ok';
let saved = '';          // dernier contenu enregistré (JSON)
let draft = null;        // contenu en cours de modification
let previews = {};       // images écrites dans le dossier (aperçu immédiat)
let dir = null;          // dossier du site relié (Chrome / Edge)
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
  t._timer = setTimeout(() => t.classList.remove('show'), err ? 6000 : 3200);
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { localStorage.setItem(k, v); },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const strip = (c) => { const o = clone(c); delete o._maj; return o; };

/* =========================================================
   Chargement du contenu
   ========================================================= */
function loadContent() {
  let data = window.RAWRP_CONTENT || null;
  try {
    const local = JSON.parse(store.get(K_CONTENT) || 'null');
    if (local && (local._maj || 0) > ((data && data._maj) || 0)) data = local;
  } catch (e) {}
  saved = JSON.stringify(strip(normalize(data)));
  draft = JSON.parse(saved);
  hist = [saved]; hpos = 0;
}

/* =========================================================
   Connexion par mot de passe (local)
   ========================================================= */
async function hash(pw) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rawrp:' + pw));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let h = 5381;
    for (const ch of 'rawrp:' + pw) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }
}
const hasPw = () => !!store.get(K_PW);

function showLogin() {
  const create = !hasPw();
  $('#lgTitle').textContent = create ? 'Crée ton accès admin' : 'Panel admin';
  $('#lgSub').textContent = create
    ? 'Première connexion : choisis un mot de passe (6 caractères minimum). Il sera demandé à chaque ouverture du panel sur cet appareil.'
    : 'Entre ton mot de passe pour modifier le site.';
  $('#lgPw2Wrap').hidden = !create;
  $('#lgPw2').required = create;
  $('#lgPw').autocomplete = create ? 'new-password' : 'current-password';
  $('#lgBtn').textContent = create ? 'Créer et entrer' : 'Se connecter';
  $('#lgForgot').hidden = create;
  $('#login').hidden = false;
  $('#app').hidden = true;
  setTimeout(() => $('#lgPw').focus(), 50);
}

async function login(e) {
  e.preventDefault();
  const err = $('#lgError'), pw = $('#lgPw').value;
  err.hidden = true;
  const fail = (m) => { err.textContent = m; err.hidden = false; };
  if (!hasPw()) {
    if (pw.length < 6) return fail('Choisis au moins 6 caractères.');
    if (pw !== $('#lgPw2').value) return fail('Les deux mots de passe ne sont pas identiques.');
    try { store.set(K_PW, await hash(pw)); } catch (x) { return fail('Ce navigateur bloque le stockage local. Autorise-le ou essaie Chrome.'); }
  } else if ((await hash(pw)) !== store.get(K_PW)) {
    $('#lgPw').value = '';
    return fail('Mot de passe incorrect.');
  }
  try { sessionStorage.setItem(K_SESSION, '1'); } catch (x) {}
  $('#lgPw').value = ''; $('#lgPw2').value = '';
  startApp();
}

function forgot() {
  if (!confirm('Réinitialiser le mot de passe ? Le contenu du site n\'est pas touché : tu choisiras simplement un nouveau mot de passe.')) return;
  store.del(K_PW);
  showLogin();
}
function logout() {
  if (isDirty() && !confirm('Tu as des modifications non enregistrées. Elles restent gardées en brouillon. Se déconnecter quand même ?')) return;
  try { sessionStorage.removeItem(K_SESSION); } catch (e) {}
  location.reload();
}

/* =========================================================
   Démarrage de l'éditeur
   ========================================================= */
function startApp() {
  loadContent();
  $('#login').hidden = true;
  $('#app').hidden = false;
  try {
    const d = JSON.parse(store.get(K_DRAFT) || 'null');
    if (d && d.json && d.json !== saved) $('#draftBanner').hidden = false;
  } catch (e) {}
  renderEditor(true);
  updateState();
  sendPreview();
  restoreFolder();
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
  pill.textContent = dirty ? 'Modifications non enregistrées' : 'Tout est enregistré';
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

/* ---------- Images : réduction, puis dans le dossier ou intégrées ---------- */
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
  input.parentElement.firstChild.textContent = 'Traitement…';
  try {
    if (dir && (await folderPerm(true))) {
      const { dataUrl, ext } = await shrink(file, 1920, 0.82);
      const name = `images/${Date.now()}-${slug(file.name.replace(/\.[^.]+$/, ''))}.${ext}`;
      await writeFile(name, dataToBlob(dataUrl));
      previews[name] = dataUrl;
      setP(draft, p, name);
      toast('Image ajoutée dans le dossier images/.');
    } else {
      // pas de dossier relié : l'image est intégrée au contenu (plus léger : 1280 px)
      const { dataUrl } = await shrink(file, 1280, 0.78);
      setP(draft, p, dataUrl);
      toast('Image ajoutée. Pense à enregistrer.');
    }
    changed(true);
  } catch (e) {
    toast(e.message || 'Impossible d\'ajouter l\'image.', true);
    renderEditor();
  }
}
function dataToBlob(d) {
  const [h, b] = d.split(','), type = h.slice(5, h.indexOf(';'));
  const bin = atob(b), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
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
   Dossier du site (Chrome / Edge) : écriture directe des fichiers
   ========================================================= */
const canFolder = 'showDirectoryPicker' in window;
const idb = (mode, fn) => new Promise((res, rej) => {
  const r = indexedDB.open('rawrp-admin', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onerror = () => rej(r.error);
  r.onsuccess = () => { const tx = r.result.transaction('kv', mode); const q = fn(tx.objectStore('kv')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); };
});
async function restoreFolder() {
  if (!canFolder) return renderFolder();
  try { dir = (await idb('readonly', (s) => s.get('dir'))) || null; } catch (e) { dir = null; }
  renderFolder();
}
async function folderPerm(ask) {
  if (!dir) return false;
  const o = { mode: 'readwrite' };
  try {
    if ((await dir.queryPermission(o)) === 'granted') return true;
    return ask ? (await dir.requestPermission(o)) === 'granted' : false;
  } catch (e) { return false; }
}
async function linkFolder() {
  if (!canFolder) return toast('Ton navigateur ne permet pas de relier un dossier. Utilise Chrome ou Edge, ou « Télécharger content.js ».', true);
  try {
    const h = await window.showDirectoryPicker({ id: 'rawrp-site', mode: 'readwrite' });
    try { await h.getFileHandle('index.html'); }
    catch (e) { if (!confirm(`Le dossier « ${h.name} » ne contient pas index.html. Est-ce bien le dossier du site ?`)) return; }
    dir = h;
    try { await idb('readwrite', (s) => s.put(h, 'dir')); } catch (e) {}
    renderFolder();
    toast(`Dossier « ${h.name} » relié. « Enregistrer » écrira directement dedans.`);
  } catch (e) {
    if (e.name !== 'AbortError') toast('Impossible de relier ce dossier.', true);
  }
}
async function unlinkFolder() {
  dir = null;
  try { await idb('readwrite', (s) => s.delete('dir')); } catch (e) {}
  renderFolder();
}
async function writeFile(path, data) {
  const parts = path.split('/');
  let d = dir;
  for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true });
  const fh = await d.getFileHandle(parts[parts.length - 1], { create: true });
  const w = await fh.createWritable();
  await w.write(data);
  await w.close();
}
function renderFolder() {
  const bar = $('#folderBar');
  if (dir) {
    bar.innerHTML = `<span class="ok">●</span> Dossier relié : <b>${esc(dir.name)}</b> — « Enregistrer » met à jour content.js dedans. <button class="btn small" id="unlink">Délier</button>`;
    $('#unlink').onclick = unlinkFolder;
  } else if (canFolder) {
    bar.innerHTML = 'Tes modifications sont gardées dans ce navigateur. Pour les écrire dans les fichiers du site : <button class="btn small primary" id="link2">Relier le dossier du site</button>';
    $('#link2').onclick = linkFolder;
  } else {
    bar.innerHTML = 'Tes modifications sont gardées dans ce navigateur. Pour les mettre dans les fichiers du site : <button class="btn small primary" id="dl2">Télécharger content.js</button> puis remplace celui du dossier.';
    $('#dl2').onclick = download;
  }
}

/* =========================================================
   Enregistrement
   ========================================================= */
const contentFile = (c) => `/* Contenu du site RAW RP — généré par admin.html le ${new Date().toLocaleString('fr-FR')}.\n   Pour modifier le site, passe par le panel admin. */\nwindow.RAWRP_CONTENT = ${JSON.stringify(c, null, 2)};\n`;

async function save() {
  snapshot();
  const out = { ...clone(draft), _maj: Date.now() };
  // 1. dans ce navigateur (le site ouvert sur cet appareil l'affiche tout de suite)
  try {
    store.set(K_CONTENT, JSON.stringify(out));
  } catch (e) {
    return toast('Le stockage du navigateur est plein (trop d\'images intégrées). Relie le dossier du site pour enregistrer les images en fichiers.', true);
  }
  saved = JSON.stringify(draft);
  saveDraft();
  updateState();
  // 2. dans le dossier, si relié
  if (dir) {
    if (await folderPerm(true)) {
      try { await writeFile('content.js', contentFile(out)); toast('Enregistré dans le dossier du site.'); }
      catch (e) { toast('Enregistré dans le navigateur, mais l\'écriture de content.js a échoué. Utilise « Télécharger content.js ».', true); }
    } else toast('Enregistré dans le navigateur. Autorise l\'accès au dossier pour mettre à jour content.js.', true);
  } else {
    toast('Enregistré ! Rafraîchis le site pour voir les changements.');
  }
}
function download() {
  const out = { ...clone(draft), _maj: Date.now() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contentFile(out)], { type: 'text/javascript' }));
  a.download = 'content.js';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('content.js téléchargé : remplace celui du dossier du site.');
}


/* =========================================================
   Événements
   ========================================================= */
$('#loginForm').addEventListener('submit', login);

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
$('#publish').onclick = save;
document.addEventListener('keydown', (e) => {
  const inField = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 's' && !$('#app').hidden) { e.preventDefault(); save(); }
  if (!inField && mod && e.key.toLowerCase() === 'z' && !$('#app').hidden) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
});

// menu « ⋯ »
const more = $('#more'), moreBtn = $('#moreBtn');
moreBtn.onclick = (e) => { e.stopPropagation(); more.hidden = !more.hidden; moreBtn.setAttribute('aria-expanded', !more.hidden); };
document.addEventListener('click', (e) => { if (!more.hidden && !more.contains(e.target)) { more.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); } });
$('#discard').onclick = () => { if (isDirty() && confirm('Annuler toutes les modifications non enregistrées ?')) { snapshot(); openItems.clear(); loadState(saved); snapshot(); } };
$('#resetBtn').onclick = () => { if (confirm('Remplacer tout le contenu par celui d\'origine ? (rien n\'est enregistré tant que tu ne cliques pas sur Enregistrer)')) { snapshot(); openItems.clear(); loadState(JSON.stringify(normalize(null))); snapshot(); } };
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
    toast('Sauvegarde importée. Vérifie puis enregistre.');
  } catch (x) { toast('Fichier de sauvegarde illisible.', true); }
  e.target.value = '';
};
$('#logout').onclick = logout;
$('#logoutTop').onclick = logout;
$('#linkFolder').onclick = linkFolder;
$('#downloadBtn').onclick = download;
$('#changePw').onclick = () => { if (confirm('Choisir un nouveau mot de passe ?')) { store.del(K_PW); try { sessionStorage.removeItem(K_SESSION); } catch (e) {} showLogin(); } };
$('#lgForgot').onclick = forgot;

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

// démarrage : déjà connecté dans cet onglet ?
let ok = false;
try { ok = sessionStorage.getItem(K_SESSION) === '1' && hasPw(); } catch (e) {}
if (ok) startApp(); else showLogin();
})();
