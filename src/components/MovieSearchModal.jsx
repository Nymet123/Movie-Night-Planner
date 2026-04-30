import { useState, useCallback } from 'react';
import Modal from './Modal';
import { posterUrl, searchMovies, normalizeMovie } from '../utils/tmdb';
import { useApp } from '../context/AppContext';

export default function MovieSearchModal({ isOpen, onClose, onSelect, excludeIds = [] }) {
  const { settings } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!settings.tmdbApiKey) {
      setError('Add your TMDB API key in Settings first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const movies = await searchMovies(query.trim(), settings.tmdbApiKey);
      setResults(movies);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, settings.tmdbApiKey]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError('');
    setSearched(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Search Movies" width="max-w-2xl">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Search for a movie..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {!settings.tmdbApiKey && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 mb-4 text-sm text-amber-300">
          Add your free TMDB API key in <strong>Settings</strong> to search movies.
          Get one at <span className="underline">themoviedb.org/settings/api</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {results.map(movie => {
          const excluded = excludeIds.includes(movie.id.toString());
          return (
            <button
              key={movie.id}
              disabled={excluded}
              onClick={() => { onSelect(movie); handleClose(); }}
              className="w-full flex gap-3 p-3 rounded-lg bg-cinema-muted hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors"
            >
              <div className="shrink-0">
                {posterUrl(movie.poster_path, 'w92') ? (
                  <img
                    src={posterUrl(movie.poster_path, 'w92')}
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-cinema-border rounded flex items-center justify-center">
                    <span>🎞️</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{movie.title}</span>
                  {movie.year && <span className="text-gray-400 text-xs">({movie.year})</span>}
                  {excluded && <span className="badge bg-green-900 text-green-300 text-xs ml-auto">Already added</span>}
                </div>
                {movie.vote_average && (
                  <span className="text-amber-400 text-xs">★ {movie.vote_average}</span>
                )}
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{movie.overview}</p>
              </div>
            </button>
          );
        })}
        {searched && results.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-8">No results found.</p>
        )}
      </div>
    </Modal>
  );
}
