export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { conversation_id, sender, admin_password } = req.body || {};
  if (!conversation_id || !['visitor', 'admin'].includes(sender)) {
    return res.status(400).json({ error: 'Invalide' });
  }
  if (sender === 'admin' && admin_password !== process.env.CHAT_ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const column = sender === 'visitor' ? 'visitor_typing_at' : 'admin_typing_at';
  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversation_id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ [column]: new Date().toISOString() }),
  });

  return res.status(200).json({ ok: true });
}
