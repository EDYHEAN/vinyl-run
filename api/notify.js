function decodeXml(s) {
  return (s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

// Repli : mail "article seul" construit depuis le dernier item de rss.xml
async function buildFromRss() {
  // 1. Fetch latest article from RSS
  let latest = null;
  try {
    const rssText = await fetch('https://vinyl-run.com/rss.xml').then(x => x.text());
    const title = decodeXml(rssText.match(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1]?.trim());
    const link  = rssText.match(/<item>[\s\S]*?<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const desc  = decodeXml(rssText.match(/<item>[\s\S]*?<description>([\s\S]*?)<\/description>/)?.[1]?.trim());
    const img   = rssText.match(/enclosure url="([^"]+)"/)?.[1];
    const cat   = decodeXml(rssText.match(/<item>[\s\S]*?<category>([\s\S]*?)<\/category>/)?.[1]?.trim());
    if (title && link) latest = { title, link, desc: desc || '', img: img || '', cat: cat || 'Le Magazine' };
  } catch (_) {}

  if (!latest) return null;

  // 2. Build HTML
  const imgBlock = latest.img
    ? `<a href="${latest.link}" target="_blank" style="text-decoration:none;border:0;"><img src="${latest.img}" alt="${latest.title}" style="width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:4px;margin-bottom:24px;display:block;border:0;" /></a>`
    : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111110;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;font-family:'Helvetica Neue',Arial,sans-serif;">

    <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#EDF10C;margin:0 0 40px;font-weight:600;">VINYL RUN</p>

    <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(240,237,230,0.4);margin:0 0 20px;">${latest.cat}</p>

    ${imgBlock}

    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;font-style:italic;color:#f0ede6;margin:0 0 16px;line-height:1.35;">${latest.title}</h1>

    <p style="font-size:15px;color:rgba(240,237,230,0.7);line-height:1.75;margin:0 0 32px;">${latest.desc}</p>

    <a href="${latest.link}" style="display:inline-block;padding:14px 32px;background:#EDF10C;color:#111110;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:0.05em;font-family:'Helvetica Neue',Arial,sans-serif;">Lire l'article →</a>

    <div style="margin-top:48px;padding-top:20px;border-top:1px solid rgba(240,237,230,0.08);">
      <p style="font-size:12px;color:rgba(240,237,230,0.25);margin:0;line-height:1.6;">Vinyl Run · Saint-Pierre, La Réunion · <a href="https://vinyl-run.com/blog/" style="color:rgba(240,237,230,0.25);">Le Magazine</a></p>
    </div>

    <div style="height:48px;"></div>

  </div>
</body>
</html>`;

  const textContent = `VINYL RUN — Le Magazine\n\n${latest.cat}\n\n${latest.title}\n\n${latest.desc}\n\nLire l'article : ${latest.link}\n\n---\nVinyl Run · Saint-Pierre, La Réunion\nhttps://www.vinyl-run.com/blog/`;

  return { subject: latest.title, htmlContent, textContent };
}

export default async function handler(req, res) {
  // Sonde du rapport hebdo (weekly-stats.mjs, weekly-report-send.mjs) : prouve que CETTE version est déployée
  // avant d'envoyer une action. Une version antérieure ignorerait "action" et enverrait la newsletter à la liste.
  if (req.method === 'GET') return res.status(200).json({ actions: ['stats', 'report'] });
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!process.env.NOTIFY_SECRET || body?.secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rapport hebdo : chaque action répond et s'arrête ici, jamais de repli vers l'envoi de la newsletter
  if (body.action !== undefined) {
    if (body.action === 'stats') return res.status(200).json(await weeklyStats(Number(body.days) || 7));
    if (body.action === 'report') return sendReport(body, res);
    return res.status(400).json({ error: `action inconnue : ${body.action}` });
  }

  // Mail validé par Johan (newsletter/mail.html, envoyé tel quel par notify.yml), sinon repli RSS
  let mail;
  if (typeof body.html === 'string' && body.html.trim()) {
    if (body.html.length > 300000) return res.status(413).json({ error: 'HTML trop lourd' });
    mail = {
      subject:     String(body.subject || '').trim().slice(0, 200) || 'Vinyl Run · Le Magazine',
      htmlContent: body.html,
      textContent: typeof body.text === 'string' ? body.text : undefined,
    };
  } else {
    mail = await buildFromRss();
    if (!mail) return res.status(500).json({ error: 'RSS unavailable' });
  }

  // 3. Create campaign
  const createRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      name: `Magazine — ${mail.subject}`,
      subject: mail.subject,
      sender: { name: 'Vinyl Run', email: 'magazine@vinyl-run.com' },
      replyTo: 'vinylrun974@gmail.com',
      recipients: { listIds: [4] },
      htmlContent: mail.htmlContent,
      textContent: mail.textContent,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    return res.status(500).json({ error: err.message || 'Campaign creation failed' });
  }

  const { id } = await createRes.json();

  // 4. Send immediately
  const sendRes = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}/sendNow`, {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY },
  });

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}));
    return res.status(500).json({ error: err.message || 'Send failed', campaignId: id });
  }

  return res.status(200).json({ ok: true, campaignId: id, subject: mail.subject });
}

// ---------------------------------------------------------------------------------------------------------------
// Rapport hebdo (reports/README.md). Ce fichier porte les deux actions parce que le plan Vercel plafonne à
// 12 fonctions dans api/ et qu'il a déjà le secret partagé avec GitHub (NOTIFY_SECRET).

const REPORT_TO = ['johan.trigeard@gmail.com', 'vinylrun974@gmail.com'];
const NEWSLETTER_LIST = 4;

const brevo = async (path) => {
  const r = await fetch(`https://api.brevo.com/v3${path}`, { headers: { 'api-key': process.env.BREVO_API_KEY, accept: 'application/json' } });
  const t = await r.text();
  if (!r.ok) throw new Error(`Brevo ${r.status} ${t.slice(0, 160)}`);
  return t ? JSON.parse(t) : {};
};
const safe = (p) => p.catch((e) => ({ error: String(e?.message || e) }));

