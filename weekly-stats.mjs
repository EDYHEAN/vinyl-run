// Les chiffres de la semaine Vinyl Run, pour le rapport hebdo du lundi (reports/README.md). Écrit
// reports/data/<YYYY-MM-DD>.json, que la routine Claude du lundi lit pour rédiger le rapport :
//   - site : newsletter (inscrits, nouveaux par source, désinscrits, stats des dernières campagnes), demandes
//     de vinyle, chat, via POST /api/notify { action: "stats" } (secret NOTIFY_SECRET, clés Brevo/Supabase côté Vercel) ;
//   - Google Search Console (compte de service, en lecture seule) : 28 j jour par jour, requêtes et pages de la
//     semaine et de la semaine d'avant, pays ;
//   - Bing Webmaster : trafic jour par jour, top requêtes et pages, crawl ;
//   - Discogs : taille de l'inventaire et annonces mises en ligne sur 7 jours (API publique).
// Chaque bloc est indépendant : une source en panne donne { error } sans casser le relevé.
// Le dépôt est PUBLIC : que des comptes, jamais d'email, de nom de client ni de chiffre d'affaires.
// Lancé par .github/workflows/weekly-stats.yml (dimanche soir). Secrets : NOTIFY_SECRET, GSC_SERVICE_ACCOUNT, BING_API_KEY.
// En local : node weekly-stats.mjs (BING_API_KEY lu dans ~/.config/bing, GSC dans ~/.config/gsc si absents)
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SITE = 'https://www.vinyl-run.com';
const GSC_SITE = 'sc-domain:vinyl-run.com';
const BING_SITE = 'https://vinyl-run.com/';
const SELLER = 'Vinylrun974';
const day = (d) => d.toISOString().slice(0, 10);
const ago = (n) => new Date(Date.now() - n * 864e5);
const today = day(new Date());
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const safe = (p) => p.catch((e) => ({ error: String(e?.message ?? e) }));
const getJson = async (url, init = {}) => {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t);
};
const localFile = (...p) => {
  const f = path.join(os.homedir(), '.config', ...p);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : null;
};

// ---- site (newsletter, demandes, chat)

