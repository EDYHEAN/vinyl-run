(function () {
  var T = {
    fr: {
      'meta.title': 'VINYL RUN — Disquaire indépendant · Saint-Pierre, La Réunion',
      'nav.inventaire': 'Inventaire',
      'nav.magazine': 'Le Magazine',
      'nav.avis': 'Avis',
      'nav.contact': 'Contact',
      'nav.boutique': 'La boutique',
      'nav.demande': 'Demande spéciale',
      'hero.eyebrow': 'Disquaire indépendant · Saint-Pierre, La Réunion',
      'hero.sub': 'Vinyles neufs, occasions &amp; raretés.<br>Une sélection à la main depuis 2017.',
      'hero.cta.shop': 'Explorer le shop',
      'hero.cta.find': 'Nous trouver',
      'univers.label': 'Notre univers',
      'univers.heading': "Ce qu'on trouve chez VINYL RUN",
      'univers.sub': "Un espace pensé pour les amoureux du son analogique. Pas un supermarché — une sélection, une passion, une conversation.",
      'cat.01.title': 'Vinyles Neufs',
      'cat.01.desc': "Les grandes sorties, les rééditions essentielles. Du rock au jazz, du reggae à l'électronique — sélectionnés à la main.",
      'cat.02.title': 'Musiques Océan Indien',
      'cat.02.desc': 'Le plus grand choix de musiques de la zone océan indien, en vinyles, disponibles dès leur sortie nationale.',
      'cat.03.title': 'Occasions &amp; Raretés',
      'cat.03.desc': 'Des pressings introuvables, des pépites de collection. Le fond de caisse qui change chaque semaine.',
      'cat.04.title': 'Imports &amp; Exclusivités',
      'cat.04.desc': "Des éditions limitées, des imports directs. Ce qu'on ne trouve nulle part ailleurs sur l'île.",
      'cat.05.title': 'Expédition Mondiale',
      'cat.05.desc': "Vinyl Run expédie ses vinyles partout dans le monde. Chaque commande préparée et envoyée par Christophe, directement depuis Saint-Pierre de La Réunion.",
      'hellobar.desk': 'Vinyl Run expédie dans le monde entier',
      'hellobar.mob': 'Expédition mondiale disponible',
      'boutique.label': 'La boutique',
      'boutique.heading': "L'expérience en magasin",
      'boutique.intro': "Vinyl Run ce n'est pas juste acheter un disque. C'est une heure passée à fouiller, écouter, découvrir. Notre équipe connaît chaque sillon.",
      'boutique.feat1': "<strong>Station d'écoute</strong> — Testez avant d'acheter. Platine disponible en boutique.",
      'boutique.feat2': "<strong>Conseil personnalisé</strong> — Dites-nous ce que vous aimez, on trouve.",
      'boutique.feat3': "<strong>Commande spéciale</strong> — Un vinyle introuvable ? On s'en occupe.",
      'inventaire.label': 'En vente sur Discogs',
      'inventaire.heading': "L'inventaire",
      'inventaire.sub.suffix': ' références disponibles · mis à jour en temps réel',
      'inventaire.placeholder': 'Rechercher artiste, titre, format…',
      'inventaire.loading': "Chargement de l'inventaire…",
      'inventaire.hint': 'Vous ne trouvez pas le vinyle que vous cherchez ? <a href="tel:+262692441388">Appelez-nous</a>',
      'inventaire.more': 'Voir plus',
      'inventaire.all': "Tout l'inventaire",
      'avis.label': 'Ils en parlent',
      'avis.heading': 'Avis clients',
      'equipe.label': 'Derrière le comptoir',
      'equipe.heading': "L'équipe",
      'equipe.sub': 'Deux passionnés, une boutique, dix ans de disques.',
      'equipe.christophe.role': 'Fondateur · Disquaire',
      'equipe.christophe.bio': "À l'origine de Vinyl Run depuis 2017. Il connaît chaque sillon, chaque pressage. C'est lui qui déniche les raretés et négocie les imports introuvables sur l'île.",
      'equipe.rolande.role': 'Co-fondatrice · Conseil',
      'equipe.rolande.bio': "L'oreille fine de la boutique. Rolande écoute tout, conseille juste. Si vous ne savez pas quoi chercher, elle trouve à votre place — et elle tombe rarement à côté.",
      'contact.label': 'Contact',
      'contact.adresse': 'Adresse',
      'contact.horaires': "Horaires d'écoute",
      'contact.horaires.val': 'Mar – Ven : 10h–13h · 14h–18h<br>Samedi : 10h–18h<br><span style="color:var(--ink-muted)">Dim &amp; Lun : Fermé</span>',
      'contact.joindre': 'Nous joindre',
      'contact.trouver': 'Retrouvez-nous',
      'newsletter.label': 'Newsletter',
      'newsletter.heading': 'Chaque article,<br>directement dans votre boîte',
      'newsletter.sub': "Nouveautés, coups de cœur, arrivages — une fois par semaine, pas plus.<br>Pas de spam, désabonnement en un clic.",
      'newsletter.placeholder': 'votre@email.com',
      'newsletter.btn': "S'inscrire",
      'footer.copy': '© 2026 Vinyl Run · Saint-Pierre, La Réunion',
      'wishlist.tip': 'Vous cherchez un vinyle ?',
      'wl.hero.label': 'Demande spéciale',
      'wl.hero.title': 'Vous cherchez un vinyle<br>en particulier ?',
      'wl.hero.sub': "Décrivez-nous ce que vous recherchez. On fouille nos réseaux, nos fournisseurs et on vous rappelle pour affiner la demande.",
      'wl.section.contact': 'Vos coordonnées',
      'wl.nom.label': 'Prénom / Nom',
      'wl.nom.placeholder': 'Jean Dupont',
      'wl.tel.label': 'Téléphone',
      'wl.email.optional': '(facultatif)',
      'wl.album.optional': '(si connu)',
      'wl.section.vinyl': 'Le vinyle recherché',
      'wl.artiste.label': 'Artiste / Groupe',
      'wl.album.label': "Titre de l'album",
      'wl.format.label': 'Format',
      'wl.format.any': 'Peu importe',
      'wl.genre.label': 'Genre',
      'wl.etat.label': 'État recherché',
      'wl.etat.any': 'Peu importe',
      'wl.etat.new': 'Neuf',
      'wl.etat.used': 'Occasion (bon état)',
      'wl.message.label': 'Précisions',
      'wl.message.placeholder': 'Budget max, édition particulière, pressage original, couleur du vinyle…',
      'wl.ok': 'Demande envoyée — on vous rappelle dès que possible.',
      'wl.err': 'Une erreur est survenue, veuillez réessayer.',
      'wl.submit': 'Envoyer la demande',
      'wl.required': 'Champs marqués * obligatoires. Recontact par téléphone uniquement.'
    },
    en: {
      'meta.title': 'VINYL RUN — Independent Record Shop · Saint-Pierre, Réunion',
      'nav.inventaire': 'Inventory',
      'nav.magazine': 'The Magazine',
      'nav.avis': 'Reviews',
      'nav.contact': 'Contact',
      'nav.boutique': 'The shop',
      'nav.demande': 'Special request',
      'hero.eyebrow': 'Independent record shop · Saint-Pierre, Réunion',
      'hero.sub': 'New, used &amp; rare vinyl.<br>Handpicked since 2017.',
      'hero.cta.shop': 'Explore the shop',
      'hero.cta.find': 'Find us',
      'univers.label': 'Our world',
      'univers.heading': "What you'll find at VINYL RUN",
      'univers.sub': 'A space designed for analog sound lovers. Not a superstore — a selection, a passion, a conversation.',
      'cat.01.title': 'New Vinyl',
      'cat.01.desc': "Major releases, essential reissues. From rock to jazz, reggae to electronic — all handpicked.",
      'cat.02.title': 'Indian Ocean Music',
      'cat.02.desc': 'The widest selection of Indian Ocean music on vinyl, available from their national release date.',
      'cat.03.title': 'Used &amp; Rarities',
      'cat.03.desc': 'Hard-to-find pressings, collector gems. A constantly changing selection.',
      'cat.04.title': 'Imports &amp; Exclusives',
      'cat.04.desc': "Limited editions, direct imports. What you won't find anywhere else on the island.",
      'cat.05.title': 'Worldwide Shipping',
      'cat.05.desc': "Vinyl Run ships records worldwide. Every order packed and sent by Christophe, directly from Saint-Pierre, Réunion.",
      'hellobar.desk': 'Vinyl Run ships worldwide',
      'hellobar.mob': 'Worldwide shipping available',
      'boutique.label': 'The shop',
      'boutique.heading': 'The in-store experience',
      'boutique.intro': "Vinyl Run isn't just about buying a record. It's an hour spent digging, listening, discovering. Our team knows every groove.",
      'boutique.feat1': '<strong>Listening station</strong> — Try before you buy. Turntable available in store.',
      'boutique.feat2': "<strong>Personal advice</strong> — Tell us what you love, we'll find it.",
      'boutique.feat3': "<strong>Special orders</strong> — Can't find a record? We'll take care of it.",
      'inventaire.label': 'For sale on Discogs',
      'inventaire.heading': 'Inventory',
      'inventaire.sub.suffix': ' records available · updated in real time',
      'inventaire.placeholder': 'Search artist, title, format…',
      'inventaire.loading': 'Loading inventory…',
      'inventaire.hint': "Can't find the vinyl you're looking for? <a href=\"tel:+262692441388\">Call us</a>",
      'inventaire.more': 'See more',
      'inventaire.all': 'Full inventory',
      'avis.label': 'What they say',
      'avis.heading': 'Customer reviews',
      'equipe.label': 'Behind the counter',
      'equipe.heading': 'The team',
      'equipe.sub': 'Two passionate music lovers, one shop, ten years of records.',
      'equipe.christophe.role': 'Founder · Record dealer',
      'equipe.christophe.bio': "Behind Vinyl Run since 2017. He knows every groove, every pressing. He's the one who hunts down rarities and negotiates direct imports you can't find on the island.",
      'equipe.rolande.role': 'Co-founder · Advisor',
      'equipe.rolande.bio': "The shop's finest ear. Rolande listens to everything, advises with precision. If you don't know what you're looking for, she'll find it for you — and she rarely misses.",
      'contact.label': 'Contact',
      'contact.adresse': 'Address',
      'contact.horaires': 'Opening hours',
      'contact.horaires.val': 'Tue – Fri: 10am–1pm · 2pm–6pm<br>Saturday: 10am–6pm<br><span style="color:var(--ink-muted)">Sun &amp; Mon: Closed</span>',
      'contact.joindre': 'Get in touch',
      'contact.trouver': 'Find us online',
      'newsletter.label': 'Newsletter',
      'newsletter.heading': 'Every article,<br>straight to your inbox',
      'newsletter.sub': 'New arrivals, favourites, highlights — once a week, no more.<br>No spam, unsubscribe in one click.',
      'newsletter.placeholder': 'your@email.com',
      'newsletter.btn': 'Subscribe',
      'footer.copy': '© 2026 Vinyl Run · Saint-Pierre, Réunion',
      'wishlist.tip': 'Looking for a vinyl?',
      'wl.hero.label': 'Special request',
      'wl.hero.title': 'Looking for a specific<br>vinyl record?',
      'wl.hero.sub': "Tell us what you're looking for. We'll search our network and suppliers, then call you to refine your request.",
      'wl.section.contact': 'Your details',
      'wl.nom.label': 'First / Last name',
      'wl.nom.placeholder': 'John Smith',
      'wl.tel.label': 'Phone',
      'wl.email.optional': '(optional)',
      'wl.album.optional': '(if known)',
      'wl.section.vinyl': "The vinyl you're looking for",
      'wl.artiste.label': 'Artist / Band',
      'wl.album.label': 'Album title',
      'wl.format.label': 'Format',
      'wl.format.any': 'Any',
      'wl.genre.label': 'Genre',
      'wl.etat.label': 'Condition',
      'wl.etat.any': 'Any',
      'wl.etat.new': 'New',
      'wl.etat.used': 'Used (good condition)',
      'wl.message.label': 'Additional info',
      'wl.message.placeholder': 'Max budget, specific edition, original pressing, vinyl colour…',
      'wl.ok': "Request sent — we'll call you back as soon as possible.",
      'wl.err': 'An error occurred, please try again.',
      'wl.submit': 'Send request',
      'wl.required': 'Fields marked * are required. We will contact you by phone only.'
    }
  };

  function getLang() {
    var s = localStorage.getItem('vr_lang');
    if (s === 'fr' || s === 'en') return s;
    return (navigator.language || '').startsWith('fr') ? 'fr' : 'en';
  }

  function applyLang(lang, persist) {
    if (lang !== 'fr' && lang !== 'en') lang = 'fr';
    if (persist !== false) localStorage.setItem('vr_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('lang-en', lang === 'en');
    if (T[lang]['meta.title']) document.title = T[lang]['meta.title'];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (T[lang][k] !== undefined) el.textContent = T[lang][k];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (T[lang][k] !== undefined) el.innerHTML = T[lang][k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-placeholder');
      if (T[lang][k] !== undefined) el.placeholder = T[lang][k];
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === lang);
    });
  }

  // VR_PAGE_LANG : langue imposée par l'URL (/ = fr, /en/ = en) — prioritaire sur la détection,
  // mais sans écraser la préférence stockée : seul un clic sur le toggle persiste un choix
  var lang = window.VR_PAGE_LANG || getLang();
  applyLang(lang, !window.VR_PAGE_LANG);

  window.VR_I18N = { setLang: applyLang, getLang: getLang };
})();
