// Ping quotidien (cron Vercel) : le plan gratuit Supabase met le projet en pause après 7 jours sans activité.
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SECRET_KEY;

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/conversations?select=id&limit=1`,
    { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }
  );

  if (!r.ok) return res.status(500).json({ error: 'Supabase injoignable' });
  return res.status(200).json({ ok: true });
}
