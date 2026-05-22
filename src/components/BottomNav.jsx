import { Home, Search, Library, Mic2 } from 'lucide-react';

const tabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'library', icon: Library, label: 'Library' },
  { id: 'dj', icon: Mic2, label: 'AI DJ' },
];

const BottomNav = ({ activeTab, setActiveTab }) => (
  <nav className="bottom-nav" id="bottom-nav">
    {tabs.map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        className={`nav-item ${activeTab === id ? 'active' : ''}`}
        onClick={() => setActiveTab(id)}
        id={`nav-${id}`}
      >
        <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
        <span className="nav-label">{label}</span>
      </button>
    ))}
  </nav>
);

export default BottomNav;
