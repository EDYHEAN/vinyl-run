# ROUTINE.md — Routine éditoriale Vinyl Run

> Documentation du fonctionnement de la routine de publication d'articles du blog.
> Le prompt exécuté par l'agent vit dans **claude.ai/code → Routines** (pas dans le repo).
> Ce fichier documente l'architecture, les pièges connus et les prérequis plateforme.

## Déclenchement
L'agent se réveille automatiquement le **lundi à 4h UTC** (8h à La Réunion ; cloud persistent,
**claude.ai/code/routines**, repo `EDYHEAN/vinyl-run`). Il propose 4-5 idées d'articles,
**attend la validation** de Johan (« Go pour l'article X »), rédige et publie en autonomie,
construit le mail hebdo (article + nouveautés en bac) et en donne l'**aperçu**, puis **attend**
« Go pour le mail » pour l'envoyer. Le mail part le lundi matin.

## Architecture
- **Routine cloud** (claude.ai) → travaille dans le repo pré-monté, rédige l'article, met à jour
  blog/index.html + rss.xml + sitemap.xml + llms.txt, construit le mail, pousse une branche
  **`claude/*`** (seul préfixe autorisé par le proxy git de la plateforme ; **aucun token**
  depuis le 14/07/2026, ne jamais en remettre dans les instructions).
- **GitHub Action `publish-routine.yml`** → squash-merge la branche `claude/*` sur `main`
  (trigger : la branche touche `blog/article-images.json`, `newsletter/mail.json` ou
  `newsletter/last-send.json`), supprime la branche, puis dispatch `article-images.yml` ou
  `notify.yml` (un push fait avec GITHUB_TOKEN ne déclenche pas les `on: push`).
- **Vercel** → chaque push sur `main` redéploie la prod (~1-2 min). `vercel.json`
  (`ignoreCommand`) coupe les déploiements Preview des branches `claude/*`.
- **GitHub Action `arrivages.yml`** → lundi 01:00 UTC, écrit `newsletter/arrivages.json`
  (annonces Discogs des 7 derniers jours) avant le réveil de la routine.
- **GitHub Action `notify.yml`** → envoie le mail validé via Brevo, au push de
  `newsletter/last-send.json`.

## Pièges connus (à ne jamais refaire)

### 1. Pousser uniquement sur une branche `claude/*`
Le proxy git de la plateforme refuse tout push hors `claude/*` (403). La routine pousse
`claude/blog-{slug}` (article + aperçu du mail) puis `claude/newsletter-{slug}` (« Go pour le
mail »). Si un `git push` renvoie 403 → **s'arrêter et le signaler**, ne tenter aucun
contournement (pas de token, pas de push sur `main`).

Si un article a été poussé mais que rien n'arrive en prod : onglet Actions de GitHub, vérifier
que `publish-routine.yml` a tourné (la branche doit toucher un des fichiers trigger) et que le
squash-merge n'a pas conflit ; sinon merger la branche à la main.

### 2. Pas de réseau → images et données Discogs déléguées aux GitHub Actions
Le sandbox cloud bloque le scraping Unsplash/Pexels (403), le `curl` des CDN (000) et les API
(Discogs comprise). La routine ne fait donc **jamais** de WebFetch/curl. À la place, elle délègue
au runner GitHub qui, lui, a le réseau :

**Images** (modèle MFT, sans clé API côté routine) :
1. Dans l'article + og:image + blog/index + RSS, la routine référence des **chemins locaux**
   (`/assets/articles/{slug}/hero.webp`, `hero-thumb.webp` pour la carte mosaïque, `fig-1.webp`,
   `fig-2.webp`…). Ces fichiers n'existent pas encore au moment du push (~30-60s d'images
   manquantes, comblées par l'Action).
2. Elle écrit un récap **`blog/article-images.json`** listant chaque image avec une **requête**
   de recherche (mots-clés EN, spécifiques au sujet) :
   `{"slug":"...","images":[{"name":"hero","query":"vinyl record gatefold sleeve"},{"name":"fig-1","query":"..."}]}`.
   Le `name` matche le nom de fichier local (`hero`, `fig-1`…). (Une entrée peut aussi porter
   `"source":"<URL directe>"` au lieu de `query` si on veut imposer une image précise.)
3. [.github/workflows/article-images.yml](.github/workflows/article-images.yml) : pour chaque
   `query`, le runner **cherche sur l'API Pexels** et prend le 1er résultat **absent de
   `blog/used-images.json`** (registre des IDs déjà utilisés → nouveauté garantie), puis
   redimensionne et réencode : hero → `hero.webp` (1600, page) + `hero-thumb.webp` (600, carte)
   + `hero.jpg` (1600, **og:image + enclosure RSS + mail**, car le WebP ne s'affiche pas dans
   Outlook ni chez certains scrapers sociaux) ; figures → `fig-N.webp` (1200). Commit dans
   `assets/articles/{slug}/`. Fallback en cascade : image vinyle réseau éprouvée →
   `assets/mag03.jpg` local. Jamais d'image cassée en prod.

**Nouveautés Discogs** : `arrivages.yml` lance [fetch-arrivages.js](fetch-arrivages.js) le lundi
01:00 UTC, qui passe par `/api/discogs` (proxy Vercel authentifié) et écrit
`newsletter/arrivages.json`. La routine ne fait que **lire** ce fichier.

### 3. Auteur des commits
Les commits poussés sur `main` doivent avoir pour auteur un **membre de l'équipe Vercel**
(`johan.trigeard@gmail.com`), sinon le déploiement est bloqué (« GitHub user not found »,
images 404 : incident du 2026-06-29). `publish-routine.yml`, `article-images.yml` et
`arrivages.yml` commitent tous sous cet auteur. **Ne jamais réauteurer en
`Claude <noreply@anthropic.com>`** ni en `magazine@vinyl-run.com`.

## Newsletter hebdo — article + nouveautés en bac

Un seul mail par semaine, le lundi matin (promesse des formulaires : « une fois par semaine,
pas plus »). Il contient l'article de la semaine et, si la semaine a eu **au moins 2
nouveautés** sur Discogs, un bloc de **4 nouveautés maximum** (toutes si moins de 4) choisies par la routine.

1. **Construction** (Étape 4, dans la même branche que l'article, **après** la mise à jour de
   `rss.xml`) : la routine lit `newsletter/arrivages.json`, choisit jusqu'à 4 annonces (variété de
   formats et de prix, en priorité les disques péi / Océan Indien et les raretés), écrit
   `newsletter/mail.json` :
   ```json
   { "slug": "<slug-article>", "intro": "<une phrase sur l'arrivage>", "arrivages": [<jusqu'à 4 ids Discogs>] }
   ```
   puis lance `node newsletter-build.js`, qui produit `newsletter/mail.html` + `mail.txt` à
   partir d'un gabarit fixe (la routine n'écrit jamais le HTML à la main). Règles appliquées par
   le script : bloc omis si moins de 2 nouveautés ou si `arrivages.json` date de plus de 8
   jours ; sélection complétée par les plus chères si des ids manquent. `intro` est facultatif
   (pas de tiret cadratin).
