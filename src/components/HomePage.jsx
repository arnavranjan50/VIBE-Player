import { useState, useEffect, useMemo } from 'react';
import { Play, Sparkles, TrendingUp, Star, ChevronRight, Pause, Music, Heart, Mic } from 'lucide-react';
import { searchSongs, getArtistTopTracks, dedup, getSongSuggestions } from '../utils/api';
import { getRecommendationQuery, getRecentArtists, getHistory, getFavorites } from '../utils/storage';

// ── Cross-section dedup ──
const crossDedup = (tracks, seenSet) => {
  return dedup(tracks).filter(t => {
    if (!t) return false;
    const key = `${t.title.toLowerCase().trim()}::${(t.artist || '').split(',')[0].toLowerCase().trim()}`;
    if (seenSet.has(key)) return false;
    seenSet.add(key);
    return true;
  });
};

// ── Extract unique albums from history ──
const getUniqueAlbums = (tracks) => {
  const seen = new Set();
  return (tracks || []).filter(t => {
    if (!t?.album || !t?.albumId) return false;
    if (seen.has(t.albumId)) return false;
    seen.add(t.albumId);
    return true;
  }).map(t => ({
    id: t.albumId,
    name: t.album,
    artist: t.artist,
    cover: t.cover,
    track: t,
  }));
};

// ═══════════════════════════════════════
// Spotify-style Quick Access Grid
// Compact cards: album art (left) + title (right)
// ═══════════════════════════════════════
const QuickAccessGrid = ({ items, onPlay, currentTrack }) => (
  <div className="sp-quick-grid">
    {items.slice(0, 8).map((item, i) => {
      const isActive = currentTrack?.id === item.track?.id || currentTrack?.albumId === item.id;
      return (
        <button
          key={`qa-${item.id}-${i}`}
          className={`sp-quick-card ${isActive ? 'sp-quick-card--active' : ''}`}
          onClick={() => onPlay?.(item.track)}
        >
          {item.cover ? (
            <img src={item.cover} alt="" className="sp-quick-cover" loading="lazy" />
          ) : (
            <div className="sp-quick-cover sp-quick-cover--empty">
              {item.type === 'liked' ? <Heart size={16} color="#fff" fill="#1db954" /> : <Music size={16} color="var(--text-secondary)" />}
            </div>
          )}
          <span className="sp-quick-title">{item.name}</span>
          {isActive && (
            <div className="sp-quick-eq">
              <div className="eq-bar" /><div className="eq-bar" /><div className="eq-bar" />
            </div>
          )}
        </button>
      );
    })}
  </div>
);

// ═══════════════════════════════════════
// Jump Back In — larger album cover cards
// ═══════════════════════════════════════
const JumpBackIn = ({ tracks, onPlayTrack, currentTrack }) => (
  <div className="sp-jumpback-scroll">
    {dedup(tracks).slice(0, 10).map((track, i) => {
      const isActive = currentTrack?.id === track.id;
      return (
        <button key={`jb-${track.id}-${i}`} className={`sp-jumpback-card ${isActive ? 'sp-jumpback-card--active' : ''}`} onClick={() => onPlayTrack(track)}>
          <div className="sp-jumpback-img-wrap">
            {track.cover ? (
              <img src={track.cover} alt={track.title} className="sp-jumpback-cover" loading="lazy" />
            ) : (
              <div className="sp-jumpback-cover sp-jumpback-cover--empty"><Music size={24} color="var(--text-secondary)" /></div>
            )}
            <div className="sp-jumpback-play-overlay">
              <div className="sp-jumpback-play-btn">
                {isActive ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: 2 }} />}
              </div>
            </div>
          </div>
          <div className="sp-jumpback-title">{track.title}</div>
          <div className="sp-jumpback-artist">{track.artist}</div>
        </button>
      );
    })}
  </div>
);

