(function () {
  document.currentScript.insertAdjacentHTML('afterend', `
  <nav class="nav" id="nav">
    <a href="/" class="nav__logo">VINYL RUN</a>
    <ul class="nav__links">
      <li><a href="/#inventaire" data-i18n="nav.inventaire">Inventaire</a></li>
      <li class="nav__mag"><a href="/blog/" data-i18n="nav.magazine">Le Magazine</a></li>
      <li><a href="/demande-vinyl" data-i18n="nav.demande">Demande spéciale</a></li>
      <li><a href="/#contact" data-i18n="nav.contact">Contact</a></li>
    </ul>
    <div class="nav__right">
      <a href="https://www.discogs.com/seller/Vinylrun974/profile" target="_blank" rel="noopener" class="nav__cta" data-i18n="nav.boutique">La boutique</a>
      <div class="nav__lang">
        <div class="lang-toggle">
          <button class="lang-btn" data-lang="fr" aria-label="Passer en français"><span class="lang-flag">&#127467;&#127479;</span><span class="lang-text">FR</span></button>
          <button class="lang-btn" data-lang="en" aria-label="Switch to English"><span class="lang-flag">&#127468;&#127463;</span><span class="lang-text">EN</span></button>
        </div>
      </div>
      <button class="nav__burger" id="navBurger" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <div class="nav__mobile" id="navMobile" aria-hidden="true" inert>
    <button class="nav__mobile-close" aria-label="Fermer le menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <ul class="nav__mobile-links">
      <li><a href="/#inventaire" data-i18n="nav.inventaire">Inventaire</a></li>
      <li class="nav__mag"><a href="/blog/" data-i18n="nav.magazine">Le Magazine</a></li>
      <li><a href="/demande-vinyl" data-i18n="nav.demande">Demande sp&#233;ciale</a></li>
      <li><a href="/#contact" data-i18n="nav.contact">Contact</a></li>
    </ul>
    <div class="nav__mobile-lang">
      <div class="lang-toggle">
        <button class="lang-btn" data-lang="fr" aria-label="Passer en fran&#231;ais"><span class="lang-flag">&#127467;&#127479;</span><span class="lang-text">FR</span></button>
        <button class="lang-btn" data-lang="en" aria-label="Switch to English"><span class="lang-flag">&#127468;&#127463;</span><span class="lang-text">EN</span></button>
      </div>
    </div>
  </div>
`);

  // Si la langue effective est EN, le logo et les ancres home pointent vers /en/
  // (langue de la page si imposée par l'URL, sinon préférence stockée, sinon navigateur)
  var effLang = window.VR_PAGE_LANG || localStorage.getItem('vr_lang') ||
    ((navigator.language || '').indexOf('fr') === 0 ? 'fr' : 'en');
  if (effLang === 'en') {
    document.querySelectorAll('.nav__logo, .nav__links a[href^="/#"], .nav__mobile-links a[href^="/#"]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('href').replace(/^\//, '/en/'));
    });
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = this.dataset.lang;
      // Les pages home existent dans les deux langues : on navigue au lieu de traduire en place
      if (window.VR_LANG_URLS && window.VR_LANG_URLS[target] && window.VR_LANG_URLS[target] !== location.pathname) {
        localStorage.setItem('vr_lang', target);
        location.href = window.VR_LANG_URLS[target];
        return;
      }
      if (window.VR_I18N) window.VR_I18N.setLang(target);
    });
  });
})();
