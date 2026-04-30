import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { searchMovies } from '../utils/tmdb';

export default function SettingsPage() {
  const { settings, updateSettings, loadDemoData, resetData, exportData, importData } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState(settings.tmdbApiKey);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef(null);

  const handleSaveApiKey = () => {
    updateSettings({ tmdbApiKey: apiKeyInput.trim() });
    setTestStatus(null);
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) return;
    setTesting(true);
    setTestStatus(null);
    try {
      await searchMovies('test', apiKeyInput.trim());
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      if (!ok) setImportError('Invalid file format.');
      else setImportError('');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Family name */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Family</h2>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Family Name</label>
          <div className="flex gap-2">
            <input
              className="input"
              value={settings.familyName}
              onChange={e => updateSettings({ familyName: e.target.value })}
              placeholder="Our Family"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Shown in the header.</p>
        </div>
      </div>

      {/* TMDB API Key */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">TMDB API Key</h2>
        <p className="text-sm text-gray-400">
          Required for movie search, streaming info, trailers, and suggestions.
          Get a free key at{' '}
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            themoviedb.org/settings/api
          </a>
          .
        </p>
        <div className="flex gap-2">
          <input
            className="input font-mono text-sm"
            type="password"
            placeholder="Paste your TMDB API key..."
            value={apiKeyInput}
            onChange={e => { setApiKeyInput(e.target.value); setTestStatus(null); }}
          />
          <button onClick={handleTestKey} disabled={testing || !apiKeyInput.trim()} className="btn-secondary shrink-0">
            {testing ? '...' : 'Test'}
          </button>
          <button onClick={handleSaveApiKey} className="btn-primary shrink-0">
            Save
          </button>
        </div>
        {testStatus === 'success' && (
          <p className="text-sm text-green-400">✓ API key works!</p>
        )}
        {testStatus === 'error' && (
          <p className="text-sm text-red-400">✗ Invalid API key or network error.</p>
        )}
        {settings.tmdbApiKey && (
          <p className="text-xs text-green-400">✓ API key saved</p>
        )}
      </div>

      {/* Movie night schedule */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Movie Night Schedule</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
            <select
              className="input"
              value={settings.movieNightFrequency}
              onChange={e => updateSettings({ movieNightFrequency: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Day of Week</label>
            <select
              className="input"
              value={settings.movieNightDay ?? 5}
              onChange={e => updateSettings({ movieNightDay: parseInt(e.target.value) })}
            >
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data management */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Data Management</h2>
        <p className="text-sm text-gray-400">
          All data is stored locally in your browser. Export to back it up.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={exportData} className="btn-secondary">
            ⬇ Export Data
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary">
            ⬆ Import Data
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        {importError && <p className="text-sm text-red-400">{importError}</p>}

        <hr className="border-cinema-border" />

        <div className="flex gap-3">
          <button onClick={loadDemoData} className="btn-secondary flex-1">
            🎬 Load Demo Data
          </button>
          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)} className="btn-danger flex-1">
              🗑 Reset All Data
            </button>
          ) : (
            <div className="flex gap-2 flex-1">
              <button onClick={() => { resetData(); setResetConfirm(false); }} className="btn-danger flex-1">
                Confirm Reset
              </button>
              <button onClick={() => setResetConfirm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card p-6 space-y-2">
        <h2 className="text-lg font-semibold text-white">About</h2>
        <p className="text-sm text-gray-400">
          <strong className="text-white">Movie Night Planner</strong> — a family-friendly app for managing movie wishlists,
          scheduling movie nights, tracking what you've watched, and discovering what to watch next.
        </p>
        <p className="text-xs text-gray-600">
          Powered by{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-amber-400/70 hover:text-amber-400">
            The Movie Database (TMDB)
          </a>
          . Data stored locally — no account required.
        </p>
      </div>
    </div>
  );
}
