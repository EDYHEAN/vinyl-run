# Rapport hebdo Vinyl Run : la routine du lundi

Mis en place le 23/11/2026, sur le modèle des rapports NookDex et MyFrenchTool. But : suivre semaine après semaine
le trafic, la newsletter et l'activité de la boutique, et sortir chaque lundi **3 actions chiffrées**. Le mail part à
Johan et à la boutique (vinylrun974@gmail.com) : **Christophe le lit aussi**, il doit comprendre sans jargon.

## La chaîne

1. **Dimanche 20 h 17 UTC**, Action « Chiffres de la semaine » (`.github/workflows/weekly-stats.yml`,
   `weekly-stats.mjs`) : écrit `reports/data/<date>.json` sur main.
2. **Lundi matin**, routine Claude « Rapport hebdo Vinyl Run » (claude.ai/code/routines) : lit ce fichier, suit CE
   document, pousse `reports/<date-du-lundi>.md` + `.html` sur la branche `claude/report-<date-du-lundi>`.
3. Action « Rapport hebdo » (`.github/workflows/weekly-report.yml`) : recopie sur main (auteur Johan), supprime la
   branche, envoie le `.html` via `/api/notify` action `report` (`weekly-report-send.mjs`).
4. **Session locale suivante** : Claude lit le dernier `reports/*.md` et exécute les actions « Claude », avec
   l'accord de Johan pour ce qui se pousse.

`reports/` est dans `.vercelignore` : jamais servi par le site. Le dépôt est **public** : ni email, ni nom de client,
ni chiffre d'affaires dans ces fichiers.

## Le relevé (`reports/data/<date>.json`)

