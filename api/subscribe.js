export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = (body?.email || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const r = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      email,
      listIds: [4],
      updateEnabled: true,
    }),
  });

  // 201 = nouveau contact, 204 = déjà existant (mis à jour)
  if (r.status === 201 || r.status === 204) {
    return res.status(200).json({ ok: true });
  }

  const data = await r.json().catch(() => ({}));
  return res.status(400).json({ error: data.message || 'Erreur Brevo' });
}
