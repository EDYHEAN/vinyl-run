const ALLOWED = ['vinyl-run.com', 'vinyl-run.vercel.app'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const origin = req.headers.origin || '';
  if (origin && !ALLOWED.some(h => origin.includes(h))) return res.status(403).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  // Honeypot
  if (body.website) return res.status(200).json({ ok: true });

  const { nom, telephone, email, artiste, album, format, genre, etat, message } = body || {};
  if (!nom || !telephone || !artiste) return res.status(400).json({ error: 'Champs obligatoires manquants' });

  const row = (label, value, accent = false) => value ? `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(240,237,230,0.08);color:rgba(240,237,230,0.4);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(240,237,230,0.08);font-size:14px;color:${accent ? '#EDF10C' : '#f0ede6'};font-weight:${accent ? '600' : '400'};line-height:1.5;">${value}</td>
    </tr>` : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111110;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;font-family:'Helvetica Neue',Arial,sans-serif;">

    <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#EDF10C;margin:0 0 8px;font-weight:600;">VINYL RUN</p>
    <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(240,237,230,0.4);margin:0 0 32px;">Demande de vinyle</p>

    <table style="width:100%;border-collapse:collapse;">
      ${row('Nom', nom)}
      ${row('Téléphone', telephone)}
      ${row('Email', email)}
      ${row('Artiste', artiste, true)}
      ${row('Album', album)}
      ${row('Format', format)}
      ${row('Genre', genre)}
      ${row('État', etat)}
      ${row('Message', message ? message.replace(/\n/g, '<br>') : '')}
    </table>

    <div style="margin-top:48px;padding-top:20px;border-top:1px solid rgba(240,237,230,0.08);">
      <p style="font-size:12px;color:rgba(240,237,230,0.25);margin:0;">Vinyl Run · Saint-Pierre, La Réunion</p>
    </div>

  </div>
</body>
</html>`;

  const sendRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'Vinyl Run', email: 'magazine@vinyl-run.com' },
      to: [{ email: 'vinylrun974@gmail.com', name: 'Vinyl Run' }],
      replyTo: email ? { email, name: nom } : { email: 'magazine@vinyl-run.com' },
      subject: `Demande vinyle — ${artiste}${album ? ' / ' + album : ''}`,
      htmlContent,
    }),
  });

  if (!sendRes.ok) return res.status(500).json({ error: 'Envoi échoué' });
  return res.status(200).json({ ok: true });
}
