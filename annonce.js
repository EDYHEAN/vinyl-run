/* ═══════════════════════════════════════════
   ANNONCE TEMPORAIRE — Fermeture boutique
   31/07/2026 18h → 08/09/2026 10h (heure Réunion, UTC+4)

   Deux effets :
   1. réécrit le message de la hellobar (la barre reste, seul le discours change)
   2. affiche un pop-in au bout de 3 s, une fois par visiteur et par phase

   Auto-expiration : passé la date de réouverture le script ne fait plus rien,
   la hellobar retrouve son message "expédition mondiale" écrit dans le HTML.
   Aucun nettoyage manuel à prévoir.
═══════════════════════════════════════════ */
(function () {
  var FERMETURE  = new Date('2026-07-31T18:00:00+04:00');
  var REOUVERTURE = new Date('2026-09-08T10:00:00+04:00');
  var DELAI_POPIN = 3000;

  var now = new Date();
  if (now >= REOUVERTURE) return;            // annonce périmée : on ne touche à rien

  var phase = now < FERMETURE ? 'avant' : 'pendant';

  // Stockage défensif : certains navigateurs le bloquent et lèvent une exception
  function lire(cle)       { try { return localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrire(cle, v)  { try { localStorage.setItem(cle, v); } catch (e) {} }

  var lang = window.VR_PAGE_LANG || lire('vr_lang') ||
    ((navigator.language || '').indexOf('fr') === 0 ? 'fr' : 'en');
  if (lang !== 'en') lang = 'fr';

  var COPY = {
    fr: {
      avant: {
        desk:  'Boutique fermée du 31 juillet 18h au 8 septembre 10h',
        mob:   'Fermé du 31/07 au 08/09',
        title: 'On ferme du 31 juillet au 8 septembre',
        body:  "Vinyl Run fait une pause. Dernier jour d'ouverture&nbsp;: vendredi 31 juillet jusqu'à 18h. On rouvre le mardi 8 septembre à 10h.",
      },
      pendant: {
        desk:  'Boutique fermée · Réouverture le mardi 8 septembre à 10h',
        mob:   "Fermé jusqu'au 08/09",
        title: 'La boutique est fermée jusqu\'au 8 septembre',
        body:  'Vinyl Run fait une pause jusqu\'au mardi 8 septembre à 10h. Merci de votre patience, on revient avec les bacs bien remplis.',
      },
      kicker: 'Info boutique',
      note:   'En attendant, le magazine reste ouvert.',
      cta:    'Lire le magazine',
      close:  'Compris',
      alt:    'Pancarte « Sorry we\'re closed » accrochée à la porte d\'une boutique',
      credit: 'Photo : Tim Mossholder / Pexels',
      aria:   'Fermer l\'annonce',
    },
    en: {
      avant: {
        desk:  'Shop closed from 31 July, 6pm, to 8 September, 10am',
        mob:   'Closed 31 Jul to 8 Sep',
        title: "We're closed from 31 July to 8 September",
        body:  'Vinyl Run is taking a break. Last day open: Friday 31 July until 6pm. We reopen on Tuesday 8 September at 10am.',
      },
      pendant: {
        desk:  'Shop closed · Reopening Tuesday 8 September at 10am',
        mob:   'Closed until 8 Sep',
        title: 'The shop is closed until 8 September',
        body:  'Vinyl Run is on a break until Tuesday 8 September, 10am. Thanks for your patience, the crates will be full when we get back.',
      },
      kicker: 'Shop notice',
      note:   'In the meantime, the magazine stays open.',
      cta:    'Read the magazine',
      close:  'Got it',
      alt:    'A Sorry We\'re Closed sign hanging on a shop door',
      credit: 'Photo: Tim Mossholder / Pexels',
      aria:   'Close the notice',
    },
  };

  var t = COPY[lang];
  var p = t[phase];

  // ── 1. Hellobar : on remplace le discours, pas la barre ────────
  (function () {
    var bar = document.querySelector('.hellobar');
    if (!bar) return;
    var desk = bar.querySelector('.hellobar__desk');
    var mob  = bar.querySelector('.hellobar__mob');
    // On retire les clés i18n pour que le dictionnaire ne réécrase pas l'annonce
    if (desk) { desk.removeAttribute('data-i18n'); desk.textContent = p.desk; }
    if (mob)  { mob.removeAttribute('data-i18n');  mob.textContent  = p.mob; }
    bar.classList.add('hellobar--annonce');
  })();

  // ── 2. Pop-in ──────────────────────────────────────────────────
  var CLE = 'vr_annonce_fermeture_2026_' + phase;
  if (lire(CLE)) return;

  var IMG = 'https://images.pexels.com/photos/1101720/pexels-photo-1101720.jpeg?auto=compress&cs=tinysrgb&w=900&fit=crop';

  function afficher() {
    if (document.querySelector('.annonce')) return;

    var lastFocus = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'annonce';
    wrap.innerHTML =
      '<div class="annonce__backdrop"></div>' +
      '<div class="annonce__card" role="dialog" aria-modal="true" aria-labelledby="annonceTitre">' +
        '<button class="annonce__close" aria-label="' + t.aria + '">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<div class="annonce__visual">' +
          '<img src="' + IMG + '" alt="' + t.alt + '" loading="lazy" />' +
          '<span class="annonce__credit">' + t.credit + '</span>' +
        '</div>' +
        '<div class="annonce__body">' +
          '<span class="annonce__kicker">' + t.kicker + '</span>' +
          '<h2 class="annonce__title" id="annonceTitre">' + p.title + '</h2>' +
          '<p class="annonce__text">' + p.body + '</p>' +
          '<p class="annonce__note">' + t.note + '</p>' +
          '<div class="annonce__actions">' +
            '<button class="annonce__btn">' + t.close + '</button>' +
            '<a class="annonce__link" href="/blog/">' + t.cta + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('annonce--on'); });

    var btnClose = wrap.querySelector('.annonce__close');
    if (btnClose) btnClose.focus();

    function fermer() {
      ecrire(CLE, '1');
      wrap.classList.remove('annonce--on');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        wrap.remove();
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }, 260);
    }
    function onKey(e) { if (e.key === 'Escape') fermer(); }

    wrap.querySelector('.annonce__backdrop').addEventListener('click', fermer);
    btnClose.addEventListener('click', fermer);
    wrap.querySelector('.annonce__btn').addEventListener('click', fermer);
    wrap.querySelector('.annonce__link').addEventListener('click', function () {
      ecrire(CLE, '1');
    });
    document.addEventListener('keydown', onKey);
  }

  setTimeout(afficher, DELAI_POPIN);
})();
