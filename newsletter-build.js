#!/usr/bin/env node
/* Construit le mail hebdo (article de la semaine + nouveautés en bac) à partir de :
     - newsletter/mail.json      écrit par la routine : { slug, intro?, arrivages?: [ids Discogs], subject? }
     - rss.xml                   l'article (titre, description, image, catégorie)
     - newsletter/arrivages.json annonces Discogs des 7 derniers jours (fetch-arrivages.js, lundi matin)
   Produit newsletter/mail.html (aperçu : https://www.vinyl-run.com/newsletter/mail) et newsletter/mail.txt.
   C'est CE fichier HTML, validé par Johan, que notify.yml envoie tel quel au « Go pour le mail ».

   Règle du bloc nouveautés : affiché seulement si au moins MIN annonces ont été mises en vente
   dans la semaine. On en montre SHOW, choisies par la routine (ids dans mail.json), complétées
   par les plus chères si la sélection est incomplète.
   Usage : node newsletter-build.js */
const fs   = require('fs');
const path = require('path');

const MIN  = 10;
const SHOW = 10;
const MAX_AGE_DAYS = 8;   // au-delà, arrivages.json est jugé périmé : bloc omis
const SELLER_URL   = 'https://www.discogs.com/seller/Vinylrun974/profile?sort=listed%2Cdesc';
const DIR  = path.join(__dirname, 'newsletter');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const esc  = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dexml = s => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// ── Entrées ─────────────────────────────────────────────
const mail = JSON.parse(read('newsletter/mail.json'));
if (!mail.slug) throw new Error('mail.json : "slug" manquant');

const rss = read('rss.xml');
const item = (rss.match(/<item>[\s\S]*?<\/item>/g) || []).find(i => i.includes(`/blog/articles/${mail.slug}</link>`));
if (!item) throw new Error(`Article "${mail.slug}" absent de rss.xml (mettre à jour le RSS d'abord)`);
const tag = t => dexml((item.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) || [])[1] || '').trim();
const article = {
  title: tag('title'),
  link:  tag('link'),
  desc:  tag('description'),
  cat:   tag('category') || 'Le Magazine',
  img:   (item.match(/enclosure url="([^"]+)"/) || [])[1] || '',
};
const utm = `?utm_source=newsletter&utm_medium=email&utm_campaign=${encodeURIComponent(mail.slug)}`;

let arr = { count: 0, listings: [] };
try { arr = JSON.parse(read('newsletter/arrivages.json')); } catch (_) {}
const ageDays = arr.generatedAt ? (Date.now() - new Date(arr.generatedAt)) / 864e5 : Infinity;

// ── Sélection des nouveautés ────────────────────────────
let picks = [];
let skipped = '';
if (ageDays > MAX_AGE_DAYS)        skipped = `arrivages.json périmé (${arr.generatedAt || 'absent'})`;
else if (arr.count < MIN)          skipped = `seulement ${arr.count} nouveauté(s) cette semaine (seuil ${MIN})`;
else {
  const byId = new Map(arr.listings.map(l => [String(l.id), l]));
  const wanted = (mail.arrivages || []).map(String);
  const unknown = wanted.filter(id => !byId.has(id));
  if (unknown.length) console.warn(`⚠ ids absents de arrivages.json, ignorés : ${unknown.join(', ')}`);
  picks = wanted.filter(id => byId.has(id)).map(id => byId.get(id));
  picks = [...new Map(picks.map(l => [l.id, l])).values()].slice(0, SHOW);
  if (picks.length < SHOW) {
    const rest = arr.listings.filter(l => !picks.includes(l)).sort((a, b) => (b.price || 0) - (a.price || 0));
    const added = rest.slice(0, SHOW - picks.length);
    if (added.length) console.warn(`⚠ sélection complétée par ${added.length} annonce(s) les plus chères`);
    picks = picks.concat(added);
  }
}

