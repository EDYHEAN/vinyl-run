export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { admin_password, conversation_id } = req.body || {};
  if (admin_password !== process.env.CHAT_ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SECRET_KEY;

  // Si conversation_id fourni → retourner les messages de cette conversation
  if (conversation_id) {
    const res2 = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversation_id}&order=created_at.asc`,
      {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
      }
    );
    if (!res2.ok) return res.status(500).json({ error: 'Erreur lecture messages' });
    return res.status(200).json(await res2.json());
  }

  // Sinon → retourner toutes les conversations triées par dernier message
  const res2 = await fetch(
    `${SUPABASE_URL}/rest/v1/conversations?order=last_message_at.desc`,
    {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    }
  );
  if (!res2.ok) return res.status(500).json({ error: 'Erreur lecture conversations' });
  return res.status(200).json(await res2.json());
}
