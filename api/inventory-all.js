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

async function fetchPage(page, retries = 2) {
  const url = `https://api.discogs.com/users/${SELLER}/inventory?per_page=100&page=${page}&sort=listed&sort_order=desc`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 1000));
    return fetchPage(page, retries - 1);
  }
  if (!res.ok) throw new Error(`page ${page}: HTTP ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  try {
    const first      = await fetchPage(1);
    const totalPages = first.pagination.pages;
    let listings     = first.listings.map(trim);

    // Batches de 5 pages en parallèle pour rester sous le rate-limit Discogs
    for (let b = 0; b < Math.ceil((totalPages - 1) / 5); b++) {
      const start = 2 + b * 5;
      const pages = [];
      for (let p = start; p <= Math.min(start + 4, totalPages); p++) pages.push(p);
      const results = await Promise.all(pages.map(fetchPage));
      for (const d of results) listings = listings.concat(d.listings.map(trim));
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json(listings);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
