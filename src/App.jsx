import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import TrackList from './components/TrackList';
import PlayerBar from './components/PlayerBar';
import HomePage from './components/HomePage';
import Profile from './components/Profile';
import LibrarySidebar from './components/LibrarySidebar';
import TopChrome from './components/TopChrome';
import NowPlayingSidebar from './components/NowPlayingSidebar';
import SearchBar from './components/SearchBar';
import BottomNav from './components/BottomNav';
import Library from './components/Library';
import AiAssistant from './components/AiAssistant';
import { searchSongs, dedup } from './utils/api';
import { searchJioSaavn } from './utils/jiosaavn';
import { saveToHistory, addRecentSearch, getFavorites, getHistory } from './utils/storage';

function App() {
  const [centerView, setCenterView] = useState('home');
  const [libraryCollection, setLibraryCollection] = useState(null);
  const [libraryFilter, setLibraryFilter] = useState('playlists');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNowPlayingPanel, setShowNowPlayingPanel] = useState(true);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const [playbackUi, setPlaybackUi] = useState({ isPlaying: false });
  const [showAi, setShowAi] = useState(false);
  const playerBarRef = useRef(null);

  const goHome = useCallback(() => {
    setShowProfile(false);
    setLibraryCollection(null);
    setCenterView('home');
  }, []);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    setCenterView('search');
    setLibraryCollection(null);
    setShowProfile(false);
    setSearchLoading(true);
    addRecentSearch(query);
    const results = await searchSongs(query, 30);
    const unique = dedup(results);
    setSearchResults(unique);
    setQueue(unique);
    setSearchLoading(false);
  }, []);

  const handlePlay = useCallback(async (track) => {
    if (!track) return;
    // No need to look up Spotify details — JioSaavn resolves audio in PlayerBar.
    saveToHistory(track);
    setCurrentTrack(track);
    // When a song is played, show the now-playing sidebar and hide the bottom bar's fullscreen
    setShowNowPlayingPanel(true);
  }, []);

  const handleSkipNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[(idx + 1) % queue.length];
    if (next) handlePlay(next);
  }, [currentTrack, queue, handlePlay]);

  const handleSkipPrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) handlePlay(prev);
  }, [currentTrack, queue, handlePlay]);

  // ── AI Assistant: search JioSaavn directly for instant full-song playback ──
  const handleAiRecommend = useCallback(async (query) => {
    setShowAi(false);
    setShowProfile(false);
    setLibraryCollection(null);
    setCenterView('home');

    // Search JioSaavn directly — these tracks come with full audioUrl already resolved
    const jioTracks = await searchJioSaavn(query, 20);

    if (jioTracks.length > 0) {
      setQueue(jioTracks);
      const first = jioTracks[0];
      saveToHistory(first);
      setCurrentTrack(first);
      setShowNowPlayingPanel(true);
    } else {
      // Fallback to Spotify metadata search (audio will be resolved by PlayerBar)
      const results = await searchSongs(query, 20);
      const unique = dedup(results);
      setQueue(unique);
      if (unique.length > 0) {
        await handlePlay(unique[0]);
      }
    }
  }, [handlePlay]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const fn = () => {
      if (mq.matches) setShowNowPlayingPanel(false);
    };
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // ── Mutual exclusivity: if NowPlayingSidebar is shown, hide fullscreen bottom bar ──
  const handleOpenNowPlaying = useCallback(() => {
    setShowNowPlayingPanel(true);
  }, []);

  const handleCloseNowPlaying = useCallback(() => {
    setShowNowPlayingPanel(false);
  }, []);

  const handleOpenFullscreen = useCallback(() => {
    // Hide the right sidebar when opening fullscreen player
    setShowNowPlayingPanel(false);
    playerBarRef.current?.openFullscreen();
  }, []);

  let mainContent;
  if (showProfile) {
    mainContent = <Profile />;
  } else if (libraryCollection) {
    mainContent = (
      <div className="spot-collection">
        <h1 className="spot-collection__title">{libraryCollection.title}</h1>
        <p className="spot-collection__meta">{libraryCollection.tracks.length} songs</p>
        <TrackList tracks={libraryCollection.tracks} currentTrack={currentTrack} onPlayTrack={handlePlay} />
      </div>
    );
  } else if (centerView === 'library') {
    mainContent = <Library currentTrack={currentTrack} onPlayTrack={handlePlay} />;
  } else if (centerView === 'search') {
    mainContent = (
      <>
        <SearchBar variant="panel" onSearch={handleSearch} onPlayTrack={handlePlay} />
        {searchLoading && (
          <div className="loader spot-inline-loader">
            <div className="spinner" />
            <p style={{ color: 'var(--sp-subdued)', fontSize: 14, fontWeight: 400 }}>Searching...</p>
          </div>
        )}
        {!searchLoading && searchQuery && searchResults.length > 0 && (
          <div className="spot-search-results">
            <h2 className="spot-search-results__title">
              Results for "<span className="spot-accent">{searchQuery}</span>"
            </h2>
            <TrackList tracks={searchResults} currentTrack={currentTrack} onPlayTrack={handlePlay} />
          </div>
        )}
        {!searchLoading && searchQuery && searchResults.length === 0 && (
          <div className="empty-state">
            <p>No results for "{searchQuery}"</p>
          </div>
        )}
      </>
    );
  } else {
    mainContent = <HomePage currentTrack={currentTrack} onPlayTrack={handlePlay} onNavigateSearch={handleSearch} />;
  }

  return (
    <div className="spot-app">
      <div className="spot-workspace">
        <LibrarySidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          libraryFilter={libraryFilter}
          onLibraryFilter={setLibraryFilter}
          onSelectHome={goHome}
          onSelectSearch={() => {
            setShowProfile(false);
            setLibraryCollection(null);
            setCenterView('search');
          }}
          onSelectLiked={() => {
            setShowProfile(false);
            const tracks = dedup(getFavorites());
            setLibraryCollection({ title: 'Liked Songs', tracks });
          }}
          onSelectRecent={() => {
            setShowProfile(false);
            const tracks = dedup(getHistory());
            setLibraryCollection({ title: 'Recently played', tracks });
          }}
          onSelectPlaylist={(pl) => {
            setShowProfile(false);
            setLibraryCollection({ title: pl.name, tracks: dedup(pl.tracks || []) });
          }}
          onSelectArtist={(name) => {
            handleSearch(name.split(',')[0].trim());
          }}
        />

        <section className="spot-main-panel">
          <TopChrome
            onHome={goHome}
            onOpenLibrarySearch={() => {
              setLibraryCollection(null);
              setCenterView('search');
            }}
            onSubmitSearch={handleSearch}
            onPlayTrack={handlePlay}
            profileOpen={showProfile}
            onToggleProfile={() => {
              setLibraryCollection(null);
              setShowProfile((p) => !p);
              if (showProfile) setCenterView('home');
            }}
          />
          <div className="spot-main-scroll" id="main-scroll">
            {mainContent}
          </div>
        </section>

        {showNowPlayingPanel && currentTrack && (
          <NowPlayingSidebar
            track={currentTrack}
            isPlaying={!!playbackUi.isPlaying}
            disabled={false}
            onClose={handleCloseNowPlaying}
            onTogglePlay={() => playerBarRef.current?.togglePlay()}
            onSkipPrev={handleSkipPrev}
            onSkipNext={handleSkipNext}
            onOpenFullscreen={handleOpenFullscreen}
          />
        )}
      </div>

      {showAi && <AiAssistant onRecommend={handleAiRecommend} onClose={() => setShowAi(false)} />}

      {!showAi && (
        <button
          type="button"
          className="ai-fab spot-ai-fab"
          style={{ bottom: 'calc(var(--spot-player-h) + 16px)' }}
          onClick={() => setShowAi(true)}
          title="AI DJ"
          id="ai-fab"
        >
          <Sparkles size={24} />
        </button>
      )}

      <PlayerBar
        ref={playerBarRef}
        currentTrack={currentTrack}
        queue={queue}
        onSkipNext={handleSkipNext}
        onSkipPrev={handleSkipPrev}
        onPlayTrack={handlePlay}
        onPlaybackUpdate={setPlaybackUi}
        onOpenNowPlaying={handleOpenNowPlaying}
        onNowPlayingPanelVisible={showNowPlayingPanel}
      />

      <BottomNav 
        activeTab={showAi ? 'dj' : centerView} 
        setActiveTab={(tab) => {
          if (tab === 'dj') {
            setShowAi(true);
          } else {
            setShowAi(false);
            setShowProfile(false);
            setLibraryCollection(null);
            setCenterView(tab);
          }
        }} 
      />
    </div>
  );
}

export default App;