// Les chiffres que le site seul connaît. JAMAIS d'email ni de nom dans la réponse : elle est committée dans un
// dépôt public (reports/data/). Que des comptes.
async function weeklyStats(days) {
  const since = new Date(Date.now() - days * 864e5);
  return {
    since: since.toISOString(),
    days,
    newsletter: await safe(newsletterStats(since)),
    demandesVinyl: await safe(tagCount('demande-vinyl', since)),
    chat: await safe(chatStats(since)),
  };
}

async function newsletterStats(since) {
  // l'attribut de source doit exister pour que subscribe.js puisse l'écrire (400 = existe déjà, normal)
  await fetch('https://api.brevo.com/v3/contacts/attributes/normal/VR_SOURCE', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({ type: 'text' }),
  }).catch(() => {});

  const list = await brevo(`/contacts/lists/${NEWSLETTER_LIST}`);
  // contacts de la liste modifiés depuis `since` : les nouveaux inscrits (createdAt) et les désinscrits
  const touched = [];
  for (let offset = 0; offset < 5000; offset += 500) {
    const j = await brevo(`/contacts/lists/${NEWSLETTER_LIST}/contacts?modifiedSince=${encodeURIComponent(since.toISOString())}&limit=500&offset=${offset}`);
    touched.push(...(j.contacts || []));
    if ((j.contacts || []).length < 500) break;
  }
  const isNew = (c) => new Date(c.createdAt) >= since;
  const isOut = (c) => c.emailBlacklisted || (c.listUnsubscribed || []).includes(NEWSLETTER_LIST);
  const bySource = {};
  for (const c of touched.filter((c) => isNew(c) && !isOut(c))) {
    const s = c.attributes?.VR_SOURCE || 'non suivi';
    bySource[s] = (bySource[s] || 0) + 1;
  }
  const campaigns = await brevo('/emailCampaigns?status=sent&limit=4&sort=desc&statistics=globalStats');
  return {
    total: list.uniqueSubscribers ?? list.totalSubscribers ?? null,
    totalSubscribers: list.totalSubscribers ?? null,
    totalBlacklisted: list.totalBlacklisted ?? null,
    newSubscribers: Object.values(bySource).reduce((a, b) => a + b, 0),
    newBySource: Object.fromEntries(Object.entries(bySource).sort((a, b) => b[1] - a[1])),
    unsubscribed: touched.filter((c) => isOut(c) && !isNew(c)).length,
    campaigns: (campaigns.campaigns || []).map((c) => {
      const g = c.statistics?.globalStats || {};
      return {
        subject: c.subject,
        sentDate: c.sentDate,
        sent: g.sent, delivered: g.delivered,
        uniqueViews: g.uniqueViews, uniqueClicks: g.uniqueClicks,
        unsubscriptions: g.unsubscriptions, hardBounces: g.hardBounces, softBounces: g.softBounces,
      };
    }),
  };
}

