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

### 2. Pas de réseau pour les images
Le sandbox cloud bloque le scraping Unsplash/Pexels (403) et le `curl` des CDN (000). La
routine ne doit **jamais** faire de WebFetch/curl pour découvrir ou vérifier un ID d'image.
Méthode autorisée : réutiliser les IDs déjà présents dans les articles en prod (rendu garanti),
ou un ID connu au **format complet** (`photo-XXXXXXXX-XXXXXXXXXXXX` pour Unsplash). En cas de
doute sur le rendu → réutiliser un ID déjà en prod.

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

## Référence
Les règles éditoriales détaillées (style anti-cadratin, auteur Person E-E-A-T, URLs
extensionless, pattern photos, checklist publication) sont dans [CLAUDE.md](CLAUDE.md).
