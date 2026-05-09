const SELLER = 'Vinylrun974';
const TOKEN  = process.env.DISCOGS_TOKEN;
const HEADERS = {
  'User-Agent':    'VinylRun/1.0',
  'Authorization': `Discogs token=${TOKEN}`,
};

export default async function handler(req, res) {
  const { type, page, per_page, id } = req.query;

  let url;
  if (type === 'inventory') {
    const p   = encodeURIComponent(page     || '1');
    const pp  = encodeURIComponent(per_page || '100');
    url = `https://api.discogs.com/users/${SELLER}/inventory?per_page=${pp}&page=${p}&sort=listed&sort_order=desc`;
  } else if (type === 'release' && id && /^\d+$/.test(id)) {
    url = `https://api.discogs.com/releases/${id}`;
  } else {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const upstream = await fetch(url, { headers: HEADERS });
    if (!upstream.ok) return res.status(upstream.status).json({ error: upstream.statusText });
    const data = await upstream.json();
    const ttl = type === 'release' ? 86400 : 1800;
    res.setHeader('Cache-Control', `s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