2. **Aperçu** : après le merge et le déploiement, la routine donne le lien
   **https://www.vinyl-run.com/newsletter/mail** (rendu exact du mail, `noindex`) et colle la
   sortie de `newsletter-build.js` (objet + liste des disques). Si Johan demande une
   correction : modifier `mail.json`, relancer le script, pousser une branche
   `claude/newsletter-preview-{slug}` (le changement de `mail.json` suffit à déclencher le merge).
3. **Envoi** (Étape 5, « Go pour le mail ») : la routine écrit `newsletter/last-send.json`
   (`{"slug":"...","sentAt":"<ISO>"}`) et le pousse sur `claude/newsletter-{slug}`.
   `publish-routine.yml` merge puis dispatch [notify.yml](.github/workflows/notify.yml), qui
   envoie **tel quel** `newsletter/mail.html` à [api/notify.js](api/notify.js) (si sa meta
   `vr-slug` correspond au slug de `last-send.json`) → campagne Brevo aux abonnés.
   Sinon, repli sur l'ancien mail « article seul » construit depuis `rss.xml`.

Aucun secret ne transite par l'agent : `notify.yml` lit `secrets.NOTIFY_SECRET` (GitHub Actions)
et `api/notify.js` compare à `process.env.NOTIFY_SECRET` (Vercel). **Les deux valeurs doivent
être identiques.**

## Prérequis plateforme (configurés hors repo)
- **`NOTIFY_SECRET`** : même valeur dans Vercel (Environment Variables) **et** GitHub
  (Settings → Secrets → Actions). À faire tourner si la valeur a fuité.
- **`BREVO_API_KEY`** : variable d'env Vercel (consommée par `api/notify.js`).
- **`DISCOGS_TOKEN`** : variable d'env Vercel (consommée par `api/discogs.js`, donc aussi par
  `fetch-arrivages.js`). Sans lui, l'API Discogs ne renvoie pas les images des disques.
- **`PEXELS_API_KEY`** : GitHub Actions secret = clé API Pexels gratuite (https://www.pexels.com/api/).
  Consommée par `article-images.yml`. Sans elle, l'Action retombe sur les fallbacks.

## Référence
Les règles éditoriales détaillées (style anti-cadratin, auteur Person E-E-A-T, URLs
extensionless, pattern photos, checklist publication) sont dans [CLAUDE.md](CLAUDE.md).