// ═══════════════════════════════════════
// Horizontal scroll cards (for other sections)
// ═══════════════════════════════════════
const HScrollCards = ({ tracks, onPlayTrack, currentTrack, badge, maxItems = 8 }) => (
  <div className="h-scroll">
    {dedup(tracks).slice(0, maxItems).map((track, i) => {
      const isActive = currentTrack?.id === track.id;
      return (
        <button key={`${track.id}-${i}`} className={`album-card ${isActive ? 'album-card--active' : ''}`} onClick={() => onPlayTrack(track)}>
          <div className="album-card-img-wrap">
            {track.cover ? (
              <img src={track.cover} alt={track.title} className="album-cover" loading="lazy" />
            ) : (
              <div className="album-cover album-cover-empty"><Music size={20} color="var(--text-secondary)" /></div>
            )}
            <div className="album-card-hover">
              <div className="album-card-play-btn">
                {isActive ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" style={{ marginLeft: 1 }} />}
              </div>
            </div>
            {badge === 'rank' && <span className="album-rank-badge">#{i + 1}</span>}
          </div>
          <div className="album-title">{track.title}</div>
          <div className="album-artist">{track.artist}</div>
        </button>
      );
    })}
  </div>
);

// Section Header
const SectionHead = ({ icon: Icon, iconColor, title, onSeeAll }) => (
  <div className="section-header">
    <h2 className="section-title">
      {Icon && <Icon size={18} color={iconColor || 'var(--accent)'} />}
      {title}
    </h2>
    {onSeeAll && (
      <button className="section-link" onClick={onSeeAll}>
        Show all <ChevronRight size={14} />
      </button>
    )}
  </div>
);

// ══════════════════════════════════════════
// Main HomePage — Spotify-style layout
// ══════════════════════════════════════════
const HomePage = ({ currentTrack, onPlayTrack, onNavigateSearch }) => {
  const [sections, setSections] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const showMusicBrowse = filter === 'all' || filter === 'music';

  const history = getHistory();
  const favorites = getFavorites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recentAlbums = useMemo(() => getUniqueAlbums(history), [history.length]);

  // Build quick access items from history + favorites
  const quickAccessItems = useMemo(() => {
    const items = [];

    // Add "Liked Songs" entry if favorites exist
    if (favorites.length > 0) {
      items.push({
        id: 'liked-songs',
        name: 'Liked Songs',
        cover: favorites[0]?.cover || '',
        track: favorites[0],
        type: 'liked',
      });
    }

    // Add unique recent albums
    recentAlbums.forEach(alb => {
      if (items.length < 8) {
        items.push({
          id: alb.id,
          name: alb.name,
          cover: alb.cover,
          track: alb.track,
          type: 'album',
        });
      }
    });

    // Add recent artists as search shortcuts
    const recentArtists = getRecentArtists();
    recentArtists.forEach(artist => {
      if (items.length < 8) {
        const artistTrack = history.find(t => t.artist?.includes(artist));
        if (artistTrack) {
          // avoid duplicate
          if (!items.find(it => it.name === artist)) {
            items.push({
              id: `artist-${artist}`,
              name: artist,
              cover: artistTrack.cover,
              track: artistTrack,
              type: 'artist',
            });
          }
        }
      }
    });

    return items.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length, favorites.length, recentAlbums.length]);

  const loadContent = async () => {
    const builtSections = [];
    const listenHistory = getHistory();
    const seenGlobal = new Set();

    try {
      // Recommendations
      let recTracks = [];
      if (listenHistory.length > 0) {
        const seedIds = listenHistory.slice(0, 3).map(t => t.id).filter(Boolean);
        const recPromises = seedIds.map(id => getSongSuggestions(id));
        const recResults = await Promise.all(recPromises);
        recTracks = crossDedup(recResults.flat(), seenGlobal);
      }
      if (recTracks.length < 3) {
        const fallback = await searchSongs(getRecommendationQuery(), 15);
        recTracks = crossDedup([...recTracks, ...fallback], seenGlobal);
      }
      setRecommended(recTracks.slice(0, 12));

      // Parallel fetches
      const queries = [
        { key: 'trending', query: 'top hits India 2025' },
        { key: 'bollywood', query: 'latest bollywood songs 2025' },
        { key: 'chill', query: 'chill lofi beats' },
        { key: 'english', query: 'top english pop hits 2025' },
      ];

      const results = await Promise.all(queries.map(q => searchSongs(q.query, 12)));

      if (results[0]?.length) {
        const tracks = crossDedup(results[0], seenGlobal);
        if (tracks.length > 0) builtSections.push({ key: 'trending', title: 'Trending Now', icon: TrendingUp, iconColor: 'var(--accent)', tracks, badge: 'rank' });
      }

      // Artist-based
      if (listenHistory.length > 0) {
        const recentTrack = listenHistory[Math.floor(Math.random() * Math.min(3, listenHistory.length))];
        if (recentTrack?.artistId) {
          const artistTracks = await getArtistTopTracks(recentTrack.artistId, recentTrack.albumId);
          const filtered = crossDedup(artistTracks, seenGlobal);
          if (filtered.length > 2) {
            builtSections.push({ key: 'artist', title: `More from ${recentTrack.artist?.split(',')[0]?.trim()}`, icon: Sparkles, iconColor: '#a855f7', tracks: filtered });
          }
        }
        if (!builtSections.find(s => s.key === 'artist') && recentTrack?.artist) {
          const artistName = recentTrack.artist.split(',')[0].trim();
          const artistTracks = await searchSongs(artistName, 10);
          const filtered = crossDedup(artistTracks.filter(t => t.albumId !== recentTrack.albumId), seenGlobal);
          if (filtered.length > 2) builtSections.push({ key: 'artist', title: `More from ${artistName}`, icon: Sparkles, iconColor: '#a855f7', tracks: filtered });
        }
      }

      if (results[1]?.length) { const tracks = crossDedup(results[1], seenGlobal); if (tracks.length > 0) builtSections.push({ key: 'bollywood', title: 'Bollywood Hits', tracks }); }
      if (results[2]?.length) { const tracks = crossDedup(results[2], seenGlobal); if (tracks.length > 0) builtSections.push({ key: 'chill', title: 'Chill Vibes', tracks }); }
      if (results[3]?.length) { const tracks = crossDedup(results[3], seenGlobal); if (tracks.length > 0) builtSections.push({ key: 'english', title: 'Global Hits', tracks }); }
    } catch (err) {
      console.error('[HomePage] Load error:', err);
    }

    setSections(builtSections);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadContent(); }, []);

  if (loading) {
    return (
      <div className="loader" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading your music...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ── Ambient Glow ── */}
      <div className="home-ambient-glow">
        {currentTrack?.cover && <img src={currentTrack.cover} alt="" className="home-ambient-img" />}
        <div className="home-ambient-fallback" />
      </div>

      {/* ── Hero banner (desktop Spotify-style) ── */}
      <section className="sp-promo-banner" aria-label="Featured">
        <div className="sp-promo-banner__art">
          <div className="sp-promo-noise" />
          <div className="sp-promo-flower sp-promo-flower--a" />
          <div className="sp-promo-flower sp-promo-flower--b" />
        </div>
        <div className="sp-promo-banner__copy">
          <p className="sp-promo-eyebrow">Announcement</p>
          <h2 className="sp-promo-headline">Listen on Spotify</h2>
          <p className="sp-promo-subline">Your library, playlists, and podcasts — in one place.</p>
          <button type="button" className="sp-promo-cta">
            Listen now
          </button>
        </div>
      </section>

      {/* ── Filter Chips ── */}
      <div className="sp-filter-row">
        {['all', 'music', 'podcasts'].map((f) => (
          <button
            key={f}
            type="button"
            className={`sp-filter-chip ${filter === f ? 'sp-filter-chip--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'music' ? 'Music' : 'Podcasts'}
          </button>
        ))}
      </div>

      {filter === 'podcasts' && (
        <div className="spot-empty-podcasts">
          <Mic size={40} strokeWidth={1.5} color="var(--sp-subdued)" />
          <p className="spot-empty-podcasts__title">Follow your first podcast</p>
          <p className="spot-empty-podcasts__sub">Saved episodes and shows will appear here.</p>
        </div>
      )}

      {/* ── Quick Access Grid (Spotify-style compact cards) ── */}
      {showMusicBrowse && quickAccessItems.length > 0 && (
        <QuickAccessGrid items={quickAccessItems} onPlay={onPlayTrack} currentTrack={currentTrack} />
      )}

      {/* ── Jump Back In ── */}
      {showMusicBrowse && history.length > 0 && (
        <div className="home-section">
          <SectionHead icon={null} title="Jump back in" onSeeAll={() => onNavigateSearch?.('recently played')} />
          <JumpBackIn tracks={history} onPlayTrack={onPlayTrack} currentTrack={currentTrack} />
        </div>
      )}

      {/* ── Recommended for You ── */}
      {showMusicBrowse && recommended.length > 0 && (
        <div className="home-section">
          <SectionHead icon={Star} iconColor="#f59e0b" title="Made for you" />
          <HScrollCards tracks={recommended} onPlayTrack={onPlayTrack} currentTrack={currentTrack} maxItems={12} />
        </div>
      )}

      {/* ── Dynamic Sections ── */}
      {showMusicBrowse &&
        sections.map((section) => (
          <div key={section.key} className="home-section">
            <SectionHead
              icon={section.icon}
              iconColor={section.iconColor}
              title={section.title}
              onSeeAll={section.key === 'trending' ? () => onNavigateSearch?.('Trending India') : undefined}
            />
            <HScrollCards
              tracks={section.tracks}
              onPlayTrack={onPlayTrack}
              currentTrack={currentTrack}
              badge={section.badge}
              maxItems={10}
            />
          </div>
        ))}

      <div style={{ height: 40 }} />
    </div>
  );
};

export default HomePage;
