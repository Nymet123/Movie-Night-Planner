import { MANUAL_SENTINEL } from '../utils/watchmode';

// Brand colors for the five featured streaming services
const SERVICE_STYLES = {
  'Netflix':     { bg: '#E50914', color: '#fff' },
  'Disney+':     { bg: '#113CCF', color: '#fff' },
  'Hulu':        { bg: '#1CE783', color: '#000' },
  'Prime Video': { bg: '#00A8E0', color: '#fff' },
  'Max':         { bg: '#002BE7', color: '#fff' },
};

export default function StreamingBadge({ service }) {
  if (service.name === MANUAL_SENTINEL) {
    return (
      <span
        className="badge bg-gray-700 text-gray-400 text-xs"
        title="Could not fetch automatically — check a streaming guide"
      >
        🔍 Check manually
      </span>
    );
  }

  const style = SERVICE_STYLES[service.name];

  if (style) {
    return (
      <span
        className="badge text-xs font-semibold"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {service.name}
      </span>
    );
  }

  // Fallback for other services (or old TMDB-sourced entries that have a logo URL)
  return (
    <span className="badge bg-gray-700 text-gray-300 text-xs flex items-center gap-1">
      {service.logo && (
        <img src={service.logo} alt={service.name} className="w-3 h-3 rounded-sm object-contain" />
      )}
      <span className="truncate max-w-[80px]">{service.name}</span>
    </span>
  );
}

export function StreamingList({ services, limit = 4 }) {
  if (!services || services.length === 0) {
    return <span className="text-xs text-gray-600">Not on streaming</span>;
  }

  if (services.length === 1 && services[0].name === MANUAL_SENTINEL) {
    return (
      <span className="text-xs text-gray-500 flex items-center gap-1">
        🔍 <span>Check manually</span>
      </span>
    );
  }

  const shown = services.slice(0, limit);
  const rest = services.length - limit;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(s => <StreamingBadge key={s.name} service={s} />)}
      {rest > 0 && (
        <span className="badge bg-gray-700 text-gray-400">+{rest}</span>
      )}
    </div>
  );
}
