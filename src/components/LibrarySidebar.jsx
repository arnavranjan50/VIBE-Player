import { useMemo, useState, useEffect } from 'react';
import {
  Library,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Search,
  ChevronDown,
  Heart,
  Mic,
  Music,
  User,
  ListMusic,
} from 'lucide-react';
import { getFavorites, getHistory, getPlaylists, createPlaylist, getRecentArtists } from '../utils/storage';

const LibrarySidebar = ({
  collapsed,
  onToggleCollapsed,
  libraryFilter,
  onLibraryFilter,
  onSelectHome,
  onSelectSearch,
  onSelectLiked,
  onSelectRecent,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState('Recents');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const fn = () => setRevision((r) => r + 1);
    window.addEventListener('vibe-storage', fn);
    return () => window.removeEventListener('vibe-storage', fn);
  }, []);

  const handleNewPlaylist = () => {
    const name = prompt('Playlist name:');
    if (name?.trim()) {
      createPlaylist(name.trim());
      window.dispatchEvent(new Event('vibe-storage'));
    }
  };

  const favorites = getFavorites();
  const history = getHistory();
  const playlists = getPlaylists();
  const artists = getRecentArtists();

  const rows = useMemo(() => {
    const items = [];

    if (libraryFilter === 'playlists') {
      items.push({
        key: 'liked',
        title: 'Liked Songs',
        sub: favorites.length ? `Playlist • ${favorites.length} songs` : 'Playlist',
        thumb: favorites[0]?.cover || null,
        icon: 'liked',
        onClick: onSelectLiked,
      });
      playlists.forEach((pl) => {
        items.push({
          key: `pl-${pl.id}`,
          title: pl.name,
          sub: `Playlist • ${pl.tracks?.length ?? 0} songs`,
          thumb: pl.tracks?.[0]?.cover || null,
          icon: 'playlist',
          onClick: () => onSelectPlaylist(pl),
        });
      });
    }

    if (libraryFilter === 'podcasts') {
      items.push({
        key: 'episodes',
        title: 'Your Episodes',
        sub: 'Saved & downloaded episodes',
        thumb: null,
        icon: 'podcast',
        onClick: onSelectHome,
      });
    }

    if (libraryFilter === 'artists') {
      artists.forEach((name, i) => {
        const t = history.find((x) => x.artist?.includes(name));
        items.push({
          key: `art-${i}-${name}`,
          title: name.split(',')[0].trim(),
          sub: 'Artist',
          thumb: t?.cover || null,
          icon: 'artist',
          onClick: () => onSelectArtist(name),
        });
      });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    libraryFilter,
    favorites,
    playlists,
    artists,
    history,
    revision,
  ]);

  const Thumb = ({ row }) => {
    if (row.thumb) {
      return <img src={row.thumb} alt="" className="spot-lib-thumb-img" loading="lazy" />;
    }
    if (row.icon === 'liked') {
      return (
        <div className="spot-lib-thumb spot-lib-thumb--liked">
          <Heart size={18} fill="#fff" color="#fff" />
        </div>
      );
    }
    if (row.icon === 'podcast') {
      return (
        <div className="spot-lib-thumb spot-lib-thumb--podcast">
          <Mic size={18} color="#fff" />
        </div>
      );
    }
    if (row.icon === 'artist') {
      return (
        <div className="spot-lib-thumb spot-lib-thumb--artist">
          <User size={18} color="var(--sp-subdued)" />
        </div>
      );
    }
    return (
      <div className="spot-lib-thumb spot-lib-thumb--playlist">
        <ListMusic size={18} color="var(--sp-subdued)" />
      </div>
    );
  };

  return (
    <aside className={`spot-sidebar spot-sidebar--nav ${collapsed ? 'spot-sidebar--collapsed' : ''}`}>
      <div className="spot-sidebar__inner">
        <div className="spot-lib-header">
          <button
            type="button"
            className="spot-lib-header__title"
            onClick={() => (collapsed ? onToggleCollapsed() : undefined)}
            title={collapsed ? 'Expand library' : 'Your Library'}
            aria-expanded={!collapsed}
          >
            <Library size={22} strokeWidth={2} />
            {!collapsed && <span>Your Library</span>}
          </button>
          <div className="spot-lib-header__actions">
            {!collapsed && (
              <button type="button" className="spot-icon-btn" title="Create playlist" onClick={handleNewPlaylist}>
                <Plus size={20} />
              </button>
            )}
            <button type="button" className="spot-icon-btn" title={collapsed ? 'Expand library' : 'Collapse library'} onClick={onToggleCollapsed}>
              {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
            {collapsed && (
              <button type="button" className="spot-icon-btn" title="Create playlist" onClick={handleNewPlaylist}>
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="spot-lib-chips">
            {['Playlists', 'Podcasts', 'Artists'].map((label) => {
              const id = label.toLowerCase();
              const active = libraryFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`spot-pill ${active ? 'spot-pill--active' : ''}`}
                  onClick={() => onLibraryFilter(id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {!collapsed && (
          <div className="spot-lib-toolbar">
            <button type="button" className="spot-icon-btn spot-lib-search-trigger" title="Search in library" onClick={onSelectSearch}>
              <Search size={18} />
            </button>
            <div className="spot-sort">
              <button type="button" className="spot-sort__btn" onClick={() => setSortOpen((v) => !v)}>
                {sortLabel}
                <ChevronDown size={16} />
              </button>
              {sortOpen && (
                <div className="spot-sort__menu">
                  {['Recents', 'Recently Added', 'Alphabetical'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className="spot-sort__item"
                      onClick={() => {
                        setSortLabel(opt);
                        setSortOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="spot-lib-list">
          {!collapsed && libraryFilter !== 'podcasts' && (
            <button type="button" className="spot-lib-row spot-lib-row--muted" onClick={onSelectRecent}>
              <div className="spot-lib-thumb spot-lib-thumb--muted">
                <Music size={18} color="var(--sp-subdued)" />
              </div>
              <div className="spot-lib-meta">
                <span className="spot-lib-row-title">Recently played</span>
                <span className="spot-lib-row-sub">{history.length ? `${history.length} tracks` : 'Jump back in'}</span>
              </div>
            </button>
          )}
          {rows.map((row) => (
            <button key={row.key} type="button" className="spot-lib-row" onClick={row.onClick}>
              <div className="spot-lib-thumb-wrap">
                <Thumb row={row} />
              </div>
              {!collapsed && (
                <div className="spot-lib-meta">
                  <span className="spot-lib-row-title">{row.title}</span>
                  <span className="spot-lib-row-sub">{row.sub}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default LibrarySidebar;
