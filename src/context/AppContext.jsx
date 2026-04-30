import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'movieNightPlanner_v2';
const SAVE_DEBOUNCE_MS = 800;

const defaultState = {
  settings: {
    tmdbApiKey: '',
    familyName: 'Our Family',
    movieNightFrequency: 'weekly',
    movieNightDay: 5,
  },
  members: [
    { id: 'm_yaakov', name: 'Yaakov', color: '#60a5fa', kidsMode: false, wishlist: [] },
    { id: 'm_sarah',  name: 'Sarah',  color: '#f472b6', kidsMode: false, wishlist: [] },
    { id: 'm_avi',    name: 'Avi',    color: '#34d399', kidsMode: true,  wishlist: [] },
    { id: 'm_rivky',  name: 'Rivky',  color: '#a78bfa', kidsMode: true,  wishlist: [] },
  ],
  movies: {},
  schedule: { currentIndex: 0 },
  watchHistory: [],
};

const DEMO_MOVIES = {
  '27205': { id: 27205, title: 'Inception', year: 2010, overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }], vote_average: 8.4, runtime: 148, streamingServices: null, trailerKey: 'YoHD9XEInc0' },
  '424': { id: 424, title: "Schindler's List", year: 1993, overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory.", poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }, { id: 10752, name: 'War' }], vote_average: 9.0, runtime: 195, streamingServices: null, trailerKey: 'gG22XNhtnoY' },
  '155': { id: 155, title: 'The Dark Knight', year: 2008, overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', genres: [{ id: 28, name: 'Action' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }], vote_average: 9.0, runtime: 152, streamingServices: null, trailerKey: 'EXeTwQWrcwY' },
  '120467': { id: 120467, title: 'The Grand Budapest Hotel', year: 2014, overview: 'The adventures of Gustave H, a legendary concierge at a famous hotel in the fictional Republic of Zubrowka.', poster_path: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', genres: [{ id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' }], vote_average: 8.1, runtime: 100, streamingServices: null, trailerKey: '1Fg0n6IxnZU' },
  '862': { id: 862, title: 'Toy Story', year: 1995, overview: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room.", poster_path: '/uXDfjJbdP4ijW5hWSBrPl9KaI82.jpg', genres: [{ id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 10751, name: 'Family' }], vote_average: 8.5, runtime: 81, streamingServices: null, trailerKey: 'KYz2wyBy3kc' },
  '335984': { id: 335984, title: 'Blade Runner 2049', year: 2017, overview: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.", poster_path: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', genres: [{ id: 878, name: 'Science Fiction' }, { id: 18, name: 'Drama' }], vote_average: 7.9, runtime: 164, streamingServices: null, trailerKey: 'gD6hPBNzDkA' },
  '348': { id: 348, title: 'Alien', year: 1979, overview: 'During its return to the earth, commercial spaceship Nostromo intercepts a distress signal from a distant planet.', poster_path: '/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg', genres: [{ id: 27, name: 'Horror' }, { id: 878, name: 'Science Fiction' }], vote_average: 8.1, runtime: 117, streamingServices: null, trailerKey: 'LjLamj-b0I8' },
  '568124': { id: 568124, title: 'Encanto', year: 2021, overview: "A Colombian teenage girl has to face the mystery of her family's gifts.", poster_path: '/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg', genres: [{ id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' }, { id: 10751, name: 'Family' }], vote_average: 7.7, runtime: 102, streamingServices: null, trailerKey: 'CaimKeDcudo' },
};

const DEMO_DATA = {
  settings: { tmdbApiKey: '', familyName: 'The Johnsons', movieNightFrequency: 'weekly', movieNightDay: 5 },
  members: [
    { id: 'm1', name: 'Mom', emoji: '👩', color: '#f472b6', wishlist: ['27205', '424', '120467'] },
    { id: 'm2', name: 'Dad', emoji: '👨', color: '#60a5fa', wishlist: ['155', '335984', '348'] },
    { id: 'm3', name: 'Emma', emoji: '👧', color: '#34d399', wishlist: ['568124', '862'] },
    { id: 'm4', name: 'Jake', emoji: '👦', color: '#a78bfa', wishlist: ['862', '27205'] },
  ],
  movies: DEMO_MOVIES,
  schedule: { currentIndex: 0 },
  watchHistory: [
    { id: 'h1', movieId: '862', date: '2024-12-20', scheduledMemberId: 'm3', attendees: ['m1', 'm2', 'm3', 'm4'], ratings: { m1: 5, m2: 4, m3: 5, m4: 4 }, notes: 'Classic! The kids loved it.' },
    { id: 'h2', movieId: '568124', date: '2025-01-10', scheduledMemberId: 'm3', attendees: ['m1', 'm2', 'm3', 'm4'], ratings: { m1: 4, m2: 3, m3: 5, m4: 4 }, notes: 'Great music!' },
    { id: 'h3', movieId: '155', date: '2025-01-24', scheduledMemberId: 'm2', attendees: ['m1', 'm2', 'm4'], ratings: { m1: 5, m2: 5, m4: 5 }, notes: 'Heath Ledger was incredible.' },
  ],
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const saveTimerRef = useRef(null);
  const loadedRef = useRef(false);

  // On mount: load from Upstash Redis via /api/data, fall back to localStorage
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      let loaded = null;
      try {
        const res = await fetch('/api/data');
        if (res.ok) loaded = await res.json();
      } catch {}

      if (!loaded) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) loaded = JSON.parse(saved);
        } catch {}
      }

      if (!cancelled) {
        if (loaded) setState({ ...defaultState, ...loaded });
        loadedRef.current = true;
        setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // Debounced save to Upstash on every state change after initial load
  useEffect(() => {
    if (!loadedRef.current) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
        .then(r => r.ok ? setSyncError(null) : setSyncError('Sync failed'))
        .catch(() => setSyncError('Cloud sync unavailable — changes saved locally'));

      // Keep localStorage in sync as a local backup
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    }, SAVE_DEBOUNCE_MS);
  }, [state]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const updateSettings = useCallback((updates) =>
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } })), []);

  const addMember = useCallback((name, color, kidsMode = false) => {
    const id = `m_${Date.now()}`;
    setState(s => ({ ...s, members: [...s.members, { id, name, color, kidsMode, wishlist: [] }] }));
    return id;
  }, []);

  const updateMember = useCallback((id, updates) =>
    setState(s => ({ ...s, members: s.members.map(m => m.id === id ? { ...m, ...updates } : m) })), []);

  const removeMember = useCallback((id) =>
    setState(s => ({
      ...s,
      members: s.members.filter(m => m.id !== id),
      schedule: {
        ...s.schedule,
        currentIndex: s.members.length > 1
          ? s.schedule.currentIndex % (s.members.length - 1)
          : 0,
      },
    })), []);

  const cacheMovie = useCallback((movie) =>
    setState(s => ({ ...s, movies: { ...s.movies, [movie.id.toString()]: movie } })), []);

  const updateMovie = useCallback((id, updates) =>
    setState(s => ({
      ...s,
      movies: { ...s.movies, [id.toString()]: { ...s.movies[id.toString()], ...updates } },
    })), []);

  const addToWishlist = useCallback((memberId, movieId) =>
    setState(s => ({
      ...s,
      members: s.members.map(m => {
        if (m.id !== memberId) return m;
        const sid = movieId.toString();
        if (m.wishlist.includes(sid)) return m;
        return { ...m, wishlist: [...m.wishlist, sid] };
      }),
    })), []);

  const removeFromWishlist = useCallback((memberId, movieId) =>
    setState(s => ({
      ...s,
      members: s.members.map(m =>
        m.id === memberId
          ? { ...m, wishlist: m.wishlist.filter(id => id !== movieId.toString()) }
          : m
      ),
    })), []);

  const reorderWishlist = useCallback((memberId, fromIndex, toIndex) =>
    setState(s => ({
      ...s,
      members: s.members.map(m => {
        if (m.id !== memberId) return m;
        const list = [...m.wishlist];
        const [item] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, item);
        return { ...m, wishlist: list };
      }),
    })), []);

  const addWatchRecord = useCallback((record) => {
    const id = `h_${Date.now()}`;
    setState(s => ({
      ...s,
      watchHistory: [{ id, ...record }, ...s.watchHistory],
      members: s.members.map(m =>
        m.id === record.scheduledMemberId
          ? { ...m, wishlist: m.wishlist.filter(wid => wid !== record.movieId.toString()) }
          : m
      ),
      schedule: {
        ...s.schedule,
        currentIndex: s.members.length > 0
          ? (s.schedule.currentIndex + 1) % s.members.length
          : 0,
      },
    }));
    return id;
  }, []);

  const removeWatchRecord = useCallback((id) =>
    setState(s => ({ ...s, watchHistory: s.watchHistory.filter(r => r.id !== id) })), []);

  const updateWatchRecord = useCallback((id, updates) =>
    setState(s => ({
      ...s,
      watchHistory: s.watchHistory.map(r => r.id === id ? { ...r, ...updates } : r),
    })), []);

  const advanceSchedule = useCallback(() =>
    setState(s => ({
      ...s,
      schedule: {
        ...s.schedule,
        currentIndex: s.members.length > 0
          ? (s.schedule.currentIndex + 1) % s.members.length
          : 0,
      },
    })), []);

  const loadDemoData = useCallback(() =>
    setState({ ...defaultState, ...DEMO_DATA }), []);

  const resetData = useCallback(() =>
    setState(defaultState), []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movie-night-planner.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      setState({ ...defaultState, ...data });
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      isLoading,
      syncError,
      updateSettings,
      addMember,
      updateMember,
      removeMember,
      cacheMovie,
      updateMovie,
      addToWishlist,
      removeFromWishlist,
      reorderWishlist,
      addWatchRecord,
      removeWatchRecord,
      updateWatchRecord,
      advanceSchedule,
      loadDemoData,
      resetData,
      exportData,
      importData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
