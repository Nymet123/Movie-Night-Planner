import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'members',     label: 'Members',     icon: '👥' },
  { id: 'wishlists',   label: 'Wishlists',   icon: '📋' },
  { id: 'schedule',    label: 'Schedule',    icon: '📅' },
  { id: 'trailers',    label: 'Trailers',    icon: '🎬' },
  { id: 'history',     label: 'History',     icon: '📖' },
  { id: 'suggestions', label: 'Suggestions', icon: '✨' },
  { id: 'settings',    label: 'Settings',    icon: '⚙️'  },
];

export default function Navbar({ activeTab, setActiveTab }) {
  const { settings } = useApp();

  return (
    <header className="border-b border-cinema-border bg-cinema-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6 h-14">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🎬</span>
            <span className="font-bold text-amber-400 text-lg hidden sm:block">
              {settings.familyName}
            </span>
          </div>

          <nav className="flex items-end gap-1 overflow-x-auto scrollbar-none h-full">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 h-full text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-amber-400 border-amber-400'
                    : 'text-gray-400 hover:text-gray-200 border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
