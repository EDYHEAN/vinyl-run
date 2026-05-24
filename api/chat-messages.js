export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { conversation_id } = req.query;
  if (!conversation_id) return res.status(400).json({ error: 'conversation_id manquant' });

  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversation_id}&order=created_at.asc`,
    { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }
  );

  if (!r.ok) return res.status(500).json({ error: 'Erreur lecture' });
  return res.status(200).json(await r.json());
}
