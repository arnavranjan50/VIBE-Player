import { useState } from 'react';
import { Heart, Play } from 'lucide-react';
import { saveToHistory, toggleFavorite, isFavorite } from '../utils/storage';

const TrackList = ({ tracks, currentTrack, onPlayTrack, showIndex }) => {
  const [, forceUpdate] = useState(0);

  if (!tracks?.length) return null;

  const handlePlay = (track) => {
    saveToHistory(track);
    onPlayTrack(track);
  };

  const handleHeart = (e, track) => {
    e.stopPropagation();
    toggleFavorite(track);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="track-list">
      {tracks.map((track, idx) => {
        const isPlaying = currentTrack?.id === track.id;
        const isFav = isFavorite(track.id);

        return (
          <div
            key={track.id}
            className={`track-item ${isPlaying ? 'playing' : ''}`}
            onClick={() => handlePlay(track)}
            id={`track-${track.id}`}
          >
            {showIndex && (
              <span style={{ width: 28, textAlign: 'center', fontSize: 14, color: isPlaying ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                {isPlaying ? '' : idx + 1}
              </span>
            )}

            {isPlaying && showIndex && (
              <div className="eq-bars" style={{ marginRight: 0, marginLeft: -20 }}>
                <div className="eq-bar" /><div className="eq-bar" /><div className="eq-bar" /><div className="eq-bar" />
              </div>
            )}

            {!showIndex && (
              track.cover ? (
                <img src={track.cover} alt={track.title} className="track-cover" loading="lazy" />
              ) : (
                <div className="track-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={18} color="var(--text-secondary)" />
                </div>
              )
            )}

            <div className="track-info">
              <div className="track-title">{track.title}</div>
              <div className="track-artist">
                {track.artist}
                {isPlaying && <span className="hq-badge">320kbps</span>}
              </div>
            </div>

            {isPlaying && !showIndex && (
              <div className="eq-bars">
                <div className="eq-bar" /><div className="eq-bar" /><div className="eq-bar" /><div className="eq-bar" />
              </div>
            )}

            <div className="track-actions">
              <button className="track-action-btn" onClick={(e) => handleHeart(e, track)}>
                <Heart size={18} fill={isFav ? 'var(--accent)' : 'transparent'} color={isFav ? 'var(--accent)' : 'var(--text-secondary)'} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;
