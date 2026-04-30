import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import StarRating from '../components/StarRating';
import { posterUrl } from '../utils/tmdb';

function AddRecordModal({ isOpen, onClose }) {
  const { members, movies, addWatchRecord } = useApp();
  const [movieSearch, setMovieSearch] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendees, setAttendees] = useState(members.map(m => m.id));
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState('');

  const allMovies = Object.values(movies);
  const filtered = movieSearch
    ? allMovies.filter(m => m.title.toLowerCase().includes(movieSearch.toLowerCase()))
    : allMovies;

  const handleSubmit = () => {
    if (!selectedMovieId || !selectedMemberId) return;
    addWatchRecord({ movieId: selectedMovieId, date, scheduledMemberId: selectedMemberId, attendees, ratings, notes });
    onClose();
  };

  const toggleAttendee = (id) =>
    setAttendees(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Watch Record" width="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Movie</label>
          <input
            className="input mb-2"
            placeholder="Search movie from cache..."
            value={movieSearch}
            onChange={e => setMovieSearch(e.target.value)}
          />
          <select
            className="input"
            value={selectedMovieId}
            onChange={e => setSelectedMovieId(e.target.value)}
            size={5}
          >
            <option value="">Select...</option>
            {filtered.map(m => (
              <option key={m.id} value={m.id}>{m.title} {m.year ? `(${m.year})` : ''}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Chosen by</label>
            <select className="input" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)}>
              {members.map(m => <option key={m.id} value={m.id}>{m.name[0]} — {m.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Who watched?</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleAttendee(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  attendees.includes(m.id) ? 'border-current' : 'border-cinema-border bg-cinema-muted text-gray-400'
                }`}
                style={attendees.includes(m.id) ? { color: m.color, borderColor: m.color, backgroundColor: m.color + '22' } : {}}
              >
                <span
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
                  style={{ backgroundColor: m.color + '44', color: attendees.includes(m.id) ? m.color : '#9ca3af' }}
                >
                  {m.name[0]}
                </span>
                {m.name}
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
                    <span className="text-sm text-gray-300 flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
                        style={{ backgroundColor: m.color + '33', color: m.color }}
                      >
                        {m.name[0]}
                      </span>
                      {m.name}
                    </span>
                    <StarRating value={ratings[id] || 0} onChange={val => setRatings(r => ({ ...r, [id]: val }))} />
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
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any thoughts about the movie..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={!selectedMovieId} className="btn-primary">Add Record</button>
        </div>
      </div>
    </Modal>
  );
}

export default function HistoryPage() {
  const { members, movies, watchHistory, removeWatchRecord, updateWatchRecord } = useApp();
  const [filterMemberId, setFilterMemberId] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editingRatings, setEditingRatings] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = filterMemberId === 'all'
    ? watchHistory
    : watchHistory.filter(r =>
        r.scheduledMemberId === filterMemberId ||
        (r.attendees || []).includes(filterMemberId)
      );

  const totalMovies = watchHistory.length;
  const allRatings = watchHistory.flatMap(r => Object.values(r.ratings || {})).filter(Boolean);
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  const editRecord = watchHistory.find(r => r.id === editingRatings);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Watch History</h1>
          <p className="text-gray-400 text-sm">{totalMovies} movies watched {avgRating && `· avg ★ ${avgRating}`}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          + Add Record
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterMemberId('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors border ${
            filterMemberId === 'all'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent bg-cinema-muted hover:bg-gray-600 text-gray-300'
          }`}
        >
          All Members
        </button>
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => setFilterMemberId(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors border ${
              filterMemberId === m.id
                ? 'border-current'
                : 'border-transparent bg-cinema-muted hover:bg-gray-600 text-gray-300'
            }`}
            style={filterMemberId === m.id ? { color: m.color, borderColor: m.color, backgroundColor: m.color + '22' } : {}}
          >
            <span
              className="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
              style={{ backgroundColor: m.color + '44', color: m.color }}
            >
              {m.name[0]}
            </span>
            {m.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📖</div>
          <h2 className="text-xl font-semibold text-white mb-2">No watch history yet</h2>
          <p className="text-gray-400 mb-4">Log your first movie night to start tracking.</p>
          <button onClick={() => setAddOpen(true)} className="btn-primary">Add First Record</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => {
            const movie = movies[record.movieId];
            const host = members.find(m => m.id === record.scheduledMemberId);
            const attendeeMembers = (record.attendees || []).map(id => members.find(m => m.id === id)).filter(Boolean);
            const allRatingsArr = Object.entries(record.ratings || {});
            const avg = allRatingsArr.length > 0
              ? (allRatingsArr.reduce((a, [, v]) => a + v, 0) / allRatingsArr.length).toFixed(1)
              : null;

            return (
              <div key={record.id} className="card p-4 flex gap-4">
                <div className="shrink-0">
                  {movie && posterUrl(movie.poster_path) ? (
                    <img src={posterUrl(movie.poster_path, 'w92')} alt={movie?.title} className="w-14 h-20 object-cover rounded" />
                  ) : (
                    <div className="w-14 h-20 bg-cinema-muted rounded flex items-center justify-center">
                      <span className="text-2xl">🎞️</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">{movie?.title || 'Unknown Movie'}</h3>
                      <p className="text-xs text-gray-400">
                        {record.date}
                        {host && <span> · {host.name}'s pick</span>}
                        {movie?.year && <span> · {movie.year}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setEditingRatings(record.id)}
                        className="btn-ghost text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(record.id)}
                        className="btn-ghost text-xs text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {avg && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-amber-400 font-bold">★ {avg}</span>
                      <span className="text-xs text-gray-500">avg</span>
                    </div>
                  )}
                  {allRatingsArr.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {allRatingsArr.map(([memberId, rating]) => {
                        const m = members.find(x => x.id === memberId);
                        if (!m) return null;
                        return (
                          <div key={memberId} className="flex items-center gap-1 text-xs">
                            <span
                              className="w-4 h-4 rounded-full inline-flex items-center justify-center text-xs font-bold select-none"
                              style={{ backgroundColor: m.color + '33', color: m.color }}
                            >
                              {m.name[0]}
                            </span>
                            <span className="text-amber-400">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {attendeeMembers.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {attendeeMembers.map(m => (
                        <span
                          key={m.id}
                          title={m.name}
                          className="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold select-none"
                          style={{ backgroundColor: m.color + '33', color: m.color }}
                        >
                          {m.name[0]}
                        </span>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">watched</span>
                    </div>
                  )}
                  {record.notes && (
                    <p className="text-xs text-gray-400 mt-2 italic">"{record.notes}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddRecordModal isOpen={addOpen} onClose={() => setAddOpen(false)} />

      <Modal isOpen={!!editingRatings} onClose={() => setEditingRatings(null)} title="Edit Ratings & Notes">
        {editRecord && (
          <EditRatingsForm
            record={editRecord}
            members={members}
            onSave={(updates) => { updateWatchRecord(editRecord.id, updates); setEditingRatings(null); }}
            onCancel={() => setEditingRatings(null)}
          />
        )}
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Record">
        <div className="space-y-4">
          <p className="text-gray-300">Remove this watch record? This won't add the movie back to any wishlist.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => { removeWatchRecord(confirmDelete); setConfirmDelete(null); }} className="btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EditRatingsForm({ record, members, onSave, onCancel }) {
  const [ratings, setRatings] = useState({ ...record.ratings });
  const [notes, setNotes] = useState(record.notes || '');
  const attendees = record.attendees || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {attendees.map(id => {
          const m = members.find(x => x.id === id);
          if (!m) return null;
          return (
            <div key={id} className="flex items-center justify-between">
              <span className="text-sm text-gray-300 flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
                  style={{ backgroundColor: m.color + '33', color: m.color }}
                >
                  {m.name[0]}
                </span>
                {m.name}
              </span>
              <StarRating value={ratings[id] || 0} onChange={val => setRatings(r => ({ ...r, [id]: val }))} />
            </div>
          );
        })}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
        <textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={() => onSave({ ratings, notes })} className="btn-primary">Save</button>
      </div>
    </div>
  );
}
