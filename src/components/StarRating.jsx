export default function StarRating({ value, onChange, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const sz = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex gap-0.5">
      {stars.map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${sz} transition-transform ${onChange ? 'hover:scale-125 cursor-pointer' : 'cursor-default'} ${
            star <= (value || 0) ? 'text-amber-400' : 'text-gray-600'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function StarDisplay({ value, size = 'sm' }) {
  return <StarRating value={value} size={size} />;
}
