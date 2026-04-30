const BASE = 'https://api.themoviedb.org/3';

export const posterUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export const logoUrl = (path) =>
  path ? `https://image.tmdb.org/t/p/w92${path}` : null;

async function get(endpoint, apiKey, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid TMDB API key. Check Settings.');
    throw new Error(`TMDB error ${res.status}`);
  }
  return res.json();
}

export async function searchMovies(query, apiKey) {
  const data = await get('/search/movie', apiKey, { query, include_adult: false, language: 'en-US' });
  return (data.results || []).map(normalizeMovie);
}

export async function getMovieDetails(id, apiKey) {
  const data = await get(`/movie/${id}`, apiKey, { language: 'en-US' });
  return normalizeMovie(data);
}

export async function getWatchProviders(id, apiKey) {
  const data = await get(`/movie/${id}/watch/providers`, apiKey);
  const region = data.results?.US || data.results?.GB || Object.values(data.results || {})[0] || {};
  const seen = new Set();
  const services = [];
  const typeOrder = ['flatrate', 'free', 'ads', 'rent', 'buy'];
  for (const type of typeOrder) {
    for (const p of region[type] || []) {
      if (!seen.has(p.provider_name)) {
        seen.add(p.provider_name);
        services.push({ name: p.provider_name, logo: logoUrl(p.logo_path), type });
      }
    }
  }
  return services;
}

export async function getMovieTrailerKey(id, apiKey) {
  const data = await get(`/movie/${id}/videos`, apiKey);
  const results = data.results || [];
  const trailer = results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || results.find(v => v.site === 'YouTube');
  return trailer?.key || null;
}

export async function getRecommendations(id, apiKey) {
  const data = await get(`/movie/${id}/recommendations`, apiKey, { language: 'en-US' });
  return (data.results || []).map(normalizeMovie);
}

export async function discoverByGenres(genreIds, apiKey, kidsMode = false) {
  const params = {
    with_genres: genreIds.join(','),
    sort_by: 'vote_average.desc',
    'vote_count.gte': 200,
    language: 'en-US',
    include_adult: false,
  };
  if (kidsMode) {
    params.certification_country = 'US';
    params['certification.lte'] = 'PG';
  }
  const data = await get('/discover/movie', apiKey, params);
  return (data.results || []).map(normalizeMovie);
}

export async function getPopularMovies(apiKey, kidsMode = false) {
  const params = { language: 'en-US', include_adult: false };
  if (kidsMode) {
    const data = await get('/discover/movie', apiKey, {
      ...params,
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
      certification_country: 'US',
      'certification.lte': 'PG',
    });
    return (data.results || []).map(normalizeMovie);
  }
  const data = await get('/movie/popular', apiKey, params);
  return (data.results || []).map(normalizeMovie);
}

export async function getTopRatedMovies(apiKey) {
  const data = await get('/movie/top_rated', apiKey, { language: 'en-US' });
  return (data.results || []).map(normalizeMovie);
}

export async function getMovieWithCertification(id, apiKey) {
  const data = await get(`/movie/${id}`, apiKey, {
    language: 'en-US',
    append_to_response: 'release_dates',
  });
  const usRelease = (data.release_dates?.results || []).find(r => r.iso_3166_1 === 'US');
  const cert = (usRelease?.release_dates || []).find(rd => rd.certification)?.certification || null;
  return { ...normalizeMovie(data), certification: cert };
}

export function normalizeMovie(raw) {
  return {
    id: raw.id,
    title: raw.title || raw.name || 'Unknown',
    year: raw.release_date ? parseInt(raw.release_date) : null,
    overview: raw.overview || '',
    poster_path: raw.poster_path || null,
    backdrop_path: raw.backdrop_path || null,
    genres: raw.genres
      ? raw.genres
      : (raw.genre_ids || []).map(id => ({ id, name: GENRE_NAMES[id] || 'Unknown' })),
    vote_average: raw.vote_average ? Math.round(raw.vote_average * 10) / 10 : null,
    runtime: raw.runtime || null,
    certification: raw.certification || null,
    streamingServices: null,
    trailerKey: null,
  };
}

export const GENRE_NAMES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

export const STREAMING_COLORS = {
  Netflix: 'bg-red-900 text-red-200',
  'Disney+': 'bg-blue-900 text-blue-200',
  'Amazon Prime Video': 'bg-cyan-900 text-cyan-200',
  'Apple TV+': 'bg-gray-800 text-gray-200',
  'HBO Max': 'bg-purple-900 text-purple-200',
  'Max': 'bg-purple-900 text-purple-200',
  Hulu: 'bg-green-900 text-green-200',
  'Paramount+': 'bg-blue-900 text-blue-200',
  Peacock: 'bg-yellow-900 text-yellow-200',
};
