const ALLOWED = ['vinyl-run.com', 'vinyl-run.vercel.app'];

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && !ALLOWED.some(h => origin.includes(h))) return res.status(403).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = (body?.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // 1. Ajouter le contact à la liste Brevo
  const r = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({ email, listIds: [4], updateEnabled: true }),
  });

  // 201 = nouveau contact, 204 = déjà existant
  if (r.status !== 201 && r.status !== 204) {
    const data = await r.json().catch(() => ({}));
    return res.status(400).json({ error: data.message || 'Erreur Brevo' });
  }

  // 2. Récupérer le dernier article depuis le flux RSS
  let latest = null;
  try {
    const rssText = await fetch('https://vinyl-run.com/rss.xml').then(x => x.text());
    const title = rssText.match(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
    const link  = rssText.match(/<item>[\s\S]*?<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const desc  = rssText.match(/<item>[\s\S]*?<description>([\s\S]*?)<\/description>/)?.[1]?.trim();
    const img   = rssText.match(/enclosure url="([^"]+)"/)?.[1];
    if (title && link) latest = { title, link, desc: desc || '', img: img || '' };
  } catch (_) {}

  // 3. Construire et envoyer l'email de bienvenue
  const articleBlock = latest ? `
    <div style="margin-top:32px;border-top:1px solid rgba(240,237,230,0.12);padding-top:28px;">
      <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#EDF10C;margin:0 0 16px;font-family:'Helvetica Neue',Arial,sans-serif;">L'article du moment</p>
      ${latest.img ? `<img src="${latest.img}" alt="" style="width:100%;max-width:520px;height:200px;object-fit:cover;border-radius:4px;margin-bottom:20px;display:block;" />` : ''}
      <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;font-style:italic;color:#f0ede6;margin:0 0 12px;line-height:1.3;">${latest.title}</h2>
      <p style="font-size:14px;color:rgba(240,237,230,0.7);margin:0 0 20px;line-height:1.6;font-family:'Helvetica Neue',Arial,sans-serif;">${latest.desc}</p>
      <a href="${latest.link}" style="display:inline-block;padding:12px 28px;background:#EDF10C;color:#111110;font-size:13px;font-weight:500;text-decoration:none;border-radius:2px;letter-spacing:0.04em;font-family:'Helvetica Neue',Arial,sans-serif;">Lire l'article →</a>
    </div>` : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111110;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;font-family:'Helvetica Neue',Arial,sans-serif;">
    <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#EDF10C;margin:0 0 36px;font-weight:600;">VINYL RUN</p>
    <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;font-style:italic;color:#f0ede6;margin:0 0 20px;line-height:1.3;">Bienvenue dans le Magazine</h1>
    <p style="font-size:15px;color:rgba(240,237,230,0.75);line-height:1.75;margin:0 0 14px;">
      Tu fais maintenant partie du cercle Vinyl Run. Chaque semaine, on te partage nos coups de cœur, les arrivages, et tout ce qui tourne autour du vinyle à La Réunion.
    </p>
    <p style="font-size:15px;color:rgba(240,237,230,0.75);line-height:1.75;margin:0;">
      Un seul email par semaine — désabonnement en un clic si tu changes d'avis.
    </p>
    ${articleBlock}
    <div style="margin-top:48px;padding-top:20px;border-top:1px solid rgba(240,237,230,0.08);">
      <p style="font-size:12px;color:rgba(240,237,230,0.3);margin:0;">Vinyl Run · Saint-Pierre, La Réunion · <a href="https://vinyl-run.com/blog/" style="color:rgba(240,237,230,0.3);">Le Magazine</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        to: [{ email }],
        sender: { name: 'Vinyl Run', email: 'magazine@vinyl-run.com' },
        replyTo: { email: 'vinylrun974@gmail.com', name: 'Vinyl Run' },
        subject: 'Bienvenue dans le Magazine Vinyl Run 🎵',
        htmlContent,
      }),
    });
  } catch (_) {}

  return res.status(200).json({ ok: true });
}
