export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message manquant' });

  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  // Label visiteur aléatoire — pas de dépendance à un comptage
  const code = Math.floor(1000 + Math.random() * 9000);
  const label = 'Client ' + code;

  // Créer la conversation
  const convRes = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ visitor_name: label, visitor_phone: '' }),
  });

  if (!convRes.ok) {
    const err = await convRes.text();
    return res.status(500).json({ error: 'Erreur création conversation', detail: err });
  }
  const [conv] = await convRes.json();

  // Premier message
  const msgRes = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ conversation_id: conv.id, body: message, sender: 'visitor' }),
  });

  if (!msgRes.ok) {
    const err = await msgRes.text();
    return res.status(500).json({ error: 'Erreur envoi message', detail: err });
  }

  return res.status(200).json({ conversation_id: conv.id });
}
