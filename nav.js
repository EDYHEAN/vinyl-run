(function () {
  document.currentScript.insertAdjacentHTML('afterend', `
  <nav class="nav" id="nav">
    <a href="/" class="nav__logo">VINYL RUN</a>
    <ul class="nav__links">
      <li><a href="/#inventaire">Inventaire</a></li>
      <li><a href="/blog/">Le Magazine</a></li>
      <li><a href="/#avis">Avis</a></li>
      <li><a href="/#contact">Contact</a></li>
    </ul>
    <a href="https://www.discogs.com/seller/Vinylrun974/profile" target="_blank" rel="noopener" class="nav__cta">La boutique</a>
    <button class="nav__burger" id="navBurger" aria-label="Menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <div class="nav__mobile" id="navMobile" aria-hidden="true">
    <button class="nav__mobile-close" aria-label="Fermer le menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <ul class="nav__mobile-links">
      <li><a href="/#inventaire">Inventaire</a></li>
      <li><a href="/blog/">Le Magazine</a></li>
      <li><a href="/#avis">Avis</a></li>
      <li><a href="/#contact">Contact</a></li>
      <li><a href="/demande-vinyl">Demande spéciale</a></li>
    </ul>
  </div>
`);
})();
