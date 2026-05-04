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

## Pattern photos articles (Unsplash/Pexels, pas de stockage local)

**Hero plein écran** (entre `article-divider` et `article-body`) :
```html
<div class="article-hero-img">
  <img src="https://images.unsplash.com/photo-{ID}?w=1400&auto=format&fit=crop&q=80"
       alt="..." loading="eager" />
</div>
```

**Figure inline** (entre sections) :
```html
<figure class="article-figure">
  <img src="https://images.unsplash.com/photo-{ID}?w=900&auto=format&fit=crop&q=80"
       alt="..." loading="lazy" />
  <figcaption>Photo : Prénom Nom / Unsplash</figcaption>
</figure>
```

**Thumbnail card** (premier enfant d'un `.article-card`) :
```html
<div class="article-card__img">
  <img src="https://images.unsplash.com/photo-{ID}?w=600&auto=format&fit=crop&q=80"
       alt="..." loading="lazy" />
</div>
```

Pour trouver l'ID CDN : récupérer la balise `og:image` sur `unsplash.com/photos/{slug}`.
