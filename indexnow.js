// Signale à IndexNow (Bing, Yandex…) les URLs du sitemap modifiées récemment. Sans dépendance.
// Usage : node indexnow.js          → URLs dont le lastmod date de moins de 2 jours
//         node indexnow.js --all    → tout le sitemap (one-shot, à éviter en routine)
// La clé est publique par design : elle doit être servie à la racine (/<clé>.txt).
const fs = require('fs');

const HOST = 'www.vinyl-run.com';
const KEY = '341fd2752dbd000be1f301cd5270e35d';
const all = process.argv.includes('--all');

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
const since = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
  .filter(([, , lastmod]) => all || lastmod >= since)
  .map(([, loc]) => loc);

if (!urls.length) { console.log('IndexNow : aucune URL récente dans le sitemap.'); process.exit(0); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // Le déploiement Vercel suit le push de quelques dizaines de secondes : on attend que
  // chaque URL réponde 200 (un nouvel article est en 404 tant que le déploiement n'est pas live).
  for (const url of urls) {
    for (let i = 0; ; i++) {
      const r = await fetch(url, { method: 'HEAD' }).catch(() => ({ status: 0 }));
      if (r.status === 200) break;
      if (i === 20) { console.error(`IndexNow : ${url} toujours en ${r.status}, abandon.`); process.exit(1); }
      await sleep(15000);
    }
  }

  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
  });
  // 200 = reçu, 202 = reçu, clé en cours de validation
  console.log(`IndexNow : ${r.status} pour ${urls.length} URL(s)`);
  urls.forEach(u => console.log('  ' + u));
  if (r.status !== 200 && r.status !== 202) process.exit(1);
})();
