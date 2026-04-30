import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';
import { posterUrl } from '../utils/tmdb';

const FREQ_LABELS = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly' };
const FREQ_DAYS = { weekly: 7, biweekly: 14, monthly: 30 };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getUpcomingNights(schedule, members, count = 8) {
  if (!members.length) return [];
  const freq = FREQ_DAYS[schedule.movieNightFrequency] || 7;
  const dayOfWeek = schedule.movieNightDay ?? 5;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let d = new Date(today);
  const daysUntil = ((dayOfWeek - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);

  const nights = [];
  let idx = schedule.currentIndex % members.length;
  for (let i = 0; i < count; i++) {
    nights.push({ date: new Date(d), member: members[idx] });
    d = new Date(d.getTime() + freq * 86400000);
    idx = (idx + 1) % members.length;
  }
  return nights;
}

export default function SchedulePage() {
  const { members, movies, schedule, settings, watchHistory, addWatchRecord, advanceSchedule, updateSettings } = useApp();
  const [movieNightOpen, setMovieNightOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [ratings, setRatings] = useState({});
  const [attendees, setAttendees] = useState([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currentMember = members.length > 0 ? members[schedule.currentIndex % members.length] : null;
  const upcoming = getUpcomingNights(schedule, members);
  const currentWishlist = (currentMember?.wishlist || []).map(id => movies[id]).filter(Boolean);

  const openMovieNight = () => {
    setAttendees(members.map(m => m.id));
    setRatings({});
    setSelectedMovieId(currentMember?.wishlist?.[0] || '');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setMovieNightOpen(true);
  };

  const handleLogMovieNight = () => {
    if (!selectedMovieId || !currentMember) return;
    addWatchRecord({
      movieId: selectedMovieId,
      date,
      scheduledMemberId: currentMember.id,
      attendees,
      ratings,
      notes,
    });
    setMovieNightOpen(false);
  };

  const toggleAttendee = (id) => {
    setAttendees(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  };

  if (members.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-white mb-2">Add members first</h2>
          <p className="text-gray-400">Add family members to set up your round-robin schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Movie Night Schedule</h1>
        <div className="flex gap-2">
          <button onClick={advanceSchedule} className="btn-secondary text-sm" title="Skip to next person">
            Skip Turn ⏭
          </button>
          <button onClick={openMovieNight} className="btn-primary">
            🎬 Log Movie Night
          </button>
        </div>
      </div>

      {/* Schedule settings */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Frequency:</span>
          <select
            className="input w-auto text-sm"
            value={settings.movieNightFrequency}
            onChange={e => updateSettings({ movieNightFrequency: e.target.value })}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 Weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Day:</span>
          <select
            className="input w-auto text-sm"
            value={settings.movieNightDay ?? 5}
            onChange={e => updateSettings({ movieNightDay: parseInt(e.target.value) })}
          >
            {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-500">
          Rotation: {members.map(m => m.name).join(' → ')} → (repeat)
        </span>
      </div>

      {/* Next up */}
      {currentMember && (
        <div
          className="card p-6 relative overflow-hidden"
          style={{ borderColor: currentMember.color + '66' }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{ background: `radial-gradient(circle at top right, ${currentMember.color}, transparent 60%)` }}
          />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: currentMember.color + '33', border: `2px solid ${currentMember.color}` }}
            >
              {currentMember.emoji}
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Next movie night pick:</p>
              <h2 className="text-2xl font-bold" style={{ color: currentMember.color }}>
                {currentMember.name}
              </h2>
              {upcoming[0] && (
                <p className="text-gray-300 text-sm mt-1">
                  {upcoming[0].date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
            {currentWishlist[0] && (
              <div className="flex items-center gap-3 card p-3">
                {posterUrl(currentWishlist[0].poster_path, 'w92') ? (
                  <img
                    src={posterUrl(currentWishlist[0].poster_path, 'w92')}
                    alt={currentWishlist[0].title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : <span className="text-2xl">🎞️</span>}
                <div>
                  <p className="text-xs text-gray-400">Top pick</p>
                  <p className="text-sm font-medium text-white">{currentWishlist[0].title}</p>
                  <p className="text-xs text-gray-400">{currentWishlist[0].year}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming schedule */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Upcoming Nights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcoming.map((night, i) => (
            <div key={i} className={`card p-3 ${i === 0 ? 'ring-1 ring-amber-500/50' : ''}`}>
              <p className="text-xs text-gray-400 mb-1">
                {night.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {i === 0 && <span className="ml-1 text-amber-400">← next</span>}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{night.member.emoji}</span>
                <span className="font-medium text-white text-sm">{night.member.name}</span>
              </div>
              {(night.member.wishlist || []).length > 0 && movies[night.member.wishlist[0]] && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  🎬 {movies[night.member.wishlist[0]].title}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {watchHistory.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Recent Movie Nights</h2>
          <div className="space-y-2">
            {watchHistory.slice(0, 5).map(record => {
              const movie = movies[record.movieId];
              const host = members.find(m => m.id === record.scheduledMemberId);
              const avgRating = Object.values(record.ratings || {}).length > 0
                ? (Object.values(record.ratings).reduce((a, b) => a + b, 0) / Object.values(record.ratings).length).toFixed(1)
                : null;
              return (
                <div key={record.id} className="card p-3 flex items-center gap-3">
                  {movie && posterUrl(movie.poster_path, 'w92') ? (
                    <img src={posterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-8 h-12 object-cover rounded" />
                  ) : <span className="text-xl">🎞️</span>}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{movie?.title || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">
                      {record.date} · {host?.emoji} {host?.name}'s pick
                    </p>
                  </div>
                  {avgRating && (
                    <span className="text-amber-400 text-sm">★ {avgRating}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log movie night modal */}
      <Modal isOpen={movieNightOpen} onClose={() => setMovieNightOpen(false)} title="Log Movie Night" width="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {currentMember && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Movie — {currentMember.emoji} {currentMember.name}'s pick
              </label>
              <select
                className="input"
                value={selectedMovieId}
                onChange={e => setSelectedMovieId(e.target.value)}
              >
                <option value="">Select a movie...</option>
                {currentWishlist.map(m => (
                  <option key={m.id} value={m.id}>{m.title} {m.year ? `(${m.year})` : ''}</option>
                ))}
                {currentWishlist.length === 0 && (
                  <option disabled>No movies in wishlist</option>
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Who watched?</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleAttendee(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    attendees.includes(m.id)
                      ? 'border-current'
                      : 'border-cinema-border bg-cinema-muted text-gray-400 hover:bg-gray-600'
                  }`}
                  style={attendees.includes(m.id) ? { color: m.color, borderColor: m.color, backgroundColor: m.color + '22' } : {}}
                >
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
          </div>

          {attendees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ratings</label>
              <div className="space-y-2">
                {attendees.map(id => {
                  const m = members.find(x => x.id === id);
                  if (!m) return null;
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{m.emoji} {m.name}</span>
                      <StarRating
                        value={ratings[id] || 0}
                        onChange={val => setRatings(r => ({ ...r, [id]: val }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="How was the movie? Any thoughts..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setMovieNightOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleLogMovieNight}
              disabled={!selectedMovieId}
              className="btn-primary"
            >
              Log Movie Night
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
