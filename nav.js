(function () {
  document.currentScript.insertAdjacentHTML('afterend', `
  <nav class="nav" id="nav">
    <a href="/" class="nav__logo">VINYL RUN</a>
    <ul class="nav__links">
      <li><a href="/#inventaire" data-i18n="nav.inventaire">Inventaire</a></li>
      <li class="nav__mag"><a href="/blog/" data-i18n="nav.magazine">Le Magazine</a></li>
      <li><a href="/#avis" data-i18n="nav.avis">Avis</a></li>
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

  <div class="nav__mobile" id="navMobile" aria-hidden="true">
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

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.VR_I18N) window.VR_I18N.setLang(this.dataset.lang);
    });
  });
})();
