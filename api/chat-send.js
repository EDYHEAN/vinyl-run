export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { conversation_id, message, sender, admin_password } = req.body || {};
  if (!conversation_id || !message || !sender) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  if (sender !== 'visitor' && sender !== 'admin') {
    return res.status(400).json({ error: 'Sender invalide' });
  }
  if (sender === 'admin' && admin_password !== process.env.CHAT_ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  // Insérer le message
  const msgRes = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ conversation_id, body: message, sender }),
  });

  if (!msgRes.ok) return res.status(500).json({ error: 'Erreur envoi message' });

  // Mettre à jour last_message_at
  await fetch(`${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversation_id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ last_message_at: new Date().toISOString(), last_message_body: message }),
  });

  return res.status(200).json({ ok: true });
}
