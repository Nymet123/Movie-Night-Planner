import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import { getRecommendations, getPopularMovies, getMovieWithCertification } from '../utils/tmdb';
import { getStreamingServices } from '../utils/watchmode';

const FAMILY_CERTS = new Set(['G', 'PG']);

function MemberButtons({ movie, members, added, onAdd }) {
  if (members.length === 0) return null;
  return (
    <div className="w-full">
      <p className="text-xs text-gray-500 mb-1">Add to list:</p>
      <div className="flex gap-1 flex-wrap">
        {members.map(m => {
          const inList = m.wishlist.includes(movie.id.toString());
          const justAdded = added.has(`${movie.id}_${m.id}`);
          const done = inList || justAdded;
          return (
            <button
              key={m.id}
              onClick={() => !done && onAdd(movie, m.id)}
              title={done ? `In ${m.name}'s list` : `Add to ${m.name}'s list`}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all select-none ${
                done ? 'cursor-default' : 'hover:scale-110 hover:brightness-125'
              }`}
              style={{ backgroundColor: m.color + (done ? '66' : '33'), color: m.color }}
            >
              {done ? '✓' : m.name[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionSection({ title, icon, movies, members, added, onAdd }) {
  if (movies.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-sm text-gray-500">({movies.length} movies)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            movie={movie}
            actions={<MemberButtons movie={movie} members={members} added={added} onAdd={onAdd} />}
          />
        ))}
      </div>
    </div>
  );
}

const Skeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="card overflow-hidden animate-pulse">
        <div className="aspect-[2/3] bg-cinema-muted" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-cinema-muted rounded w-3/4" />
          <div className="h-2 bg-cinema-muted rounded w-1/2" />
          <div className="h-8 bg-cinema-muted rounded mt-2" />
        </div>
      </div>
    ))}
  </div>
);

export default function SuggestionsPage() {
  const { members, watchHistory, settings, cacheMovie, addToWishlist } = useApp();
  const [family, setFamily] = useState([]);
  const [grownups, setGrownups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [added, setAdded] = useState(new Set());

  const handleAdd = useCallback((movie, memberId) => {
    cacheMovie(movie);
    addToWishlist(memberId, movie.id);
    setAdded(s => new Set([...s, `${movie.id}_${memberId}`]));
  }, [cacheMovie, addToWishlist]);

  const fetchSuggestions = useCallback(async () => {
    if (!settings.tmdbApiKey) {
      setError('Add your TMDB API key in Settings to get suggestions.');
      return;
    }
    setLoading(true);
    setError('');
    setFamily([]);
    setGrownups([]);
    setAdded(new Set());

    try {
      const watchedIds = new Set(watchHistory.map(r => r.movieId?.toString()));
      const wishlistedIds = new Set(members.flatMap(m => m.wishlist));

      // Fetch recommendations for the last 5 unique watched movies, fall back to popular
      const recentIds = [...new Set(watchHistory.map(r => r.movieId))].slice(0, 5);

      setLoadingMsg('Fetching recommendations…');
      let candidates;
      if (recentIds.length > 0) {
        const results = await Promise.all(
          recentIds.map(id => getRecommendations(id, settings.tmdbApiKey).catch(() => []))
        );
        candidates = results.flat();
      } else {
        candidates = await getPopularMovies(settings.tmdbApiKey);
      }

      // Deduplicate, strip already-watched and already-wishlisted
      const seen = new Set();
      const filtered = [];
      for (const m of candidates) {
        const sid = m.id.toString();
        if (seen.has(sid) || watchedIds.has(sid) || wishlistedIds.has(sid)) continue;
        seen.add(sid);
        filtered.push(m);
      }

      // Sort by TMDB rating, cap at 30 for the certification fetch
      filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      const top = filtered.slice(0, 30);

      setLoadingMsg('Looking up ratings…');
      const withCerts = await Promise.all(
        top.map(m => getMovieWithCertification(m.id, settings.tmdbApiKey).catch(() => m))
      );

      setLoadingMsg('Checking streaming…');
      const streamingResults = await Promise.all(
        withCerts.map(m =>
          getStreamingServices(m.id, import.meta.env.VITE_WATCHMODE_API_KEY).catch(() => null)
        )
      );

      const final = withCerts.map((m, i) => ({
        ...m,
        streamingServices: streamingResults[i] ?? null,
      }));

      final.forEach(m => cacheMovie(m));

      setFamily(final.filter(m => FAMILY_CERTS.has(m.certification)));
      setGrownups(final.filter(m => !FAMILY_CERTS.has(m.certification)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }, [settings.tmdbApiKey, watchHistory, members, cacheMovie]);

  const adultMembers = members.filter(m => !m.kidsMode);
  const hasSuggestions = family.length > 0 || grownups.length > 0;
  const recentCount = Math.min(5, new Set(watchHistory.map(r => r.movieId)).size);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Suggestions</h1>
          <p className="text-gray-400 text-sm">
            {recentCount > 0
              ? `Based on the last ${recentCount} movie${recentCount !== 1 ? 's' : ''} you watched`
              : 'Popular picks to get you started'}
          </p>
        </div>
        <button onClick={fetchSuggestions} disabled={loading} className="btn-primary">
          {loading ? (loadingMsg || 'Loading…') : '✨ Get Suggestions'}
        </button>
      </div>

      {!settings.tmdbApiKey && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 text-sm text-amber-300">
          <strong>TMDB API key required.</strong> Add your free key in <strong>Settings</strong> to get personalized suggestions.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">{error}</div>
      )}

      {loading && (
        <div className="space-y-8">
          <div>
            <div className="h-7 w-48 bg-cinema-muted rounded animate-pulse mb-4" />
            <Skeleton />
          </div>
        </div>
      )}

      {!loading && hasSuggestions && (
        <div className="space-y-12">
          <SuggestionSection
            title="Whole Family"
            icon="🎬"
            movies={family}
            members={members}
            added={added}
            onAdd={handleAdd}
          />
          <SuggestionSection
            title="Grown-Ups"
            icon="🍿"
            movies={grownups}
            members={adultMembers}
            added={added}
            onAdd={handleAdd}
          />
        </div>
      )}

      {!loading && !hasSuggestions && settings.tmdbApiKey && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-xl font-semibold text-white mb-2">Ready to suggest movies</h2>
          <p className="text-gray-400 mb-4">
            {watchHistory.length > 0
              ? "We'll find movies similar to your recent watches."
              : "We'll pull popular movies to get you started — or log some movie nights first for personalized picks."}
          </p>
          <button onClick={fetchSuggestions} className="btn-primary">Get Suggestions</button>
        </div>
      )}
    </div>
  );
}
