// Injecte les 3 derniers articles (depuis rss.xml) dans la home entre les
// marqueurs HOME-LATEST:START/END, puis regénère en/index.html (bake-en.js).
// À lancer après chaque mise à jour de rss.xml : node update-home-latest.js
const fs = require('fs');
const { execSync } = require('child_process');

const rss = fs.readFileSync('rss.xml', 'utf8');

const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
  const get = tag => {
    const x = m[1].match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
    return x ? x[1].trim() : '';
  };
  return { title: get('title'), link: get('link'), pubDate: new Date(get('pubDate')) };
});

// rss.xml est trié du plus récent au plus ancien, mais on retrie par sécurité
items.sort((a, b) => b.pubDate - a.pubDate);
const latest = items.slice(0, 3);
if (latest.length < 3) { console.error('rss.xml : moins de 3 items ?'); process.exit(1); }

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const frDate = d => d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
const esc = s => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Liens internes relatifs, sans .html (cleanUrls — cf. CLAUDE.md)
const block = latest.map(it => {
  const path = it.link.replace('https://www.vinyl-run.com', '');
  return '        <a class="home-latest__item" href="' + path + '">\n'
    + '          <span class="home-latest__date">' + frDate(it.pubDate) + '</span>\n'
    + '          <span class="home-latest__title">' + esc(it.title) + '</span>\n'
    + '        </a>';
}).join('\n');

let html = fs.readFileSync('index.html', 'utf8');
const re = /(<!-- HOME-LATEST:START -->)[\s\S]*?(<!-- HOME-LATEST:END -->)/;
if (!re.test(html)) { console.error('marqueurs HOME-LATEST introuvables dans index.html'); process.exit(1); }
html = html.replace(re, '$1\n' + block + '\n        $2');
fs.writeFileSync('index.html', html, 'utf8');
console.log('home-latest : ' + latest.map(i => frDate(i.pubDate)).join(' | '));

execSync('node bake-en.js', { stdio: 'inherit' });
