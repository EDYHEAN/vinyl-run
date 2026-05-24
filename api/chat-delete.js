export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { admin_password, conversation_id } = req.body || {};
  if (admin_password !== process.env.CHAT_ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  if (!conversation_id) return res.status(400).json({ error: 'conversation_id manquant' });

  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  await fetch(`${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversation_id}`, {
    method: 'DELETE',
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
  });

  await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversation_id}`, {
    method: 'DELETE',
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
  });

  return res.status(200).json({ ok: true });
}
