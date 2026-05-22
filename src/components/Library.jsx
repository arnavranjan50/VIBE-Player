import { useState } from 'react';
import { Heart, Clock, Music, Plus } from 'lucide-react';
import TrackList from './TrackList';
import { getFavorites, getHistory, getPlaylists, createPlaylist } from '../utils/storage';
import { dedup } from '../utils/api';

const Library = ({ currentTrack, onPlayTrack }) => {
  const [tab, setTab] = useState('favorites');
  const [favorites, setFavorites] = useState(() => dedup(getFavorites()));
  const [history, setHistory] = useState(() => dedup(getHistory()));
  const [playlists, setPlaylists] = useState(() => getPlaylists());

  const reload = () => {
    setFavorites(dedup(getFavorites()));
    setHistory(dedup(getHistory()));
    setPlaylists(getPlaylists());
  };

  const handleNewPlaylist = () => {
    const name = prompt('Playlist name:');
    if (name?.trim()) { createPlaylist(name.trim()); reload(); }
  };

  const tabs = [
    { id: 'favorites', label: 'Liked Songs', icon: Heart },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'playlists', label: 'Playlists', icon: Music },
  ];

  return (
    <div className="library-page">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>Library</h1>

      <div className="lib-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`lib-tab ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); reload(); }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'favorites' && (
        favorites.length > 0
          ? <TrackList tracks={favorites} currentTrack={currentTrack} onPlayTrack={onPlayTrack} />
          : <div className="empty-state"><Heart size={40} color="var(--text-tertiary)" /><p>Songs you like will appear here</p></div>
      )}

      {tab === 'recent' && (
        history.length > 0
          ? <TrackList tracks={history} currentTrack={currentTrack} onPlayTrack={onPlayTrack} />
          : <div className="empty-state"><Clock size={40} color="var(--text-tertiary)" /><p>Your listening history will appear here</p></div>
      )}

      {tab === 'playlists' && (
        <>
          <button onClick={handleNewPlaylist} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius)', width: '100%', marginBottom: 16, fontSize: 15, fontWeight: 600, color: 'var(--accent)'
          }}>
            <Plus size={20} /> Create New Playlist
          </button>
          {playlists.length > 0 ? playlists.map(pl => (
            <div key={pl.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{pl.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{pl.tracks.length} songs</div>
            </div>
          )) : (
            <div className="empty-state"><Music size={40} color="var(--text-tertiary)" /><p>Create your first playlist</p></div>
          )}
        </>
      )}
    </div>
  );
};

export default Library;
