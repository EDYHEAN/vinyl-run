export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message manquant' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SECRET_KEY;

  // Compter les conversations existantes pour générer "Client XX"
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/conversations?select=id`, {
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer': 'count=exact',
      'Range-Unit': 'items',
      'Range': '0-0',
    },
  });
  const contentRange = countRes.headers.get('content-range') || '0/0';
  const total = parseInt(contentRange.split('/')[1] || '0', 10);
  const label = 'Client ' + String(total + 1).padStart(2, '0');

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

  if (!convRes.ok) return res.status(500).json({ error: 'Erreur création conversation' });
  const [conv] = await convRes.json();

  // Premier message
  await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ conversation_id: conv.id, body: message, sender: 'visitor' }),
  });

  return res.status(200).json({ conversation_id: conv.id });
}
