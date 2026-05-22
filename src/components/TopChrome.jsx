import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  FolderOpen,
  Bell,
  Users,
  X,
  Music,
} from 'lucide-react';
import { dedup, searchSongs } from '../utils/api';
import { addRecentSearch, getPrefs } from '../utils/storage';

const TopChrome = ({
  onHome,
  onOpenLibrarySearch,
  onSubmitSearch,
  onPlayTrack,
  profileOpen,
  onToggleProfile,
}) => {
  const prefs = getPrefs();
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  const doLive = useCallback(async (q) => {
    if (!q.trim()) {
      setLiveResults([]);
      return;
    }
    setLoadingLive(true);
    const results = await searchSongs(q, 8);
    setLiveResults(dedup(results));
    setLoadingLive(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doLive(query), 320);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doLive]);

  // Removed useEffect for query length < 2 because it's handled in onChange

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setLiveResults([]);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submit = (q) => {
    const s = (q ?? query).trim();
    if (!s) return;
    addRecentSearch(s);
    setLiveResults([]);
    onSubmitSearch(s);
  };

  return (
    <header className="spot-top">
      <div className="spot-top__nav">
        <button type="button" className="spot-round-btn" title="Back" onClick={() => window.history.back()}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="spot-round-btn" title="Forward" onClick={() => window.history.forward()}>
          <ChevronRight size={18} />
        </button>
        <button type="button" className="spot-round-btn spot-round-btn--accent" title="Home" onClick={onHome}>
          <Home size={18} />
        </button>
      </div>

      <div className="spot-top__search-wrap" ref={wrapRef}>
        <div className="spot-search-pill">
          <Search size={18} className="spot-search-pill__icon" />
          <input
            className="spot-search-pill__input"
            placeholder="What do you want to play?"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              if (v.trim().length < 2) setLiveResults([]);
            }}
            onFocus={() => query.trim().length >= 2 && doLive(query)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {query && (
            <button type="button" className="spot-search-pill__clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
          <button type="button" className="spot-search-pill__browse" title="Browse library" onClick={onOpenLibrarySearch}>
            <FolderOpen size={18} />
          </button>
        </div>

        {query.trim().length >= 2 && (liveResults.length > 0 || loadingLive) && (
          <div className="spot-live-results">
            {loadingLive && (
              <div className="spot-live-results__loading">
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Searching…
              </div>
            )}
            {!loadingLive &&
              liveResults.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className="spot-live-results__row"
                  onClick={() => {
                    addRecentSearch(query.trim());
                    onPlayTrack?.(track);
                    submit(query);
                  }}
                >
                  {track.cover ? (
                    <img src={track.cover} alt="" className="spot-live-results__cover" loading="lazy" />
                  ) : (
                    <div className="spot-live-results__cover spot-live-results__cover--empty">
                      <Music size={14} color="var(--sp-subdued)" />
                    </div>
                  )}
                  <span className="spot-live-results__meta">
                    <span className="spot-live-results__title">{track.title}</span>
                    <span className="spot-live-results__artist">{track.artist}</span>
                  </span>
                </button>
              ))}
            {!loadingLive && liveResults.length > 0 && (
              <button type="button" className="spot-live-results__see" onClick={() => submit()}>
                See all results for "{query}"
              </button>
            )}
          </div>
        )}
      </div>

      <div className="spot-top__right">
        <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="What's New">
          <Bell size={20} />
        </button>
        <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="Friend Activity">
          <Users size={20} />
        </button>
        <button
          type="button"
          className="spot-profile-chip"
          onClick={onToggleProfile}
          title="Profile"
          aria-pressed={profileOpen}
          style={{
            background: profileOpen ? '#333' : `linear-gradient(135deg, ${prefs.accentColor || '#535353'}, ${prefs.accentColor || '#535353'}aa)`,
          }}
        >
          {prefs.initials || 'AR'}
        </button>
      </div>
    </header>
  );
};

export default TopChrome;
