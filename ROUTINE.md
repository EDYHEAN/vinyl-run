# ROUTINE.md — Routine éditoriale Vinyl Run

> Documentation du fonctionnement de la routine de publication d'articles du blog.
> Le prompt exécuté par l'agent vit dans **claude.ai/code → Routines** (pas dans le repo).
> Ce fichier documente l'architecture, les pièges connus et les prérequis plateforme.

## Déclenchement
L'agent se réveille automatiquement (cloud persistent, **claude.ai/code/routines**, repo
`EDYHEAN/vinyl-run`). Il propose 4-5 idées d'articles, **attend la validation** de Johan
(« Go pour l'article X »), rédige et publie en autonomie, puis **attend** « Go pour le mail »
pour déclencher la newsletter.

## Architecture
- **Routine cloud** (claude.ai) → clone le repo via **PAT dans l'URL**, rédige l'article,
  met à jour blog/index.html + rss.xml + sitemap.xml, commit/push sur `main`.
- **Vercel** → chaque push sur `main` redéploie la prod (~1-2 min).
- **GitHub Action `notify.yml`** → envoie la newsletter Brevo. Déclenchée **par le push de
  `newsletter/last-send.json`** (et non automatiquement à la publication), ce qui préserve
  le gate manuel « Go pour le mail ».

## Pièges connus (à ne jamais refaire)

### 1. Toujours cloner — ne jamais utiliser un repo pré-monté
La cause du crash de la session du 2026-06-29 : l'agent a travaillé sur le repo **pré-monté
par Claude Code cloud** (branche `claude/*`, derrière un proxy git **lecture seule**) au lieu
de cloner avec le PAT → `git push` en **403** en cascade, puis acharnement (6 tentatives MCP).
**Le PAT était présent, il ne s'en est jamais servi.**

→ La routine doit **systématiquement** :
```bash
rm -rf /tmp/vinylrun
git clone https://<PAT>@github.com/EDYHEAN/vinyl-run.git /tmp/vinylrun
cd /tmp/vinylrun
```
et travailler **exclusivement** dans `/tmp/vinylrun`. Si un `git push` renvoie 403 → **s'arrêter
et le signaler** (l'étape Setup n'a pas été suivie), ne tenter aucun contournement.

### 2. Pas de réseau pour les images → délégué à un GitHub Action
Le sandbox cloud bloque le scraping Unsplash/Pexels (403) et le `curl` des CDN (000). La
routine ne fait donc **jamais** de WebFetch/curl pour télécharger ou vérifier une image. À la
place (modèle MFT, sans clé API), elle délègue au runner GitHub qui, lui, a le réseau :

1. Dans l'article + og:image + blog/index + RSS, la routine référence des **chemins locaux**
   (`/assets/articles/{slug}/hero.webp`, `hero-thumb.webp` pour la carte mosaïque, `fig-1.webp`,
   `fig-2.webp`…). Ces fichiers n'existent pas encore au moment du push (~30-60s d'images
   manquantes, comblées par l'Action).
2. Elle écrit un récap **`blog/article-images.json`** listant chaque image :
   `{"slug":"...","images":[{"name":"hero","source":"<URL CDN Unsplash/Pexels pertinente>"},…]}`.
   Le `name` doit matcher le nom de fichier local (`hero`, `fig-1`…). La routine peut choisir des
   **IDs frais et pertinents** selon le sujet (sa connaissance suffit) — plus besoin de recycler.
3. Le push de `blog/article-images.json` déclenche [.github/workflows/article-images.yml](.github/workflows/article-images.yml) :
   le runner télécharge chaque `source`, redimensionne (hero 1600px + vignette 600px ; figures
   1200px) et réencode en **WebP** léger (~80-150 Ko), commit dans `assets/articles/{slug}/`.
   Fallback en cascade si une source échoue : image vinyle réseau éprouvée → `assets/mag03.jpg`
   local. Jamais d'image cassée en prod.

Bénéfices : images servies par le domaine (SEO Google Images + perf), poids maîtrisé, `alt`
descriptif obligatoire écrit par la routine dans le HTML (jamais vide), zéro dépendance hotlink.

### 3. Auteur des commits
Les commits de la routine doivent rester **`Vinyl Run Agent <magazine@vinyl-run.com>`**
(`git config user.email "magazine@vinyl-run.com"`). Cet auteur passe le déploiement Vercel
(vérifié sur tout l'historique). **Ne jamais réauteurer en `Claude <noreply@anthropic.com>`**
(risque de blocage déploiement Vercel « GitHub user not found »).

## Newsletter — mécanique du gate manuel
1. À la publication (Étape 4), l'agent ne touche **pas** `newsletter/last-send.json`.
2. Au « Go pour le mail » (Étape 5), l'agent écrit `newsletter/last-send.json`
   (`{"slug":"...","sentAt":"<ISO>"}`) et le pousse sur `main`.
3. Le push matche le path-filter de [.github/workflows/notify.yml](.github/workflows/notify.yml)
   → le workflow appelle `https://www.vinyl-run.com/api/notify` depuis un runner GitHub
   (réseau ouvert) → [api/notify.js](api/notify.js) lit le dernier article du `rss.xml`, crée
   et envoie la campagne Brevo aux abonnés.

Aucun secret ne transite par l'agent : `notify.yml` lit `secrets.NOTIFY_SECRET` (GitHub Actions)
et `api/notify.js` compare à `process.env.NOTIFY_SECRET` (Vercel). **Les deux valeurs doivent
être identiques.**

## Prérequis plateforme (configurés hors repo)
- **PAT fine-grained** (https://github.com/settings/tokens) sur `EDYHEAN/vinyl-run`,
  permission **`Contents: Read and write`** uniquement (le push direct sur `main` et le
  trigger newsletter n'ont besoin de rien d'autre). Injecté dans l'environnement de la
  routine claude.ai (jamais dans le repo, jamais dans le chat). Expiration à surveiller :
  à expiration, la routine casse silencieusement (retour du 403).
- **`NOTIFY_SECRET`** : même valeur dans Vercel (Environment Variables) **et** GitHub
  (Settings → Secrets → Actions). À faire tourner si la valeur a fuité.
- **`BREVO_API_KEY`** : variable d'env Vercel (consommée par `api/notify.js`).
- **`VERCEL_DEPLOY_HOOK`** : GitHub Actions secret = URL d'un Deploy Hook Vercel (Vercel →
  Settings → Git → Deploy Hooks, branche `main`). Indispensable : le commit d'images de
  `article-images.yml` est poussé par `github-actions[bot]`, ce qui **ne déclenche pas** de
  déploiement Vercel. L'Action appelle ce hook pour forcer le redéploiement, sinon les images
  restent en 404 jusqu'au prochain push d'un utilisateur réel (incident du 2026-06-29).

## Référence
Les règles éditoriales détaillées (style anti-cadratin, auteur Person E-E-A-T, URLs
extensionless, pattern photos, checklist publication) sont dans [CLAUDE.md](CLAUDE.md).
