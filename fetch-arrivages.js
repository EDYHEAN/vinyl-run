#!/usr/bin/env node
/* Récupère les annonces Discogs mises en vente ces 7 derniers jours et les écrit dans
   newsletter/arrivages.json (lu par newsletter-build.js pour le bloc "Nouveautés en bac").

   Lancé chaque lundi matin par .github/workflows/arrivages.yml (le sandbox de la routine
   n'a pas le réseau). Passe par /api/discogs (proxy Vercel, déjà authentifié par le token
   Discogs, tri par date de mise en vente) : sans token, l'API publique ne renvoie pas les images.

   En cas d'erreur réseau : exit 1 sans toucher au fichier existant.
   Usage : node fetch-arrivages.js [jours=7] */
const fs   = require('fs');
const path = require('path');

const DAYS     = Number(process.argv[2]) || 7;
const API      = 'https://www.vinyl-run.com/api/discogs?type=inventory&per_page=100&page=';
const MAX_PAGE = 5;     // 500 annonces max : couvre les plus gros arrivages vus (255 en une semaine)
const OUT      = path.join(__dirname, 'newsletter', 'arrivages.json');

const now    = new Date();
const cutoff = new Date(now.getTime() - DAYS * 864e5);

function pick(l) {
  const r = l.release || {};
  const img = (r.images && r.images[0] && r.images[0].uri) || r.thumbnail || '';
  return {
    id:        l.id,
    uri:       l.uri,
    posted:    l.posted,
    artist:    r.artist || '',
    title:     r.title || '',
    format:    r.format || '',
    year:      r.year || null,
    label:     r.label || '',
    condition: l.condition || '',
    sleeve:    l.sleeve_condition || '',
    price:     l.price ? l.price.value : null,
    currency:  l.price ? l.price.currency : 'EUR',
    comments:  l.comments || '',
    image:     img,
  };
}

(async () => {
  const listings = [];
  for (let page = 1; page <= MAX_PAGE; page++) {
    const res = await fetch(API + page, { headers: { 'User-Agent': 'VinylRun-arrivages/1.0' } });
    if (!res.ok) throw new Error(`page ${page} : HTTP ${res.status}`);
    const data = await res.json();
    const batch = data.listings || [];
    let older = false;
    for (const l of batch) {
      if (new Date(l.posted) < cutoff) { older = true; break; }
      if (l.status === 'For Sale') listings.push(pick(l));
    }
    if (older || batch.length < 100) break;
  }

  const out = {
    generatedAt: now.toISOString(),
    since:       cutoff.toISOString(),
    days:        DAYS,
    count:       listings.length,
    listings,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`${listings.length} annonce(s) depuis le ${cutoff.toISOString().slice(0, 10)} -> ${path.relative(process.cwd(), OUT)}`);
})().catch(e => {
  console.error('Échec récupération Discogs :', e.message);
  process.exit(1);
});
