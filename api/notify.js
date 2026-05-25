function decodeXml(s) {
  return (s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!process.env.NOTIFY_SECRET || body?.secret !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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

  if (!latest) return res.status(500).json({ error: 'RSS unavailable' });

  // 2. Build HTML
  const imgBlock = latest.img
    ? `<img src="${latest.img}" alt="" style="width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:4px;margin-bottom:24px;display:block;" />`
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

  // 3. Create campaign
  const createRes = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      name: `Magazine — ${latest.title}`,
      subject: latest.title,
      sender: { name: 'Vinyl Run', email: 'magazine@vinyl-run.com' },
      replyTo: 'vinylrun974@gmail.com',
      recipients: { listIds: [4] },
      htmlContent,
      textContent,
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

  return res.status(200).json({ ok: true, campaignId: id, article: latest.title });
}
