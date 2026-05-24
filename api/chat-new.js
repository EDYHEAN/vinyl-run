export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, message } = req.body || {};
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  // Honeypot
  if (req.body.website) return res.status(200).json({ ok: true });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SECRET_KEY;

  // Créer la conversation
  const convRes = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ visitor_name: name, visitor_phone: phone }),
  });

  if (!convRes.ok) return res.status(500).json({ error: 'Erreur création conversation' });
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

  if (!msgRes.ok) return res.status(500).json({ error: 'Erreur envoi message' });

  return res.status(200).json({ conversation_id: conv.id });
}
