import { useState } from 'react';
import { AppProvider } from './context/AppContext';
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
  const Page = PAGES[activeTab] || MembersPage;

  return (
    <div className="min-h-screen bg-cinema-bg">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
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
