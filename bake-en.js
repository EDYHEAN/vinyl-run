// Génère en/index.html depuis index.html + dictionnaire EN de i18n.js (one-shot, pas un build)
const fs = require('fs');

const i18nSrc = fs.readFileSync('i18n.js', 'utf8');
const m = i18nSrc.match(/en: \{([\s\S]*?)\n    \}\n  \};/);
if (!m) { console.error('dict EN introuvable'); process.exit(1); }
const EN = eval('({' + m[1] + '})');

let html = fs.readFileSync('index.html', 'utf8');

let baked = 0, missed = [];
for (const attr of ['data-i18n-html', 'data-i18n']) {
  const keyRe = new RegExp(attr + '="([^"]+)"', 'g');
  const keys = [...new Set([...html.matchAll(keyRe)].map(x => x[1]))];
  for (const key of keys) {
    if (attr === 'data-i18n' && key.includes('-html')) continue;
    if (EN[key] === undefined) { missed.push(key); continue; }
    const re = new RegExp('<(\\w+)([^>]*' + attr + '="' + key.replace(/\./g, '\\.') + '"[^>]*)>([\\s\\S]*?)</\\1>', 'g');
    let did = false;
    html = html.replace(re, (_, tag, attrs) => { did = true; baked++; return '<' + tag + attrs + '>' + EN[key] + '</' + tag + '>'; });
    if (!did) missed.push(key + ' (no match)');
  }
}
for (const key of ['inventaire.placeholder', 'newsletter.placeholder']) {
  html = html.replace(new RegExp('(<[^>]*data-i18n-placeholder="' + key.replace(/\./g, '\\.') + '"[^>]*>)', 'g'),
    tag => tag.replace(/placeholder="[^"]*"/, 'placeholder="' + EN[key] + '"'));
}

html = html.replace('<html lang="fr">', '<html lang="en">');
html = html.replace(/<title>[^<]*<\/title>/, '<title>' + EN['meta.title'] + '</title>');
html = html.replace(/(<meta name="description" content=")[^"]*(")/,
  '$1Independent record shop in Saint-Pierre, Réunion Island. New, used and rare vinyl, Indian Ocean music. Personal advice, special orders, worldwide shipping.$2');
// Le hreflang est déjà présent dans la source FR — on ne bascule que le canonical
html = html.replace('<link rel="canonical" href="https://www.vinyl-run.com" />',
  '<link rel="canonical" href="https://www.vinyl-run.com/en/" />');
html = html.replace('content="https://www.vinyl-run.com" />\n  <meta property="og:title"', 'content="https://www.vinyl-run.com/en/" />\n  <meta property="og:title"');
html = html.replace(/(<meta property="og:title"\s+content=")[^"]*(")/, '$1VINYL RUN — Independent Record Shop · Saint-Pierre, Réunion$2');
html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, '$1New, used and rare vinyl since 2017. The independent record shop of Saint-Pierre, Réunion Island. Listening station, personal advice, worldwide shipping.$2');
html = html.replace('content="fr_FR"', 'content="en_US"');
html = html.replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/, '$1VINYL RUN — Independent Record Shop · Saint-Pierre, Réunion$2');
html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, '$1New, used and rare vinyl since 2017. The independent record shop of Saint-Pierre, Réunion Island.$2');
html = html.replace('"description": "Disquaire indépendant à Saint-Pierre, La Réunion. Vinyles neufs, occasions et raretés depuis 2017.",',
  '"description": "Independent record shop in Saint-Pierre, Réunion Island. New, used and rare vinyl since 2017.",');

html = html.replace('href="style.css"', 'href="/style.css"');
html = html.replace(/src="assets\//g, 'src="/assets/');
html = html.replace(/'assets\//g, "'/assets/");

html = html.replace("window.VR_PAGE_LANG='fr'", "window.VR_PAGE_LANG='en'");

fs.mkdirSync('en', { recursive: true });
fs.writeFileSync('en/index.html', html);
console.log('baked:', baked, '| missed:', missed.length ? missed : 'aucun');
