/* Formulaires newsletter des articles (même logique que blog/index.html).
   Deux blocs par article : .article-nl au milieu du texte, .blog-newsletter--article après </article>.
   Chaque formulaire trouve son champ, son bouton et sa note dans son propre bloc. */
(function () {
  document.querySelectorAll('.article-nl, .blog-newsletter--article').forEach(function (block) {
    const form    = block.querySelector('form');
    const emailEl = block.querySelector('input[type="email"]');
    const btn     = block.querySelector('button[type="submit"]');
    const msg     = block.querySelector('.blog-newsletter__note');
    if (!form || !emailEl || !btn) return;
    const label = btn.textContent;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = emailEl.value.trim();
      if (!email) return;
      btn.textContent = '…';
      btn.disabled = true;
      try {
        const r = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!r.ok) throw new Error();
        // Inscrit : on masque les deux formulaires de la page, pas seulement celui utilisé
        document.querySelectorAll('.article-nl form, .blog-newsletter--article form').forEach(function (f) { f.style.display = 'none'; });
        msg.textContent = 'Merci ! Un mail de bienvenue vient de partir.';
        msg.classList.add('blog-newsletter__note--success');
      } catch {
        btn.textContent = label;
        btn.disabled = false;
        msg.textContent = 'Une erreur est survenue. Réessayez.';
      }
    });
  });
})();
