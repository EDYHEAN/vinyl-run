/* Formulaire newsletter des articles (même logique que blog/index.html).
   Le bloc HTML est dans chaque article, juste après </article>. */
(function () {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  const emailEl = document.getElementById('newsletterEmail');
  const btn     = document.getElementById('newsletterBtn');
  const msg     = document.getElementById('newsletterMsg');

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
      if (r.ok) {
        form.style.display = 'none';
        msg.textContent = 'Merci ! Vérifiez votre boîte mail pour confirmer.';
        msg.classList.add('blog-newsletter__note--success');
      } else {
        btn.textContent = "S'inscrire";
        btn.disabled = false;
        msg.textContent = 'Une erreur est survenue. Réessayez.';
      }
    } catch {
      btn.textContent = "S'inscrire";
      btn.disabled = false;
      msg.textContent = 'Une erreur est survenue. Réessayez.';
    }
  });
})();
