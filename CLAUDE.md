# CLAUDE.md — Vinyl Run

## Projet
Site vitrine pour **Vinyl Run**, disquaire indépendant basé à Saint-Pierre, La Réunion.
Fondé en 2016. Vend des vinyles neufs, d'occasion et des raretés.

## Stack
- HTML/CSS vanilla — pas de framework, pas de build tool
- Un seul fichier `index.html` + `style.css`
- Assets dans `assets/`

## Hébergement & déploiement
- Hébergé sur **Vercel** (live depuis le 2026-04-29)
- Repo GitHub : https://github.com/EDYHEAN/vinyl-run
- **Chaque push sur `main` = mise à jour immédiate en production**
- Travailler depuis plusieurs machines → toujours faire un `git pull` avant de commencer

## Design system
- Thème dark, ambiance "Sonic Volcano"
- Couleurs CSS variables dans `:root` (style.css:6)
  - `--bg: #111110` / `--ink: #f0ede6` / `--accent: #EDF10C` (jaune néon)
- Typos : **Space Grotesk** (sans-serif) + **Bodoni Moda** (serif) — Google Fonts
- Animations SVG inline (île La Réunion, anneaux vinyle, filtre turbulence)

## Sections
- `#hero` — split gauche/droite, logo SVG, île animée
- `#notre-univers` — présentation du shop
- `#avis` — avis clients
- `#contact` — carte + infos

## Boutique externe
La boutique est sur Discogs : https://www.discogs.com/seller/Vinylrun974/profile