async function site() {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return { error: 'pas de NOTIFY_SECRET' };
  // sonde : une version d'api/notify.js sans les actions enverrait la newsletter à toute la liste
  const probe = await getJson(`${SITE}/api/notify`).catch(() => ({}));
  if (!probe.actions?.includes('stats')) return { error: "api/notify.js déployé sans l'action stats : relevé site sauté" };
  return getJson(`${SITE}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, action: 'stats', days: 7 }),
  });
}

// ---- Google Search Console

async function googleToken(key) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claims = b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: key.token_uri, iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claims}`).sign(key.private_key).toString('base64url');
  const j = await getJson(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${sig}` }),
  });
  if (!j.access_token) throw new Error(`jeton Google : ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

async function search() {
  const raw = process.env.GSC_SERVICE_ACCOUNT || localFile('gsc', 'nookdex-gsc.json');
  if (!raw) return { error: 'pas de GSC_SERVICE_ACCOUNT' };
  const token = await googleToken(JSON.parse(raw));
  const q = async (startDate, endDate, dimensions, rowLimit = 50) => {
    const j = await getJson(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
    });
    return (j.rows ?? []).map((x) => ({
      key: x.keys.join(' | ').replace('https://www.vinyl-run.com', '').replace('https://vinyl-run.com', '') || '/',
      clicks: x.clicks, impressions: x.impressions, ctr: round(x.ctr * 100, 2), position: round(x.position),
    }));
  };
  // 31 j jour par jour ; la semaine = les 7 derniers jours AVEC données (la GSC a 2-3 j de retard)
  const timeline = (await q(day(ago(31)), day(ago(1)), ['date'], 100)).map(({ key, ...r }) => ({ date: key, ...r }));
  const week = timeline.slice(-7);
  const before = timeline.slice(-14, -7);
  if (!week.length) return { error: 'GSC : aucune donnée sur 31 jours' };
  const span = (rows) => ({
    from: rows[0]?.date, to: rows.at(-1)?.date,
    clicks: rows.reduce((s, r) => s + r.clicks, 0), impressions: rows.reduce((s, r) => s + r.impressions, 0),
  });
  const w = span(week);
  const b = span(before);
  const first = timeline[0].date;
  const last = timeline.at(-1).date;
  return {
    week: w,
    before: b,
    timeline,
    queriesWeek: await q(w.from, w.to, ['query']),
    queriesBefore: b.from ? await q(b.from, b.to, ['query']) : [],
    pagesWeek: await q(w.from, w.to, ['page']),
    pagesBefore: b.from ? await q(b.from, b.to, ['page']) : [],
    // 28 j : pour le « presque page 1 » (position 5-20 avec du volume) et les CTR anormaux
    queries28: await q(first, last, ['query'], 150),
    pages28: await q(first, last, ['page'], 100),
    countries28: await q(first, last, ['country'], 10),
  };
}

// ---- Bing Webmaster

async function bing() {
  const key = (process.env.BING_API_KEY || localFile('bing', 'webmaster-key.txt') || '').trim();
  if (!key) return { error: 'pas de BING_API_KEY' };
  const call = async (method) => {
    const j = await getJson(`https://ssl.bing.com/webmaster/api.svc/json/${method}?apikey=${key}&siteUrl=${encodeURIComponent(BING_SITE)}`);
    return j.d ?? [];
  };
  const date = (s) => new Date(+String(s).match(/\d+/)[0]).toISOString().slice(0, 10);
  const [traffic, queries, pages, crawl] = await Promise.all([
    call('GetRankAndTrafficStats'),
    call('GetQueryStats'),
    call('GetPageStats'),
    call('GetCrawlStats').catch(() => []),
  ]);
  const agg = (rows) => {
    const m = {};
    for (const x of rows) {
      const a = (m[x.Query] ??= { key: x.Query, clicks: 0, impressions: 0, posSum: 0 });
      a.clicks += x.Clicks;
      a.impressions += x.Impressions;
      a.posSum += (x.AvgImpressionPosition ?? 0) * x.Impressions;
    }
    return Object.values(m)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30)
      .map(({ posSum, ...a }) => ({ ...a, position: a.impressions ? round(posSum / a.impressions) : null }));
  };
  const lastCrawl = crawl.sort((a, b) => (date(a.Date) < date(b.Date) ? -1 : 1)).at(-1);
  return {
    byDay: traffic.map((x) => ({ date: date(x.Date), clicks: x.Clicks, impressions: x.Impressions })).sort((a, b) => a.date.localeCompare(b.date)),
    // GetQueryStats / GetPageStats agrègent par semaine Bing : cumul sur la période dispo (depuis le 2026-10-30)
    queries: agg(queries),
    pages: agg(pages),
    crawl: lastCrawl ? { date: date(lastCrawl.Date), inIndex: lastCrawl.InIndex, crawled: lastCrawl.CrawledPages, errors: lastCrawl.CrawlErrors } : null,
  };
}

// ---- Discogs (inventaire public de la boutique)

async function discogs() {
  const headers = { 'User-Agent': 'VinylRunReport/1.0' };
  const since = ago(7);
  let total = null;
  let listedWeek = 0;
  for (let page = 1; page <= 5; page++) {
    const j = await getJson(`https://api.discogs.com/users/${SELLER}/inventory?per_page=100&page=${page}&sort=listed&sort_order=desc`, { headers });
    total ??= j.pagination?.items ?? null;
    const rows = j.listings ?? [];
    const fresh = rows.filter((l) => new Date(l.posted) >= since);
    listedWeek += fresh.length;
    if (fresh.length < rows.length || page >= (j.pagination?.pages ?? 1)) break;
  }
  // inventaire(semaine d'avant) + mises en ligne − inventaire(aujourd'hui) ≈ disques sortis (ventes ou retraits)
  return { inventory: total, listedWeek };
}

// ---- relevé

const report = {
  date: today,
  generatedAt: new Date().toISOString(),
  site: await safe(site()),
  search: await safe(search()),
  bing: await safe(bing()),
  discogs: await safe(discogs()),
};

fs.mkdirSync('reports/data', { recursive: true });
const out = `reports/data/${today}.json`;
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
const errors = Object.entries(report).filter(([, v]) => v && typeof v === 'object' && v.error).map(([k, v]) => `${k}: ${v.error}`);
console.log(`${out} (${Math.round(fs.statSync(out).size / 1024)} Ko)${errors.length ? `\nsources en erreur : ${errors.join(' | ')}` : ''}`);