- `site.newsletter` : `total` inscrits de la liste, `newSubscribers` et `newBySource` (7 j), `unsubscribed`
  (approximatif : contacts sortis de la liste et modifiés sur 7 j, le delta de `totalBlacklisted` avec le relevé
  d'avant est plus fiable), `campaigns` (4 dernières : envoyés, ouvertures uniques, clics uniques, désinscriptions).
  Les ouvertures sont gonflées par Apple Mail (préchargement) : juger une campagne sur les **clics**.
- Sources d'inscription (`VR_SOURCE`, suivi depuis le 23/11/2026, tout ce qui est plus ancien = « non suivi ») :
  `home`, `home-en`, `blog`, `article:<slug>#milieu` (encart au milieu du texte), `article:<slug>#fin` (bloc après
  l'article), `club?caisse` (QR du flyer en caisse), `?<src>` = paramètre `?src=` ou `?utm_source=` de l'URL.
- `site.demandesVinyl.requests` : formulaires « demande de vinyle » envoyés (tag Brevo, depuis le 23/11/2026).
- `site.chat` : conversations ouvertes, messages des visiteurs et de la boutique sur 7 j.
- `search` : Google Search Console. `week` vs `before` (7 derniers jours avec données, 2-3 j de retard), requêtes et
  pages de chaque semaine, `queries28` / `pages28` / `countries28` sur ~28 j (`reu` = La Réunion, `fra` = métropole).
- `bing` : trafic jour par jour (depuis le 30/10/2026), top requêtes et pages cumulées, pages indexées.
- `discogs` : `inventory` (annonces en ligne) et `listedWeek` (mises en ligne sur 7 j). Disques sortis de la semaine
  ≈ inventaire du relevé d'avant + mises en ligne − inventaire actuel (ventes ou retraits, ne pas l'appeler « ventes »).

## Procédure de la routine (à suivre dans l'ordre)

### 0. Mise en place
- **La routine tourne sans personne pour valider les permissions** : une commande Bash qui déclenche un prompt
  (accolades + guillemets, heredoc…) bloque tout le rapport (incident MFT du 05/11). Écrire le `.md` et le `.html`
  avec l'outil **Write**, lire le JSON avec **Read** ; Bash seulement pour git et des commandes simples.
- `git checkout main && git pull`. Ne jamais toucher à un fichier hors `reports/` (l'Action refuse la branche sinon).
- Date du rapport = la date du jour (lundi), format `YYYY-MM-DD`.
- Lire le JSON le plus récent de `reports/data/` (le « relevé »), et le précédent s'il existe (le « relevé d'avant »).
- Si le relevé le plus récent a plus de 3 jours : l'Action du dimanche n'a pas tourné. Écrire quand même un rapport
  court qui le dit en tête (« relevé absent, Johan : relancer Actions > Chiffres de la semaine »), avec ce qui reste
  analysable (git log, `newsletter/arrivages.json`), et l'envoyer.
- Un bloc `{ "error": … }` = source en panne : le dire en une ligne dans les périodes et sources, ne rien inventer.

### 1. Le contexte à lire (grep d'abord, pas de lecture intégrale inutile)
- Le rapport précédent `reports/<date>.md` : sa section « Actions », pour juger ce qu'elles ont donné.
- `CLAUDE.md` : règles SEO (title ≤ 62 car., meta 120-160, URLs sans `.html`), sujets d'articles à éviter.
- `rss.xml` : les articles publiés et leur date (le plus récent en tête).
- `newsletter/arrivages.json` et `newsletter/last-send.json` : les nouveautés de la semaine et le dernier mail envoyé.
- `git log main --since="8 days ago" --pretty="%ad %s" --date=short` : ce qui a été publié ou changé.

### 2. L'analyse (les chiffres d'abord, l'interprétation ensuite)

**Newsletter** (le suivi demandé en priorité) :
- Nouveaux inscrits de la semaine, total, désinscrits ; comparer au relevé d'avant (delta de `total`).
- D'où viennent les inscrits (`newBySource`) : quelle page, quel article, l'encart du milieu contre le bloc de fin,
  la caisse (`club?caisse`). Un article qui recrute bien = un sujet à décliner ; le flyer à zéro plusieurs semaines
  de suite = à signaler à Christophe.
- Dernière campagne (`campaigns[0]`) : taux de clic = clics uniques / délivrés. Comparer aux précédentes.

**Google** (`search`) :
- Semaine vs semaine d'avant : clics, impressions. Part La Réunion / métropole (`countries28`).
- Top pages et requêtes de la semaine, ce qui monte ou baisse de plus de 30 % face à la semaine d'avant.
- Presque page 1 : position 5 à 20 avec du volume (`queries28`) = gisement n°1 (enrichir l'article, maillage interne).
- CTR anormal : position ≤ 10 et CTR très bas. **Avant de proposer une réécriture de title**, vérifier
  `git log -S "<bout du title>" -- blog/ index.html` : un title changé il y a moins de 3-4 semaines, on n'y touche pas.
- Les requêtes de marque (« vinyl run », « vinyl run saint pierre ») cliquent déjà : pas une action.

**Boutique** (`discogs`, `site.demandesVinyl`, `site.chat`) :
- Mises en ligne de la semaine, inventaire, disques sortis (estimation, cf. plus haut).
- Demandes de vinyle et conversations chat : volume et tendance.

**Bing et IA** (`bing`) : trafic, requêtes, pages indexées (`crawl.inIndex`). ChatGPT search s'appuie sur l'index
Bing : une page qui monte sur Bing est une page citable.

**Ce que la semaine dernière a donné** : pour chaque action du rapport précédent, dire si elle a été faite (git log)
et ce qu'on en mesure. Honnête sur le délai : un changement de title ou de contenu met 1 à 3 semaines à se voir.

### 3. Les 3 actions (le cœur du rapport)
- **Vérifier dans le code AVANT de proposer** : grep le slug ou le passage visé, une FAQ ou un lien déjà en place
  écarte l'action. Chaque action dit en une demi-phrase ce qui manque réellement.
- **3 maximum**, triées par impact. Chacune : **quoi** (page ou fichier précis), **pourquoi** (le chiffre qui la
  justifie), **qui** : `Christophe` (boutique : mises en ligne Discogs, photos, flyer, réponses chat), `Johan`
  (comptes, réglages, décisions) ou `Claude` (code, contenu, SEO).
- Concrètes et exécutables en une session : « Ajouter une FAQ “platine vinyle Réunion” à /blog/articles/x (pos. 9,
  180 vues, 2 visites) », pas « améliorer le SEO ».
- Interdits (règles projet) : proposer un article sur le zouk, « choisir sa première platine » ou « chiner des
  vinyles à La Réunion » ; une remise ou un cadeau en caisse contre l'inscription (refusé le 02/11) ; retoucher un
  title de moins de 3-4 semaines ; relancer la validation GSC des pages « Explorée non indexée ».

### 4. Écrire les deux fichiers

**`reports/<date>.md`**, le rapport complet (trace et point de départ des sessions locales) :

```
# Rapport hebdo Vinyl Run du <date longue>
<numéro du rapport>. Périodes : Google <from>–<to> vs <from>–<to> (2-3 j de retard GSC) ; newsletter, boutique,
chat = 7 derniers jours ; comparé au relevé du <date du relevé d'avant>. Sources en panne : …

## En bref            (3 à 5 puces, les chiffres qui comptent)
## Actions            (les 3, numérotées, avec Qui / Quoi / Pourquoi)
## Ce que la semaine dernière a donné
## Newsletter         (inscrits par source, désinscrits, campagnes)
## Google             (top pages, top requêtes, movers, presque page 1, CTR anormal, pays)
## Boutique           (Discogs, demandes, chat)
## Bing et IA
## Publié cette semaine
```

**`reports/<date>.html`**, le mail : copier `reports/mail-template.html` et remplir TOUS les champs `{{…}}` (le
script refuse d'envoyer s'il en reste un, commentaires HTML compris : les retirer ou les laisser sans accolades).
Version courte du `.md` : les 4 KPI, les 3 actions, 3-5 puces, les sources d'inscription, 8 lignes Google max, un
paragraphe par section. **Lu surtout sur téléphone** : garder la structure du gabarit (KPI en 2 × 2, actions juste
après les KPI, tableau Google en 3 colonnes avec la position dans la sous-ligne grise `LIGNE_DETAIL`), phrases
courtes, et remplir `APERCU_BOITE_DE_RECEPTION` (la phrase affichée sous l'objet dans la boîte de réception). Le `<title>` est l'objet du mail : court et parlant (« Vinyl Run · semaine du 23 nov. ·
6 inscrits, Google +27 % »). Supprimer un bloc qui n'a rien à dire (et le bloc « semaine dernière » au 1er rapport).
Libellés lisibles pour Christophe : « Encart au milieu de l'article Maloya électronique » plutôt que
`article:maloya-electronique-vinyle-nouvelle-scene#milieu`, « visites » pour les clics, « vues » pour les impressions.

Style : français, phrases déclaratives, chiffres précis (espace insécable avant %, séparateur de milliers
« 2 752 »), **jamais de tiret cadratin**, pas de jargon creux. Ne jamais écrire d'email, de nom de client ni de
chiffre inventé.

### 5. Publier
```
git checkout -b claude/report-<date>
git add reports/<date>.md reports/<date>.html
git -c user.name="Johan TRIGEARD" -c user.email="johan.trigeard@gmail.com" commit -m "docs(report): rapport hebdo <date>"
git push -u origin claude/report-<date>
```
Le push déclenche l'Action qui publie et envoie le mail. Si le push échoue : aucun contournement, le dire dans la
réponse finale de la routine.
