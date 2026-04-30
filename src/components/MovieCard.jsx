import { posterUrl } from '../utils/tmdb';
import { StreamingList } from './StreamingBadge';

const CERT_STYLE = {
  'G':     'bg-green-900/90 text-green-200',
  'PG':    'bg-amber-900/90 text-amber-200',
  'PG-13': 'bg-orange-900/90 text-orange-200',
  'R':     'bg-red-900/90 text-red-200',
  'NC-17': 'bg-purple-900/90 text-purple-200',
};

export default function MovieCard({ movie, actions, compact = false, rank }) {
  const poster = posterUrl(movie.poster_path, compact ? 'w185' : 'w342');
  const genres = (movie.genres || []).slice(0, 3).map(g => g.name || g).filter(Boolean);

  if (compact) {
    return (
      <div className="flex gap-3 p-3 card hover:border-gray-600 transition-colors group">
        <div className="shrink-0 relative">
          {rank != null && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center z-10">
              {rank}
            </span>
          )}
          {poster ? (
            <img src={poster} alt={movie.title} className="w-12 h-18 rounded object-cover" style={{ height: '72px', width: '48px' }} />
          ) : (
            <div className="w-12 h-18 rounded bg-cinema-muted flex items-center justify-center" style={{ height: '72px', width: '48px' }}>
              <span className="text-2xl">🎞️</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{movie.title}</p>
              <p className="text-xs text-gray-400">{movie.year}</p>
            </div>
            {actions && <div className="flex gap-1 shrink-0">{actions}</div>}
          </div>
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {genres.map(g => (
                <span key={g} className="badge bg-cinema-muted text-gray-400 text-xs">{g}</span>
              ))}
            </div>
          )}
          {movie.streamingServices && (
            <div className="mt-1">
              <StreamingList services={movie.streamingServices} limit={3} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card hover:border-gray-600 transition-colors overflow-hidden group flex flex-col">
      <div className="relative">
        {poster ? (
          <img src={poster} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
        ) : (
          <div className="w-full aspect-[2/3] bg-cinema-muted flex items-center justify-center">
            <span className="text-5xl">🎞️</span>
          </div>
        )}
        {movie.vote_average && (
          <span className="absolute top-2 right-2 bg-black/80 text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded">
            ★ {movie.vote_average}
          </span>
        )}
        {rank != null && (
          <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
        )}
        {movie.certification && rank == null && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded ${CERT_STYLE[movie.certification] ?? 'bg-gray-800/90 text-gray-300'}`}>
            {movie.certification}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight">{movie.title}</h3>
          <p className="text-xs text-gray-400">{movie.year}</p>
        </div>
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.map(g => (
              <span key={g} className="badge bg-cinema-muted text-gray-400">{g}</span>
            ))}
          </div>
        )}
        {movie.streamingServices && (
          <StreamingList services={movie.streamingServices} limit={2} />
        )}
        {movie.overview && !compact && (
          <p className="text-xs text-gray-500 line-clamp-3">{movie.overview}</p>
        )}
        {actions && <div className="mt-auto pt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
