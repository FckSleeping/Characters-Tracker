/* ==========================================================================
   ajout-fiche.js — pop-up « Nouvelle fiche »
   - Les fiches ajoutées sont stockées dans data/fiches.json (une entrée = un personnage)
   - Au chargement, elles sont rendues avec le même gabarit HTML que tes fiches d'origine
   - À l'enregistrement : commit direct sur GitHub (jeton) ou, à défaut, téléchargement du JSON
   ========================================================================== */
(function (root) {
  'use strict';

  /* ---------- Réglages ---------- */
  var DATA_URL  = 'data/fiches.json';
  var CFG_KEY   = 'fiches_github_cfg';
  var EDIT_KEY  = 'fiches_edit_mode';
  var ICONES    = ['alternate', 'ana', 'timelimit', 'mantika', 'settimocielo'];

  // Les 12 lignes du bloc « about », dans l'ordre d'origine.
  // precision : texte entre parenthèses affiché en petit (null = pas de précision pour cette ligne)
  var CHAMPS = [
    { label: 'NOM COMPLET',       precision: 'origine' },
    { label: 'OCCUPATION',        precision: null },
    { label: 'LIEU DE NAISSANCE', precision: 'pays' },
    { label: 'DATE DE NAISSANCE', precision: 'âge' },
    { label: 'GENRE',             precision: 'pronoms' },
    { label: 'OR. SEXUELLE',      precision: null },
    { label: 'FACECLAIM',         precision: 'œuvre' },
    { label: 'FACECLAIM IRL',     precision: null },
    { label: 'VOIX',              precision: null },
    { label: 'COULEUR',           precision: null },
    { label: 'ZODIAQUE',          precision: null },
    { label: 'PARFUM',            precision: null }
  ];
  var IDX_COULEUR = 9;
  var COULEURS_DEFAUT = ['#ffd9e6', '#c74c7d'];

  /* ---------- Fonctions pures (testables hors navigateur) ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Mini-balisage : **gras**  *italique*  __souligné__  ~~barré~~  ||flou au survol||
  function fmt(s) {
    return esc(s)
      .replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>')
      .replace(/\*([^*]+?)\*/g, '<i>$1</i>')
      .replace(/__([^_]+?)__/g, '<u>$1</u>')
      .replace(/~~([^~]+?)~~/g, '<strike>$1</strike>')
      .replace(/\|\|([^|]+?)\|\|/g, '<tw>$1</tw>');
  }

  function safeUrl(u) {
    u = String(u || '').trim();
    return /^https?:\/\//i.test(u) ? esc(u) : '';
  }

  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function okColor(c, def) {
    return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : def;
  }

  function lignes(txt) {
    return String(txt || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function aUnPartenaire(f) {
    var p = f.partenaire;
    return !!(p && ((p.nom || '').trim() || safeUrl(p.gif)));
  }

  // Produit exactement le gabarit des fiches d'origine.
  function renderFiche(f) {
    var nom    = esc((f.nom || f.id || '').trim());
    var icone  = ICONES.indexOf(f.icone) >= 0 ? f.icone : 'alternate';
    var ban    = safeUrl(f.banniere);
    var av     = safeUrl(f.avatar);
    var c      = f.couleurs || [];
    var c1     = okColor(c[0], COULEURS_DEFAUT[0]);
    var c2     = okColor(c[1], COULEURS_DEFAUT[1]);
    var grad   = 'radial-gradient(ellipse farthest-corner at center top, ' + c1 + ', ' + c2 + ')';
    var fond   = 'linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), ' + grad;
    var ship   = aUnPartenaire(f);

    var anec = (f.anecdotes || []).map(function (a) { return String(a).trim(); }).filter(Boolean)
      .map(fmt).join(' <b>✧</b> ');

    var mood = (f.aesthetic || []).map(safeUrl).filter(Boolean)
      .map(function (u) { return ' <img src="' + u + '">'; }).join('\n');

    var rows = CHAMPS.map(function (ch, i) {
      var r = (f.about && f.about[i]) || {};
      var v = String(r.valeur || '').trim() || 'réponse';
      var p = String(r.precision || '').trim();
      return '<div><div class="ask"><span>' + ch.label + '</span></div> <div class="ans">' + fmt(v) +
             (p ? '<span class="small">(' + fmt(p) + ')</span>' : '') + '</div></div>';
    }).join('\n');

    var histoire = (f.histoire || []).map(function (p) { return String(p).trim(); }).filter(Boolean)
      .map(function (p) { return '<div>' + fmt(p) + '</div>'; }).join('\n');

    var part = f.partenaire || {};
    var shipHtml =
      '<div class="ship">\n' +
      '  <span>IMPORTANT PERSON</span>\n' +
      '  <div class="gif"><div class="partner">' + esc((part.nom || '').trim()) + '</div>' +
        (safeUrl(part.gif) ? '<img src="' + safeUrl(part.gif) + '">' : '') + '\n' +
      '<span class="material-icons">favorite</span>\n' +
      '  </div>\n' +
      '</div>';

    return '<div class="container' + (ship ? '' : ' no-ship') + '" id="' + esc(f.id) + '" style="--lateral: ' + grad +
      '; background-image: ' + fond + '; background-blend-mode: color;">' +
      '<cir1></cir1><cir2></cir2><cir3></cir3><cir4></cir4>' +
      '<div class="header">\n' +
      '  <div class="' + icone + '"></div>\n' +
      '  <div class="name">✧ ' + nom + '<div>✧ ' + nom + '</div></div>\n' +
      '  <div class="gif">' + (ban ? '<img src="' + ban + '">' : '') + '</div>\n' +
      '</div>\n' +
      '<div id="one">\n' +
      '  <div class="avatar">' + (av ? '<img src="' + av + '">' : '') + '</div>\n' +
      '  <div class="status"><div class="anecdotes"><h1 style="width: 250px;"><span>ANECDOTES</span></h1></div>\n' +
      '    <div class="update" style="height: 190px; width: 248px;">\n' +
      '      <span>' + anec + '</span>\n' +
      '    </div></div>\n' +
      '</div>\n' +
      '<div id="two">\n' +
      '  <div class="scl"><div class="photos"><h1><span>AESTHETIC</span></h1>\n' +
      '  <div class="mood">\n' + mood + '\n  </div></div></div>\n' +
      '  <div class="basic"><h1>about</h1>\n' +
      '    <div class="info">\n' + rows + '\n    </div>\n' +
      '  </div>\n' +
      '</div>\n' +
      '<div id="three">\n' +
      '  <div class="status"><h1><span>STORY</span></h1>\n' +
      '    <div class="update">\n' + histoire + '\n    </div></div>\n' +
      shipHtml + '\n' +
      '</div>\n' +
      '</div>';
  }

  var API = {
    esc: esc, fmt: fmt, safeUrl: safeUrl, slug: slug, lignes: lignes,
    renderFiche: renderFiche, CHAMPS: CHAMPS, ICONES: ICONES
  };

  if (typeof document === 'undefined') {            // exécution sous Node (tests)
    if (typeof module !== 'undefined') module.exports = API;
    return;
  }

  /* ======================================================================
     Partie navigateur
     ====================================================================== */
  var fichesDonnees = [];          // contenu courant de data/fiches.json
  var modalConstruit = false;
  var couleurTouchee = false;

  function stockageLire(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } }
  function stockageEcrire(k, v) { try { root.localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }

  function lireConfig() {
    var cfg = {};
    try { cfg = JSON.parse(stockageLire(CFG_KEY) || '{}') || {}; } catch (e) { cfg = {}; }
    // Valeurs devinées depuis l'adresse (monpseudo.github.io/mon-depot/)
    var h = root.location.hostname, seg = root.location.pathname.split('/').filter(Boolean)[0] || '';
    if (/\.github\.io$/i.test(h)) {
      cfg.owner = cfg.owner || h.split('.')[0];
      cfg.repo  = cfg.repo  || seg;
    }
    cfg.branch = cfg.branch || 'main';
    cfg.dir    = cfg.dir == null ? '' : cfg.dir;
    return cfg;
  }

  /* ---------- Rendu dans la page ---------- */
  function afficherFiche(f) {
    if (!f || !f.id || document.getElementById(f.id)) return null;     // déjà présente
    var tpl = document.createElement('template');
    tpl.innerHTML = renderFiche(f).trim();
    var carte = tpl.content.firstElementChild;
    var conteneur = document.getElementById('fiches') || document.querySelector('grocontainer');
    var existantes = conteneur.querySelectorAll('.container');
    var ref = null;
    for (var i = 0; i < existantes.length; i++) {                       // ordre alphabétique
      if (existantes[i].id.localeCompare(f.id, 'fr') > 0) { ref = existantes[i]; break; }
    }
    var br1 = document.createElement('br'), br2 = document.createElement('br');
    if (ref) {
      ref.parentNode.insertBefore(carte, ref);
      ref.parentNode.insertBefore(br1, ref);
      ref.parentNode.insertBefore(br2, ref);
    } else {
      conteneur.appendChild(carte); conteneur.appendChild(br1); conteneur.appendChild(br2);
    }
    if (root.setupImageGallery) root.setupImageGallery();               // lightbox des images « aesthetic »
    return carte;
  }

  /* ---------- Pop-up ---------- */
  function champsAbout() {
    return CHAMPS.map(function (ch, i) {
      return '<div class="fp-row">' +
        '<span class="fp-lab">' + ch.label + '</span>' +
        '<input id="fp-v-' + i + '" type="text" placeholder="réponse">' +
        (ch.precision ? '<input id="fp-p-' + i + '" type="text" class="fp-small" placeholder="' + ch.precision + '">' : '<span></span>') +
        '</div>';
    }).join('');
  }

  function construireModal() {
    if (modalConstruit) return;
    modalConstruit = true;

    var ov = document.createElement('div');
    ov.id = 'fp-overlay';
    ov.hidden = true;
    ov.innerHTML =
      '<form id="fp-modal" autocomplete="off" novalidate>' +
        '<div class="fp-top"><div class="fp-title">Nouvelle fiche</div>' +
          '<button type="button" class="fp-x" id="fp-close" aria-label="Fermer">×</button></div>' +
        '<div class="fp-body">' +

          '<div class="fp-sec"><div class="fp-h">En-tête</div>' +
            '<label>Prénom <em>(sert aussi d’identifiant)</em><input id="fp-prenom" type="text" required></label>' +
            '<div class="fp-hint" id="fp-idhint"></div>' +
            '<label>Type d’icône (coin de l’en-tête)<select id="fp-icone">' +
              ICONES.map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') +
            '</select></label>' +
            '<label>Bannière — lien du gif / de l’image<input id="fp-banniere" type="url" placeholder="https://…"></label>' +
            '<label>Avatar — lien de l’image<input id="fp-avatar" type="url" placeholder="https://…"></label>' +
            '<div class="fp-duo">' +
              '<label>Couleur claire<input id="fp-c1" type="color" value="' + COULEURS_DEFAUT[0] + '"></label>' +
              '<label>Couleur foncée<input id="fp-c2" type="color" value="' + COULEURS_DEFAUT[1] + '"></label>' +
            '</div>' +
          '</div>' +

          '<div class="fp-sec"><div class="fp-h">About</div>' + champsAbout() +
            '<div class="fp-hint">La précision entre parenthèses est facultative. Une ligne vide s’affichera « réponse ».</div></div>' +

          '<div class="fp-sec"><div class="fp-h">Anecdotes</div>' +
            '<textarea id="fp-anecdotes" rows="5" placeholder="Une anecdote par ligne"></textarea></div>' +

          '<div class="fp-sec"><div class="fp-h">Aesthetic</div>' +
            '<textarea id="fp-aesthetic" rows="4" placeholder="Un lien d’image par ligne (8 conseillées)"></textarea></div>' +

          '<div class="fp-sec"><div class="fp-h">Story</div>' +
            '<textarea id="fp-histoire" rows="8" placeholder="Un paragraphe par ligne"></textarea>' +
            '<div class="fp-hint">Mise en forme : **gras**  *italique*  __souligné__  ~~barré~~  ||flou au survol||  (aussi dans les anecdotes et l’about)</div></div>' +

          '<div class="fp-sec"><div class="fp-h">Important person</div>' +
            '<label>Nom<input id="fp-pnom" type="text"></label>' +
            '<label>Gif — lien<input id="fp-pgif" type="url" placeholder="https://…"></label>' +
            '<div class="fp-hint">Les deux champs vides : le bloc est masqué et l’histoire prend toute la hauteur, comme sur tes fiches sans ship.</div></div>' +

          '<details class="fp-sec" id="fp-gh"><summary>Enregistrement sur GitHub</summary>' +
            '<div class="fp-hint">Sans jeton, la fiche s’affiche et un fichier <b>fiches.json</b> à envoyer sur le dépôt est téléchargé. ' +
            'Avec un jeton, la fiche est commitée toute seule. Le jeton reste uniquement dans ce navigateur.</div>' +
            '<div class="fp-duo"><label>Compte<input id="fp-owner" type="text"></label>' +
            '<label>Dépôt<input id="fp-repo" type="text"></label></div>' +
            '<div class="fp-duo"><label>Branche<input id="fp-branch" type="text"></label>' +
            '<label>Dossier du site <em>(« docs » si Pages publie depuis /docs)</em><input id="fp-dir" type="text" placeholder="vide = racine"></label></div>' +
            '<label>Jeton d’accès (fine-grained, « Contents : Read and write » sur ce seul dépôt)' +
            '<input id="fp-token" type="password" autocomplete="off"></label>' +
          '</details>' +

        '</div>' +
        '<div class="fp-foot"><span id="fp-status" role="status"></span>' +
          '<button type="button" id="fp-cancel">Annuler</button>' +
          '<button type="submit" id="fp-save">Enregistrer la fiche</button></div>' +
      '</form>';
    document.body.appendChild(ov);

    var toast = document.createElement('div');
    toast.id = 'fp-toast'; toast.hidden = true;
    document.body.appendChild(toast);

    // Interactions
    var $ = function (id) { return document.getElementById(id); };
    $('fp-close').addEventListener('click', fermerModal);
    $('fp-cancel').addEventListener('click', fermerModal);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermerModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !ov.hidden) fermerModal();
    });
    $('fp-prenom').addEventListener('input', majIdHint);
    $('fp-c2').addEventListener('input', function () {
      if (!couleurTouchee) $('fp-v-' + IDX_COULEUR).value = $('fp-c2').value;
    });
    $('fp-v-' + IDX_COULEUR).addEventListener('input', function () { couleurTouchee = true; });
    $('fp-v-' + IDX_COULEUR).value = $('fp-c2').value;
    $('fp-modal').addEventListener('submit', soumettre);
  }

  function majIdHint() {
    var id = slug(document.getElementById('fp-prenom').value);
    var h = document.getElementById('fp-idhint');
    if (!id) { h.textContent = ''; return; }
    var pris = document.getElementById(id) || fichesDonnees.some(function (x) { return x.id === id; });
    h.textContent = pris ? 'Identifiant « ' + id + ' » déjà utilisé — choisis un autre prénom.' : 'Identifiant : ' + id;
    h.className = 'fp-hint' + (pris ? ' fp-err' : '');
  }

  function statut(msg, erreur) {
    var s = document.getElementById('fp-status');
    s.textContent = msg || '';
    s.className = erreur ? 'fp-err' : '';
  }

  function ouvrirModal() {
    construireModal();
    var cfg = lireConfig(), $ = function (id) { return document.getElementById(id); };
    $('fp-owner').value  = cfg.owner || '';
    $('fp-repo').value   = cfg.repo || '';
    $('fp-branch').value = cfg.branch;
    $('fp-dir').value    = cfg.dir;
    $('fp-token').value  = cfg.token || '';
    $('fp-gh').open = !cfg.token;
    statut('');
    majIdHint();
    $('fp-overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $('fp-prenom').focus();
  }

  function fermerModal() {
    document.getElementById('fp-overlay').hidden = true;
    document.body.style.overflow = '';
  }

  function toast(msg) {
    var t = document.getElementById('fp-toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 9000);
  }

  function lireFormulaire() {
    var $ = function (id) { return document.getElementById(id); };
    var prenom = $('fp-prenom').value.trim();
    return {
      id: slug(prenom),
      nom: prenom,
      icone: $('fp-icone').value,
      banniere: $('fp-banniere').value.trim(),
      avatar: $('fp-avatar').value.trim(),
      couleurs: [$('fp-c1').value, $('fp-c2').value],
      about: CHAMPS.map(function (ch, i) {
        return { valeur: $('fp-v-' + i).value.trim(), precision: $('fp-p-' + i) ? $('fp-p-' + i).value.trim() : '' };
      }),
      anecdotes: lignes($('fp-anecdotes').value),
      aesthetic: lignes($('fp-aesthetic').value),
      histoire: lignes($('fp-histoire').value),
      partenaire: { nom: $('fp-pnom').value.trim(), gif: $('fp-pgif').value.trim() }
    };
  }

  function lireConfigFormulaire() {
    var $ = function (id) { return document.getElementById(id); };
    return {
      owner: $('fp-owner').value.trim(), repo: $('fp-repo').value.trim(),
      branch: $('fp-branch').value.trim() || 'main',
      dir: $('fp-dir').value.trim().replace(/^\/+|\/+$/g, ''),
      token: $('fp-token').value.trim()
    };
  }

  /* ---------- GitHub ---------- */
  function utf8VersB64(txt) {
    var bytes = new TextEncoder().encode(txt), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64VersUtf8(b64) {
    var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function appelApi(cfg, methode, corps) {
    var chemin = (cfg.dir ? cfg.dir + '/' : '') + 'data/fiches.json';
    var url = 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) +
      '/contents/' + chemin.split('/').map(encodeURIComponent).join('/') +
      (methode === 'GET' ? '?ref=' + encodeURIComponent(cfg.branch) + '&t=' + Date.now() : '');
    var headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + cfg.token,
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (corps) headers['Content-Type'] = 'application/json';
    return fetch(url, { method: methode, headers: headers, cache: 'no-store', body: corps ? JSON.stringify(corps) : undefined });
  }

  function erreurApi(r) {
    if (r.status === 401) return new Error('jeton refusé (401) — vérifie qu’il est correct et non expiré.');
    if (r.status === 403 || r.status === 404) return new Error('accès refusé ou dépôt introuvable (' + r.status + ') — vérifie compte, dépôt, branche, dossier, et que le jeton a bien « Contents : Read and write » sur ce dépôt.');
    return new Error('GitHub a répondu ' + r.status + '.');
  }

  async function enregistrerSurGitHub(fiche, cfg) {
    if (!cfg.owner || !cfg.repo) throw new Error('renseigne le compte et le dépôt GitHub.');
    for (var essai = 0; essai < 2; essai++) {
      var r = await appelApi(cfg, 'GET');
      var sha = null, liste = [];
      if (r.status === 404 && essai === 0) {
        // fichier absent : on le créera ; (404 peut aussi venir d'un mauvais dépôt, le PUT le dira)
      } else if (!r.ok) {
        throw erreurApi(r);
      } else {
        var j = await r.json();
        sha = j.sha;
        try { liste = JSON.parse(b64VersUtf8(j.content) || '[]'); } catch (e) { throw new Error('data/fiches.json n’est pas un JSON valide.'); }
        if (!Array.isArray(liste)) throw new Error('data/fiches.json doit contenir une liste [ ].');
      }
      if (liste.some(function (x) { return x.id === fiche.id; })) throw new Error('l’identifiant « ' + fiche.id + ' » existe déjà sur GitHub.');
      liste.push(fiche);
      var corps = {
        message: 'Ajout de la fiche ' + (fiche.nom || fiche.id),
        content: utf8VersB64(JSON.stringify(liste, null, 2) + '\n'),
        branch: cfg.branch
      };
      if (sha) corps.sha = sha;
      var p = await appelApi(cfg, 'PUT', corps);
      if (p.ok) { fichesDonnees = liste; return; }
      if ((p.status === 409 || p.status === 422) && essai === 0) continue;   // quelqu'un a modifié le fichier entre-temps : on réessaie
      throw erreurApi(p);
    }
  }

  function telechargerJson(liste) {
    var blob = new Blob([JSON.stringify(liste, null, 2) + '\n'], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fiches.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  /* ---------- Envoi du formulaire ---------- */
  async function soumettre(e) {
    e.preventDefault();
    var f = lireFormulaire();
    if (!f.id) return statut('Le prénom est obligatoire.', true);
    if (document.getElementById(f.id) || fichesDonnees.some(function (x) { return x.id === f.id; }))
      return statut('Cet identifiant existe déjà — change le prénom.', true);

    var cfg = lireConfigFormulaire(), btn = document.getElementById('fp-save');
    btn.disabled = true;
    statut('Enregistrement…');
    try {
      if (cfg.token) {
        await enregistrerSurGitHub(f, cfg);
        stockageEcrire(CFG_KEY, JSON.stringify(cfg));
        toast('Fiche enregistrée sur GitHub. Elle sera visible par tout le monde dans une à deux minutes (temps de publication de Pages).');
      } else {
        stockageEcrire(CFG_KEY, JSON.stringify(Object.assign({}, cfg, { token: '' })));
        fichesDonnees.push(f);
        telechargerJson(fichesDonnees);
        toast('Fiche affichée ici. Remplace data/fiches.json sur le dépôt par le fichier téléchargé pour la publier.');
      }
      var carte = afficherFiche(f);
      document.getElementById('fp-modal').reset();
      couleurTouchee = false;
      document.getElementById('fp-v-' + IDX_COULEUR).value = document.getElementById('fp-c2').value;
      fermerModal();
      if (carte) carte.scrollIntoView({ behavior: 'smooth', block: 'center' });
      afficherBouton();
    } catch (ex) {
      statut('Erreur : ' + (ex && ex.message ? ex.message : ex), true);
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------- Bouton flottant (visible seulement en mode édition) ---------- */
  function afficherBouton() {
    if (document.getElementById('fp-open')) return;
    var b = document.createElement('button');
    b.id = 'fp-open'; b.type = 'button';
    b.innerHTML = '<span>＋</span> Nouvelle fiche';
    b.addEventListener('click', ouvrirModal);
    document.body.appendChild(b);
  }

  function init() {
    if (/[?&]edit(=|&|$)/.test(root.location.search)) stockageEcrire(EDIT_KEY, '1');
    if (stockageLire(EDIT_KEY) === '1') afficherBouton();

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (liste) {
        fichesDonnees = Array.isArray(liste) ? liste : [];
        fichesDonnees.forEach(afficherFiche);
      })
      .catch(function () { /* page ouverte hors serveur : pas de fiches ajoutées à charger */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(typeof window !== 'undefined' ? window : this);
