import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, Music } from 'lucide-react';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../utils/storage';
import { searchSongs, dedup } from '../utils/api';

const CATEGORIES = [
  { name: 'Bollywood', gradient: 'linear-gradient(135deg,#e74c3c,#c0392b)', img: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=400&fit=crop' },
  { name: 'Pop Hits', gradient: 'linear-gradient(135deg,#9b59b6,#6c3483)', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
  { name: 'Hip Hop', gradient: 'linear-gradient(135deg,#2c3e50,#4a6fa5)', img: 'https://images.unsplash.com/photo-1571609803939-54f463c1752d?w=400&h=400&fit=crop' },
  { name: 'Lo-Fi Chill', gradient: 'linear-gradient(135deg,#0f9b8e,#1dd1a1)', img: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&h=400&fit=crop' },
  { name: 'Punjabi', gradient: 'linear-gradient(135deg,#f39c12,#d35400)', img: 'https://images.unsplash.com/photo-1504704911898-68304a7d2571?w=400&h=400&fit=crop' },
  { name: 'Romantic', gradient: 'linear-gradient(135deg,#e91e63,#880e4f)', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop' },
  { name: 'Workout', gradient: 'linear-gradient(135deg,#ff5722,#bf360c)', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop' },
  { name: 'Retro 90s', gradient: 'linear-gradient(135deg,#ff9800,#e65100)', img: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop' },
  { name: 'EDM Party', gradient: 'linear-gradient(135deg,#2196f3,#0d47a1)', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop' },
  { name: 'Devotional', gradient: 'linear-gradient(135deg,#607d8b,#37474f)', img: 'https://images.unsplash.com/photo-1609619385002-f40f1df827b8?w=400&h=400&fit=crop' },
];

const SearchBar = ({ onSearch, onPlayTrack, variant = 'page' }) => {
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const recentSearches = getRecentSearches();

  // Live search with debounce
  const doLiveSearch = useCallback(async (q) => {
    if (!q.trim()) { setLiveResults([]); return; }
    setIsSearching(true);
    const results = await searchSongs(q, 8);
    setLiveResults(dedup(results));
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doLiveSearch(query), 350);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doLiveSearch]);

  // Removed useEffect for query length < 2 because it's handled in onChange

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
      onSearch(query.trim());
      setLiveResults([]);
    }
  };

  const handleCategoryClick = (cat) => {
    addRecentSearch(cat);
    onSearch(cat);
  };

  const handleRecentClick = (q) => {
    setQuery(q);
    onSearch(q);
  };

  const handleLiveResultClick = (track) => {
    addRecentSearch(query.trim());
    onPlayTrack?.(track);
    onSearch(query.trim());
    setLiveResults([]);
  };

  return (
    <div className={`search-page ${variant === 'panel' ? 'search-page--panel' : ''}`}>
      {variant !== 'panel' && (
        <div className="search-hero">
          <h1 className="search-hero-title">Search</h1>
          <p className="search-hero-sub">Find your favorite songs, artists, and albums</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="search-bar-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Artists, songs, or albums"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (v.trim().length < 2) setLiveResults([]);
          }}
          id="search-input"
        />
        <div className="search-icon-wrap"><Search size={18} /></div>
        {query && (
          <button type="button" className="search-clear" onClick={() => { setQuery(''); setLiveResults([]); inputRef.current?.focus(); }}>
            <X size={18} />
          </button>
        )}
      </form>

      {/* Live Results Dropdown */}
      {query.trim().length >= 2 && (liveResults.length > 0 || isSearching) && (
        <div className="live-results">
          {isSearching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Searching...
            </div>
          )}
          {liveResults.map(track => (
            <button key={track.id} className="live-result-item" onClick={() => handleLiveResultClick(track)}>
              {track.cover ? (
                <img src={track.cover} alt="" className="live-result-cover" loading="lazy" />
              ) : (
                <div className="live-result-cover" style={{ background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={14} color="var(--text-secondary)" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</div>
              </div>
            </button>
          ))}
          {liveResults.length > 0 && (
            <button className="live-result-seeall" onClick={handleSubmit}>
              See all results for "{query}"
            </button>
          )}
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="recent-searches">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Recent</h3>
            <button onClick={clearRecentSearches} style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>Clear All</button>
          </div>
          {recentSearches.slice(0, 5).map((s, i) => (
            <button key={i} className="recent-search-item" onClick={() => handleRecentClick(s)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>
              <Clock size={16} />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Browse Categories with Images */}
      {!query && (
        <>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 16 }}>Browse Categories</h3>
          <div className="search-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className="search-cat"
                onClick={() => handleCategoryClick(cat.name)}
              >
                <img src={cat.img} alt={cat.name} className="search-cat-img" loading="lazy" />
                <div className="search-cat-overlay" style={{ background: cat.gradient, opacity: 0.7 }} />
                <span className="search-cat-label">{cat.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchBar;
