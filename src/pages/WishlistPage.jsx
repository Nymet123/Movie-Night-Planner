import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import MovieCard from '../components/MovieCard';
import MovieSearchModal from '../components/MovieSearchModal';
import { normalizeMovie } from '../utils/tmdb';
import { getStreamingServices } from '../utils/watchmode';

export default function WishlistPage() {
  const { members, movies, addToWishlist, removeFromWishlist, reorderWishlist, cacheMovie, updateMovie } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fetchingStreaming, setFetchingStreaming] = useState(new Set());

  const member = members.find(m => m.id === selectedMemberId) || members[0];

  const wishlistMovies = (member?.wishlist || []).map(id => movies[id]).filter(Boolean);
  const allWishlistIds = (member?.wishlist || []);

  const fetchStreaming = useCallback(async (movieId) => {
    const id = movieId.toString();
    setFetchingStreaming(s => new Set([...s, id]));
    try {
      const services = await getStreamingServices(movieId, import.meta.env.VITE_WATCHMODE_API_KEY);
      updateMovie(movieId, { streamingServices: services });
    } finally {
      setFetchingStreaming(s => { const n = new Set(s); n.delete(id); return n; });
    }
  }, [updateMovie]);

  const handleSelect = useCallback((movie) => {
    if (!member) return;
    cacheMovie(normalizeMovie(movie));
    addToWishlist(member.id, movie.id);
    fetchStreaming(movie.id);
  }, [member, cacheMovie, addToWishlist, fetchStreaming]);

  const move = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= member.wishlist.length) return;
    reorderWishlist(member.id, idx, newIdx);
  };

  if (members.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-white mb-2">No members yet</h2>
          <p className="text-gray-400">Add family members first to manage their wishlists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Wishlists</h1>
        <div className="flex gap-2 flex-wrap">
          {member && (
            <button onClick={() => setSearchOpen(true)} className="btn-primary">
              + Add Movie
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMemberId(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors border ${
              member?.id === m.id
                ? 'border-current'
                : 'border-transparent bg-cinema-muted hover:bg-gray-600 text-gray-300'
            }`}
            style={member?.id === m.id ? { color: m.color, borderColor: m.color, backgroundColor: m.color + '22' } : {}}
          >
            <span
              className="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
              style={{ backgroundColor: m.color + '44', color: m.color }}
            >
              {m.name[0]}
            </span>
            <span>{m.name}</span>
            {m.kidsMode && <span className="text-xs opacity-75">🧒</span>}
            <span className="badge bg-black/30 text-xs">{m.wishlist.length}</span>
          </button>
        ))}
      </div>

      {member && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-bold flex-shrink-0 select-none"
              style={{ backgroundColor: member.color + '33', color: member.color }}
            >
              {member.name[0]}
            </span>
            <h2 className="text-lg font-semibold" style={{ color: member.color }}>
              {member.name}'s Wishlist
            </h2>
            <span className="text-gray-400 text-sm">({member.wishlist.length} movies)</span>
          </div>
          {member.kidsMode && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-900/20 border border-blue-700/40 rounded-lg text-sm text-blue-300">
              <span>🧒</span>
              <span>Kids Mode — suggestions for {member.name} are filtered to PG and below.</span>
            </div>
          )}

          {member.wishlist.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3">🎞️</div>
              <p className="text-gray-400 mb-4">No movies in {member.name}'s wishlist yet.</p>
              <button onClick={() => setSearchOpen(true)} className="btn-primary">
                Search & Add Movies
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {wishlistMovies.map((movie, idx) => (
                <div key={movie.id} className="flex items-stretch gap-2">
                  <div className="flex flex-col justify-center gap-1">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded bg-cinema-muted hover:bg-gray-600 disabled:opacity-20 text-gray-300 text-xs flex items-center justify-center"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === member.wishlist.length - 1}
                      className="w-7 h-7 rounded bg-cinema-muted hover:bg-gray-600 disabled:opacity-20 text-gray-300 text-xs flex items-center justify-center"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <MovieCard
                      movie={movie}
                      compact
                      rank={idx + 1}
                      actions={
                        <div className="flex gap-1">
                          {movie.streamingServices === null && (
                            <button
                              onClick={() => fetchStreaming(movie.id)}
                              disabled={fetchingStreaming.has(movie.id.toString())}
                              className="btn-ghost text-xs"
                              title="Look up streaming services"
                            >
                              {fetchingStreaming.has(movie.id.toString()) ? '...' : '📡'}
                            </button>
                          )}
                          <button
                            onClick={() => removeFromWishlist(member.id, movie.id)}
                            className="btn-ghost text-xs text-red-400 hover:text-red-300"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <MovieSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelect}
        excludeIds={allWishlistIds}
      />
    </div>
  );
}
