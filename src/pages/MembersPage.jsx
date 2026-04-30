import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const COLORS = ['#60a5fa', '#f472b6', '#34d399', '#a78bfa', '#fb923c', '#facc15', '#f87171', '#38bdf8', '#4ade80', '#c084fc'];

function MemberForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [kidsMode, setKidsMode] = useState(initial?.kidsMode || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), color, kidsMode);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input
          className="input"
          placeholder="Family member's name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex items-center gap-3 p-3 bg-cinema-muted rounded-lg">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 select-none"
          style={{ backgroundColor: color + '33', border: `2px solid ${color}`, color }}
        >
          {name ? name[0].toUpperCase() : '?'}
        </div>
        <div>
          <p className="text-white font-medium">{name || 'Preview'}</p>
          <p className="text-xs text-gray-400">Profile picture</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-start gap-3 p-3 bg-cinema-muted rounded-lg">
        <button
          type="button"
          onClick={() => setKidsMode(k => !k)}
          className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors mt-0.5 ${kidsMode ? 'bg-blue-500' : 'bg-gray-600'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${kidsMode ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <div>
          <p className="text-sm font-medium text-white">Kids Mode</p>
          <p className="text-xs text-gray-400">Filters suggestions to PG and below</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          {initial ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  );
}

export default function MembersPage() {
  const { members, movies, watchHistory, schedule, addMember, updateMember, removeMember, loadDemoData } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const editMember = members.find(m => m.id === editId);

  const getLastWatched = (memberId) => {
    const record = watchHistory.find(h => h.scheduledMemberId === memberId || (h.attendees || []).includes(memberId));
    if (!record) return null;
    const movie = movies[record.movieId];
    return movie ? `${movie.title} (${record.date})` : null;
  };

  const currentMember = members[schedule.currentIndex % Math.max(members.length, 1)];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Family Members</h1>
          <p className="text-gray-400 text-sm mt-1">Manage who's in your movie nights</p>
        </div>
        <div className="flex gap-2">
          {members.length === 0 && (
            <button onClick={loadDemoData} className="btn-secondary text-sm">
              Load Demo Data
            </button>
          )}
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            + Add Member
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-xl font-semibold text-white mb-2">No members yet</h2>
          <p className="text-gray-400 mb-6">Add your family members to get started with movie night planning.</p>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member, idx) => {
            const isNext = currentMember?.id === member.id;
            const lastWatched = getLastWatched(member.id);
            return (
              <div key={member.id} className={`card p-4 relative ${isNext ? 'ring-2 ring-amber-500' : ''}`}>
                {isNext && (
                  <span className="absolute -top-2 -right-2 badge bg-amber-500 text-black text-xs font-bold">
                    🎬 Next up!
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 select-none"
                    style={{ backgroundColor: member.color + '33', border: `2px solid ${member.color}`, color: member.color }}
                  >
                    {member.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg">{member.name}</h3>
                      {member.kidsMode && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/40">
                          🧒 Kids
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {member.wishlist.length} movie{member.wishlist.length !== 1 ? 's' : ''} in wishlist
                    </p>
                  </div>
                </div>
                {lastWatched && (
                  <p className="text-xs text-gray-500 mb-3 truncate">Last: {lastWatched}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <span>Turn #{idx + 1} in rotation</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditId(member.id)}
                    className="btn-secondary text-xs flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(member)}
                    className="btn-danger text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Family Member">
        <MemberForm
          onSave={(name, color, kidsMode) => { addMember(name, color, kidsMode); setAddOpen(false); }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Edit Member">
        {editMember && (
          <MemberForm
            initial={editMember}
            onSave={(name, color, kidsMode) => { updateMember(editId, { name, color, kidsMode }); setEditId(null); }}
            onCancel={() => setEditId(null)}
          />
        )}
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove Member">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-gray-300">
              Remove <strong className="text-white">{confirmDelete.name}</strong>? Their wishlist will be lost.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => { removeMember(confirmDelete.id); setConfirmDelete(null); }}
                className="btn-danger"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
