const ALLOWED = ['vinyl-run.com', 'vinyl-run.vercel.app'];
const SELLER  = 'Vinylrun974';
const TOKEN   = process.env.DISCOGS_TOKEN;
const HEADERS = {
  'User-Agent':    'VinylRun/1.0',
  'Authorization': `Discogs token=${TOKEN}`,
};

function trim(l) {
  const r = l.release;
  return {
    uri:            l.uri,
    condition:      l.condition,
    price:          { value: l.price?.value },
    original_price: l.original_price ? { formatted: l.original_price.formatted } : null,
    release: {
      id:        r.id,
      artist:    r.artist,
      title:     r.title,
      format:    r.format,
      year:      r.year,
      thumbnail: r.thumbnail,
    },
  };
}

async function fetchPage(page, retries = 3) {
  const url = `https://api.discogs.com/users/${SELLER}/inventory?per_page=100&page=${page}`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 500));
    return fetchPage(page, retries - 1);
  }
  if (!res.ok) throw new Error(`page ${page}: HTTP ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && !ALLOWED.some(h => origin.includes(h))) return res.status(403).end();
  try {
    const first      = await fetchPage(1);
    const totalPages = first.pagination.pages;
    let listings     = first.listings.map(trim);

    for (let p = 2; p <= totalPages; p++) {
      const data = await fetchPage(p);
      listings = listings.concat(data.listings.map(trim));
    }

    const seen = new Set();
    listings = listings.filter(l => seen.has(l.uri) ? false : seen.add(l.uri));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json(listings);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
