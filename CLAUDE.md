# CLAUDE.md — Vinyl Run

## Projet
Site vitrine + blog magazine pour **Vinyl Run**, disquaire indépendant basé à Saint-Pierre, La Réunion.
Fondé en **2017**. Vend des vinyles neufs, d'occasion et des raretés.
Boutique externe : https://www.discogs.com/seller/Vinylrun974/profile

## Stack
- HTML/CSS vanilla — pas de framework, pas de build tool
- `index.html` + `style.css` (site principal)
- `blog/index.html`, `blog/blog.css`, `blog/coming-soon.html`
- `blog/articles/*.html` — articles individuels
- `api/subscribe.js` — endpoint Vercel pour newsletter Brevo
- Assets dans `assets/`

## Hébergement & déploiement
- Hébergé sur **Vercel** (live depuis le 2026-04-29)
- Repo GitHub : https://github.com/EDYHEAN/vinyl-run
- **Chaque push sur `main` = mise à jour immédiate en production**
- Travailler depuis plusieurs machines → toujours faire un `git pull` avant de commencer

## Design system
- Thème dark, ambiance "Sonic Volcano"
- Couleurs CSS variables dans `:root` (style.css)
  - `--bg: #111110` / `--ink: #f0ede6` / `--accent: #EDF10C` (jaune néon)
- Typos : **Space Grotesk** (sans-serif) + **Bodoni Moda** (serif italic) — Google Fonts

## Structure blog
- `/blog/` — listing avec hero article à la une (image dans `.blog-hero__visual`) + mosaic cards
- `/blog/articles/` — articles individuels
- Mettre à jour le lien + l'image du hero dans `blog/index.html` à chaque nouvel article à la une

## Pattern photos articles (Unsplash / Pexels, pas de stockage local)

Deux sources autorisées : **Unsplash** et **Pexels**. Choisir selon la disponibilité du sujet.

### Unsplash

**Hero plein écran** :
```html
<div class="article-hero-img">
  <img src="https://images.unsplash.com/photo-{ID}?w=1400&auto=format&fit=crop&q=80"
       alt="..." loading="eager" />
</div>
```

**Figure inline** :
```html
<figure class="article-figure">
  <img src="https://images.unsplash.com/photo-{ID}?w=900&auto=format&fit=crop&q=80"
       alt="..." loading="lazy" />
  <figcaption>Photo : Prénom Nom / Unsplash</figcaption>
</figure>
```

**Thumbnail card** :
```html
<div class="article-card__img">
  <img src="https://images.unsplash.com/photo-{ID}?w=600&auto=format&fit=crop&q=80"
       alt="..." loading="lazy" />
</div>
```

Pour trouver l'ID CDN : récupérer la balise `og:image` sur `unsplash.com/photos/{slug}`.
**L'ID complet a toujours deux parties** : `photo-XXXXXXXX-XXXXXXXXXXXX` (ex: `photo-1537829382363-dfe2e5e72d36`). Ne jamais utiliser un ID tronqué à une seule partie — l'image ne s'affichera pas.

### Pexels

L'ID est un nombre visible dans l'URL de la photo (ex: `pexels.com/photo/titre-1234567/` → ID = `1234567`).

**Hero plein écran** :
```html
<div class="article-hero-img">
  <img src="https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=1400&fit=crop"
       alt="..." loading="eager" />
</div>
```

**Figure inline** :
```html
<figure class="article-figure">
  <img src="https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=900&fit=crop"
       alt="..." loading="lazy" />
  <figcaption>Photo : Prénom Nom / Pexels</figcaption>
</figure>
```

**Thumbnail card** :
```html
<div class="article-card__img">
  <img src="https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop"
       alt="..." loading="lazy" />
</div>
```

## SEO — Règles canoniques obligatoires

Le domaine primaire est **`www.vinyl-run.com`**. Dans chaque fichier HTML :
- `<link rel="canonical">` → toujours `https://www.vinyl-run.com/...`
- `<meta property="og:url">` → toujours `https://www.vinyl-run.com/...`
- `<meta property="og:image">` → toujours `https://www.vinyl-run.com/...`
- JSON-LD (`url`, `author.url`, `publisher.url`) → toujours `https://www.vinyl-run.com/...`

Ne jamais utiliser `https://vinyl-run.com/...` (sans www) — Google marquerait la page comme doublon et ne l'indexerait pas.

**URLs sans extension `.html`** : `cleanUrls` est actif sur Vercel — les URLs `.html` redirigent en 308 vers les URLs propres. Toute URL publique (canonical, og:url, JSON-LD, sitemap, RSS link/guid, liens internes) doit être **sans `.html`** : `https://www.vinyl-run.com/blog/articles/[slug]`. Un canonical en `.html` pointe vers un redirect → Google marque la page "Autre page avec balise canonique correcte" et ne l'indexe pas (bug GSC corrigé le 2026-06-12). Les liens internes relatifs aussi : `href="nom-article"`, `href="/demande-vinyl"`, `href="/#inventaire"`.

## Home EN (`/en/`)

`en/index.html` est une copie statique de `index.html` avec les textes EN bakés (dictionnaire de `i18n.js`).
- **Ne jamais l'éditer à la main** : après toute modification de `index.html`, régénérer avec `node bake-en.js` et commiter le résultat.
- Langue déterministe par URL : `window.VR_PAGE_LANG` (`'fr'` sur `/`, `'en'` sur `/en/`) est prioritaire sur la détection navigateur (`i18n.js`). Le toggle FR/EN navigue entre `/` et `/en/` sur les homes (via `window.VR_LANG_URLS` dans `nav.js`) ; sur le blog et demande-vinyl il traduit en place comme avant.
- hreflang croisés (`fr`, `en`, `x-default`) sur les deux homes. `/en/` est dans le sitemap.

## Sujets d'articles — À éviter

- **Zouk** — hors scope éditorial de Vinyl Run

## Checklist publication article

Avant tout push d'un nouvel article :
1. `class="hellobar-off"` sur le `<body>`
2. Canonical + og:url + og:image + JSON-LD → tous en `https://www.vinyl-run.com/...` **sans extension `.html`**
3. IDs Unsplash complets (format `photo-XXXXXXXX-XXXXXXXXXXXX`)
4. Mettre à jour `blog/index.html` (hero + card mosaïque en premier dans la grille, liens sans `.html`)
5. Mettre à jour `rss.xml`
6. Mettre à jour `sitemap.xml`
