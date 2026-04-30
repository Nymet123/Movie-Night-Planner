import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getMovieTrailerKey, posterUrl } from '../utils/tmdb';

function TrailerEmbed({ trailerKey, title }) {
  const [show, setShow] = useState(false);

  if (!trailerKey) {
    return (
      <div className="aspect-video bg-cinema-muted rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-2">🎞️</div>
          <p className="text-sm">No trailer available</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="aspect-video w-full rounded-lg relative overflow-hidden group"
        style={{ display: 'block' }}
      >
        <img
          src={`https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg`}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function TrailersPage() {
  const { members, movies, settings, updateMovie } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const member = members.find(m => m.id === selectedMemberId) || members[0];
  const top5Ids = (member?.wishlist || []).slice(0, 5);
  const top5 = top5Ids.map(id => movies[id]).filter(Boolean);

  const fetchTrailers = useCallback(async () => {
    if (!settings.tmdbApiKey) {
      setError('Add your TMDB API key in Settings to fetch trailers.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      for (const movie of top5) {
        if (movie.trailerKey) continue;
        const key = await getMovieTrailerKey(movie.id, settings.tmdbApiKey);
        updateMovie(movie.id, { trailerKey: key || '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings.tmdbApiKey, top5, updateMovie]);

  const openYouTubePlaylist = () => {
    const keys = top5.map(m => m.trailerKey).filter(Boolean);
    if (keys.length === 0) {
      alert('Fetch trailers first to create a YouTube playlist.');
      return;
    }
    const url = `https://www.youtube.com/watch_videos?video_ids=${keys.join(',')}`;
    window.open(url, '_blank');
  };

  const trailersFetched = top5.some(m => m.trailerKey !== null && m.trailerKey !== undefined);

  if (members.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold text-white mb-2">Add members first</h2>
          <p className="text-gray-400">Add family members and their wishlists to see trailers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Trailers</h1>
          <p className="text-gray-400 text-sm">Top 5 movies from each wishlist</p>
        </div>
        <div className="flex gap-2">
          {trailersFetched && (
            <button onClick={openYouTubePlaylist} className="btn-secondary text-sm">
              ▶ Open YouTube Playlist
            </button>
          )}
          <button onClick={fetchTrailers} disabled={loading} className="btn-primary">
            {loading ? 'Fetching...' : '🎬 Fetch Trailers'}
          </button>
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
            {m.emoji} {m.name}
            <span className="badge bg-black/30 text-xs">{Math.min(m.wishlist.length, 5)}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!settings.tmdbApiKey && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 text-sm text-amber-300">
          Add your TMDB API key in <strong>Settings</strong> to fetch trailers.
        </div>
      )}

      {member && top5.length === 0 && (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400">{member.name} has no movies in their wishlist yet.</p>
        </div>
      )}

      {member && top5.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: member.color }}>
            {member.emoji} {member.name}'s Top {top5.length}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {top5.map((movie, idx) => (
              <div key={movie.id} className="card overflow-hidden">
                <TrailerEmbed trailerKey={movie.trailerKey} title={movie.title} />
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-gray-400">{movie.year}</p>
                    </div>
                  </div>
                  {movie.trailerKey && (
                    <a
                      href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-red-400 hover:text-red-300 mt-2 block"
                    >
                      ▶ Watch on YouTube
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {trailersFetched && (
            <div className="mt-6 card p-4">
              <h3 className="font-semibold text-white mb-2">YouTube Playlist Links</h3>
              <p className="text-sm text-gray-400 mb-3">
                Open all trailers as a YouTube playlist, or copy individual links:
              </p>
              <div className="space-y-2">
                {top5.filter(m => m.trailerKey).map((movie, idx) => (
                  <div key={movie.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 w-4">{idx + 1}.</span>
                    <span className="text-white flex-1 truncate">{movie.title}</span>
                    <a
                      href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 hover:text-red-300 shrink-0"
                    >
                      YouTube ↗
                    </a>
                  </div>
                ))}
              </div>
              <button
                onClick={openYouTubePlaylist}
                className="btn-primary mt-3 w-full"
              >
                ▶ Open All as YouTube Playlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
