const BASE = 'https://api.watchmode.com/v1';

// Sentinel value stored in streamingServices when the API is unavailable or the lookup fails
export const MANUAL_SENTINEL = '__manual__';

// The five services we surface in the UI, plus name normalization for what Watchmode returns
const FEATURED = new Set(['Netflix', 'Disney+', 'Hulu', 'Prime Video', 'Max']);
const NAME_MAP = {
  'Amazon Prime Video': 'Prime Video',
  'HBO Max': 'Max',
};

async function get(endpoint, apiKey, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('apiKey', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Watchmode ${res.status}`);
  return res.json();
}

export async function getStreamingServices(tmdbId, apiKey) {
  if (!apiKey) return [{ name: MANUAL_SENTINEL }];

  try {
    // Step 1: resolve TMDB ID → Watchmode title ID
    const search = await get('/search/', apiKey, {
      search_field: 'tmdb_movie_id',
      search_value: tmdbId,
      types: 'movie',
    });

    const titleId = search.title_results?.[0]?.id;
    if (!titleId) return [];

    // Step 2: get US subscription sources for that title
    const sources = await get(`/title/${titleId}/sources/`, apiKey, { regions: 'US' });

    const seen = new Set();
    const services = [];

    for (const s of Array.isArray(sources) ? sources : []) {
      if (s.type !== 'sub') continue;
      const name = NAME_MAP[s.name] ?? s.name;
      if (!FEATURED.has(name) || seen.has(name)) continue;
      seen.add(name);
      services.push({ name });
    }

    return services;
  } catch {
    return [{ name: MANUAL_SENTINEL }];
  }
}
