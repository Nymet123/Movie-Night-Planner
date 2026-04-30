import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import MembersPage from './pages/MembersPage';
import WishlistPage from './pages/WishlistPage';
import SchedulePage from './pages/SchedulePage';
import TrailersPage from './pages/TrailersPage';
import HistoryPage from './pages/HistoryPage';
import SuggestionsPage from './pages/SuggestionsPage';
import SettingsPage from './pages/SettingsPage';

const PAGES = {
  members:     MembersPage,
  wishlists:   WishlistPage,
  schedule:    SchedulePage,
  trailers:    TrailersPage,
  history:     HistoryPage,
  suggestions: SuggestionsPage,
  settings:    SettingsPage,
};

function AppInner() {
  const [activeTab, setActiveTab] = useState('members');
  const { isLoading, syncError } = useApp();
  const Page = PAGES[activeTab] || MembersPage;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl">🎬</div>
          <p className="text-gray-400 text-sm">Loading your movie night data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-bg">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {syncError && (
        <div className="bg-red-900/60 border-b border-red-700 px-4 py-2 text-center text-sm text-red-300">
          {syncError}
        </div>
      )}
      <main className="py-6">
        <Page />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
