export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { conversation_id } = req.query;
  if (!conversation_id) return res.status(400).json({ error: 'conversation_id manquant' });

  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/conversations?id=eq.${conversation_id}&select=visitor_typing_at,admin_typing_at`,
    { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }
  );

  if (!r.ok) return res.status(500).json({ error: 'Erreur' });
  const rows = await r.json();
  const conv = rows[0];
  if (!conv) return res.status(200).json({ visitor_typing: false, admin_typing: false });

  const now = Date.now();
  const THRESHOLD = 5000;
  const visitor_typing = conv.visitor_typing_at && (now - new Date(conv.visitor_typing_at).getTime()) < THRESHOLD;
  const admin_typing   = conv.admin_typing_at   && (now - new Date(conv.admin_typing_at).getTime())   < THRESHOLD;

  return res.status(200).json({ visitor_typing: !!visitor_typing, admin_typing: !!admin_typing });
}