// ── Mise en forme ───────────────────────────────────────
// Discogs : 'Sabine (33)', 'Maloya*' -> marqueurs d'homonymie / de variante de nom, illisibles pour un abonné
const artistName = a => String(a || '').replace(/\s\(\d+\)/g, '').replace(/\*/g, '').trim();
const grade = c => (String(c).match(/\(([A-Z+\-]+)/) || [])[1] || c;
function fmt(f) {
  const first = String(f).split(',')[0].trim();
  const map = { 'LP': 'LP', '2xLP': '2 LP', '3xLP': '3 LP', '7"': '45 tours', '12"': 'Maxi 12"', '10"': '10"', 'Cass': 'Cassette', 'CD': 'CD' };
  return map[first] || first;
}
const price = (v, cur) => v == null ? '' : (cur === 'EUR' || !cur)
  ? `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`
  : `${v} ${cur}`;

const F = "font-family:'Helvetica Neue',Arial,sans-serif;";
const MUTED = 'rgba(240,237,230,0.6)';

function card(l) {
  if (!l) return '<td width="50%" style="padding:8px;"></td>';
  const meta = [fmt(l.format), grade(l.condition)].filter(Boolean).join(' · ');
  return `<td width="50%" valign="top" style="padding:8px;">
          <a href="${esc(l.uri)}" target="_blank" style="text-decoration:none;color:#f0ede6;display:block;">
            ${l.image ? `<img src="${esc(l.image)}" alt="${esc(artistName(l.artist) + ' – ' + l.title)}" width="248" style="width:100%;max-width:248px;height:auto;display:block;border:0;border-radius:3px;margin:0 0 10px;" />` : ''}
            <p style="${F}font-size:13px;font-weight:600;color:#f0ede6;margin:0 0 3px;line-height:1.35;">${esc(artistName(l.artist))}</p>
            <p style="font-family:Georgia,serif;font-style:italic;font-size:14px;color:#f0ede6;margin:0 0 6px;line-height:1.35;">${esc(l.title)}</p>
            <p style="${F}font-size:11px;letter-spacing:0.04em;color:${MUTED};margin:0;">${esc(meta)}${l.price != null ? ` · <span style="color:#EDF10C;font-weight:600;">${esc(price(l.price, l.currency))}</span>` : ''}</p>
          </a>
        </td>`;
}

let rows = '';
for (let i = 0; i < picks.length; i += 2) rows += `<tr>${card(picks[i])}${card(picks[i + 1])}</tr>\n        `;

const arrivagesBlock = picks.length ? `
    <div style="margin-top:56px;padding-top:40px;border-top:1px solid rgba(240,237,230,0.12);">
      <p style="${F}font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#EDF10C;margin:0 0 14px;">Nouveautés en bac</p>
      <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;font-style:italic;color:#f0ede6;margin:0 0 14px;line-height:1.3;">Arrivés cette semaine chez Vinyl Run</h2>
      ${mail.intro ? `<p style="${F}font-size:15px;color:rgba(240,237,230,0.75);line-height:1.7;margin:0 0 20px;">${esc(mail.intro)}</p>` : ''}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 -8px;">
        ${rows}</table>
      <div style="margin-top:24px;">
        <a href="${SELLER_URL}" target="_blank" style="display:inline-block;padding:13px 28px;border:1px solid rgba(240,237,230,0.35);color:#f0ede6;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;${F}">Voir les ${arr.count} nouveautés →</a>
      </div>
      <p style="${F}font-size:13px;color:${MUTED};line-height:1.6;margin:18px 0 0;">Dispo en boutique au 45 bis rue du four à chaux, Saint-Pierre (mardi au samedi), et en ligne sur Discogs. Premier arrivé, premier servi.</p>
    </div>` : '';

const subject = mail.subject || article.title;
const preheader = picks.length
  ? `${article.title} · Et ${picks.length} nouveautés arrivées en bac cette semaine.`
  : article.desc;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="vr-slug" content="${esc(mail.slug)}">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#111110;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;${F}">

    <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#EDF10C;margin:0 0 40px;font-weight:600;">VINYL RUN</p>

    <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(240,237,230,0.4);margin:0 0 20px;">${esc(article.cat)}</p>

    ${article.img ? `<a href="${esc(article.link + utm)}" target="_blank" style="text-decoration:none;border:0;"><img src="${esc(article.img)}" alt="${esc(article.title)}" width="512" style="width:100%;max-width:512px;height:220px;object-fit:cover;border-radius:4px;margin-bottom:24px;display:block;border:0;" /></a>` : ''}

    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;font-style:italic;color:#f0ede6;margin:0 0 16px;line-height:1.35;">${esc(article.title)}</h1>

    <p style="font-size:15px;color:rgba(240,237,230,0.7);line-height:1.75;margin:0 0 32px;">${esc(article.desc)}</p>

    <a href="${esc(article.link + utm)}" style="display:inline-block;padding:14px 32px;background:#EDF10C;color:#111110;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;${F}">Lire l'article →</a>
${arrivagesBlock}

    <div style="margin-top:48px;padding-top:20px;border-top:1px solid rgba(240,237,230,0.08);">
      <p style="font-size:12px;color:rgba(240,237,230,0.25);margin:0;line-height:1.6;">Vinyl Run · Saint-Pierre, La Réunion · <a href="https://www.vinyl-run.com/blog/" style="color:rgba(240,237,230,0.25);">Le Magazine</a></p>
    </div>

    <div style="height:48px;"></div>
  </div>
</body>
</html>
`;

const text = [
  'VINYL RUN · Le Magazine', '', article.cat, '', article.title, '', article.desc, '',
  `Lire l'article : ${article.link}${utm}`,
  ...(picks.length ? ['', '---', '', 'NOUVEAUTÉS EN BAC, ARRIVÉS CETTE SEMAINE', '', ...(mail.intro ? [mail.intro, ''] : []),
    ...picks.map(l => `- ${artistName(l.artist)}, ${l.title} (${[fmt(l.format), grade(l.condition), price(l.price, l.currency)].filter(Boolean).join(' · ')}) : ${l.uri}`),
    '', `Voir les ${arr.count} nouveautés : ${SELLER_URL}`,
    'Dispo en boutique au 45 bis rue du four à chaux, Saint-Pierre, et sur Discogs.'] : []),
  '', '---', 'Vinyl Run · Saint-Pierre, La Réunion', 'https://www.vinyl-run.com/blog/', '',
].join('\n');

fs.writeFileSync(path.join(DIR, 'mail.html'), html);
fs.writeFileSync(path.join(DIR, 'mail.txt'), text);

console.log(`Objet       : ${subject}`);
console.log(`Article     : ${article.title} (${article.link})`);
if (picks.length) {
  console.log(`Nouveautés  : ${picks.length} affichées sur ${arr.count} de la semaine`);
  picks.forEach((l, i) => console.log(`  ${i + 1}. [${l.id}] ${artistName(l.artist)} - ${l.title} · ${fmt(l.format)} · ${grade(l.condition)} · ${price(l.price, l.currency)}`));
} else {
  console.log(`Nouveautés  : bloc omis, ${skipped}`);
}
console.log('Aperçu      : https://www.vinyl-run.com/newsletter/mail (après déploiement)');
