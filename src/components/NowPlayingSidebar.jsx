import {
  X,
  Maximize2,
  Share2,
  ListPlus,
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from 'lucide-react';

const NowPlayingSidebar = ({
  track,
  isPlaying,
  onClose,
  onTogglePlay,
  onSkipPrev,
  onSkipNext,
  onOpenFullscreen,
  disabled,
}) => {
  if (!track) return null;

  const artist = track.artist?.split(',')[0]?.trim() || 'Artist';

  return (
    <aside className="spot-sidebar spot-sidebar--now">
      <div className="spot-now__header">
        <span className="spot-now__header-title">{track.title}</span>
        <div className="spot-now__header-actions">
          <button type="button" className="spot-icon-btn" title="Open full player" onClick={onOpenFullscreen}>
            <Maximize2 size={18} />
          </button>
          <button type="button" className="spot-icon-btn" title="Close panel" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`spot-now__viz ${isPlaying ? 'spot-now__viz--playing' : ''}`}>
        <div className="spot-now__viz-smoke" />
        {track.cover && (
          <img src={track.cover} alt="" className="spot-now__viz-cover" loading="lazy" />
        )}
        <button type="button" className="spot-now__viz-switch">
          Switch to video
        </button>
      </div>

      <div className="spot-now__transport">
        <button type="button" className="spot-now__transport-btn" disabled={disabled} onClick={onSkipPrev} title="Previous">
          <SkipBack size={22} fill="currentColor" color="#fff" />
        </button>
        <button
          type="button"
          className="spot-now__transport-play"
          disabled={disabled}
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={26} fill="#000" /> : <Play size={26} fill="#000" style={{ marginLeft: 3 }} />}
        </button>
        <button type="button" className="spot-now__transport-btn" disabled={disabled} onClick={onSkipNext} title="Next">
          <SkipForward size={22} fill="currentColor" color="#fff" />
        </button>
      </div>

      <div className="spot-now__song">
        <div className="spot-now__song-text">
          <h2 className="spot-now__song-title">{track.title}</h2>
          <p className="spot-now__song-artist">{artist}</p>
        </div>
        <div className="spot-now__song-actions">
          <button type="button" className="spot-icon-btn" title="Share">
            <Share2 size={18} />
          </button>
          <button type="button" className="spot-icon-btn" title="Collapse">
            <ChevronDown size={18} />
          </button>
          <button type="button" className="spot-icon-btn" title="Add to playlist">
            <ListPlus size={20} />
          </button>
        </div>
      </div>

      <div className="spot-now__section">
        <h3 className="spot-now__section-title">Related music videos</h3>
        <div className="spot-now__placeholder-row">
          <div className="spot-now__thumb" style={{ background: '#282828' }} />
          <div className="spot-now__placeholder-lines">
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="spot-now__section">
        <h3 className="spot-now__section-title">About the artist</h3>
        <button type="button" className="spot-now__artist-card">
          {track.cover ? (
            <img src={track.cover} alt="" className="spot-now__artist-avatar" loading="lazy" />
          ) : (
            <div className="spot-now__artist-avatar spot-now__artist-avatar--empty" />
          )}
          <span className="spot-now__artist-name">{artist}</span>
        </button>
      </div>
    </aside>
  );
};

export default NowPlayingSidebar;