// mails transactionnels portant un tag (ex. "demande-vinyl", posé par api/wishlist.js depuis le 2026-11-23)
async function tagCount(tag, since) {
  const day = (d) => d.toISOString().slice(0, 10);
  const j = await brevo(`/smtp/statistics/aggregatedReport?startDate=${day(since)}&endDate=${day(new Date())}&tag=${encodeURIComponent(tag)}`);
  return { requests: j.requests ?? 0, since: day(since) };
}

async function chatStats(since) {
  const base = (process.env.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;
  if (!base || !KEY) throw new Error('Supabase non configuré');
  const count = async (q) => {
    const r = await fetch(`${base}/rest/v1/${q}&select=id&limit=1`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' },
    });
    if (!r.ok) throw new Error(`Supabase ${r.status} ${(await r.text()).slice(0, 120)}`);
    return Number((r.headers.get('content-range') || '').split('/')[1]) || 0;
  };
  const iso = encodeURIComponent(since.toISOString());
  return {
    conversations: await count(`conversations?created_at=gte.${iso}`),
    visitorMessages: await count(`messages?created_at=gte.${iso}&sender=eq.visitor`),
    shopMessages: await count(`messages?created_at=gte.${iso}&sender=neq.visitor`),
  };
}

// Envoie reports/<date>.html (écrit par la routine du lundi) aux destinataires fixes REPORT_TO
async function sendReport(body, res) {
  const raw = typeof body.html === 'string' ? body.html : '';
  if (!raw.trim()) return res.status(400).json({ error: 'html manquant' });
  if (raw.length > 300000) return res.status(413).json({ error: 'HTML trop lourd' });
  // Brevo passe le HTML dans son moteur de templates : un « {{ » ou « {% », même en commentaire, casse le rendu
  // alors que l'API répond 201 (mail perdu, incident MFT du 05/11). Commentaires retirés, accolades refusées.
  const html = raw.replace(/<!--[\s\S]*?-->/g, '');
  if (/\{\{|\{%/.test(html)) return res.status(422).json({ error: 'le rapport contient encore des accolades doubles' });
  const subject = (html.match(/<title>([^<]*)<\/title>/)?.[1] || '').trim().slice(0, 200) || 'Vinyl Run · rapport de la semaine';

  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Vinyl Run · Rapport', email: 'magazine@vinyl-run.com' },
      to: REPORT_TO.map((email) => ({ email })),
      subject,
      htmlContent: html,
      tags: ['weekly-report'],
    }),
  });
  if (!r.ok) return res.status(502).json({ error: `Brevo ${r.status} ${(await r.text()).slice(0, 200)}` });
  return res.status(200).json({ ok: true, to: REPORT_TO.length, subject });
}
