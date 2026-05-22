import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, SkipForward, SkipBack, ChevronDown, Heart, Shuffle, Repeat, Volume2, VolumeX, ListMusic, Speaker, Bluetooth, Headphones, Monitor, Cable, Wifi, Music2, Dna, AlignLeft, Disc3, Mic2, PenTool, Users, Maximize2, PictureInPicture } from 'lucide-react';
import { toggleFavorite, isFavorite } from '../utils/storage';
import { fetchLyrics, fetchArtistBio } from '../utils/api';
import { resolveAudioUrl } from '../utils/jiosaavn';

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

const formatPlayCount = (n) => {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

// Audio output device hook
const useAudioDevice = () => {
  const [device, setDevice] = useState({ name: 'This Device', type: 'speaker', icon: 'speaker' });
  const [showCast, setShowCast] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);

  useEffect(() => {
    const detectDevice = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) { setDevice({ name: 'Speaker', type: 'speaker', icon: 'speaker' }); return; }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAvailableDevices(outputs);
        const active = outputs.find(d => d.deviceId === 'default') || outputs[0];
        if (!active) return;
        const label = (active.label || '').toLowerCase();
        if (label.includes('bluetooth') || label.includes('airpods') || label.includes('buds') || label.includes('jbl') || label.includes('sony') || label.includes('bose'))
          setDevice({ name: active.label.split('(')[0].trim() || 'Bluetooth', type: 'bluetooth', icon: 'bluetooth' });
        else if (label.includes('headphone') || label.includes('earphone') || label.includes('headset'))
          setDevice({ name: active.label.split('(')[0].trim() || 'Headphones', type: 'wired', icon: 'headphones' });
        else if (label.includes('hdmi') || label.includes('display') || label.includes('tv'))
          setDevice({ name: active.label.split('(')[0].trim() || 'Display Audio', type: 'hdmi', icon: 'monitor' });
        else
          setDevice({ name: active.label.split('(')[0].trim() || 'Speaker', type: 'speaker', icon: 'speaker' });
      } catch { setDevice({ name: 'Speaker', type: 'speaker', icon: 'speaker' }); }
    };
    detectDevice();
    navigator.mediaDevices?.addEventListener?.('devicechange', detectDevice);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', detectDevice);
  }, []);

  return { device, showCast, setShowCast, availableDevices };
};

const DeviceIcon = ({ type, size = 16 }) => {
  switch (type) {
    case 'bluetooth': return <Bluetooth size={size} />;
    case 'headphones': return <Headphones size={size} />;
    case 'wired': return <Cable size={size} />;
    case 'hdmi': return <Monitor size={size} />;
    default: return <Speaker size={size} />;
  }
};

// ── Song DNA Panel — Singer bio from Wikipedia ──
const SongDNA = ({ track }) => {
  const [artistInfo, setArtistInfo] = useState(null);
  const [fetchedArtist, setFetchedArtist] = useState(null);

  const primaryArtist = track?.artist?.split(',')[0]?.trim();

  const bioLoading = track && primaryArtist !== fetchedArtist;

  useEffect(() => {
    if (!track || primaryArtist === fetchedArtist) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArtistInfo(null);
    fetchArtistBio(track.artist)
      .then(info => { setArtistInfo(info); setFetchedArtist(primaryArtist); });
  }, [track, primaryArtist, fetchedArtist]);

  if (!track) return null;
  const rows = [
    { icon: <Disc3 size={15} />, label: 'Album', value: track.album },
    { icon: <Mic2 size={15} />, label: 'Singers', value: track.singers?.join(', ') },
    { icon: <Music2 size={15} />, label: 'Music', value: track.musicDirectors?.join(', ') },
    { icon: <PenTool size={15} />, label: 'Lyrics by', value: track.lyricists?.join(', ') },
    { icon: <Users size={15} />, label: 'Label', value: track.label },
    { icon: <Disc3 size={15} />, label: 'Released', value: track.releaseDate || track.year },
    { icon: <Music2 size={15} />, label: 'Language', value: track.language ? track.language.charAt(0).toUpperCase() + track.language.slice(1) : null },
    { icon: <Dna size={15} />, label: 'Play Count', value: formatPlayCount(track.playCount) },
  ].filter(r => r.value && r.value !== '—');

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: '55vh' }}>
      {/* Singer Bio from Wikipedia */}
      {bioLoading && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Looking up {primaryArtist}...</p>
        </div>
      )}
      {artistInfo && (
        <div style={{ marginBottom: 24, padding: '18px', background: 'rgba(255,255,255,.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
            {artistInfo.image && (
              <img src={artistInfo.image} alt={artistInfo.name} style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }} />
            )}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>{artistInfo.name}</h3>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>via Wikipedia</p>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)', fontWeight: 400 }}>
            {artistInfo.bio.length > 700 ? artistInfo.bio.slice(0, 700) + '...' : artistInfo.bio}
          </p>
          <a href={artistInfo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 12, display: 'inline-block' }}>
            Read full bio on Wikipedia →
          </a>
        </div>
      )}
      {!bioLoading && !artistInfo && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(255,255,255,.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,.04)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No artist info found</p>
        </div>
      )}

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, letterSpacing: '-.02em' }}>Production Credits</h3>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16, fontWeight: 400 }}>Who made this song</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
          }}>
            <div style={{ color: 'var(--accent)', flexShrink: 0, opacity: .8 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.value}</div>
            </div>
          </div>
        ))}
      </div>
      {track.copyright && (
        <p style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 16, lineHeight: 1.5, fontWeight: 400 }}>{track.copyright}</p>
      )}
    </div>
  );
};

// ── Lyrics Panel — uses Lyrics.ovh + JioSaavn fallback ──
const LyricsPanel = ({ songId, title, artist }) => {
  const [lyrics, setLyrics] = useState(null);
  const [fetchedId, setFetchedId] = useState(null);
  const loading = songId && songId !== fetchedId;

  useEffect(() => {
    if (!songId || songId === fetchedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLyrics(null);
    fetchLyrics(songId, title, artist).then(l => { setLyrics(l); setFetchedId(songId); });
  }, [songId, title, artist, fetchedId]);

  if (loading) return (
    <div style={{ padding: '40px 28px', textAlign: 'center' }}>
      <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Searching for lyrics...</p>
    </div>
  );

  if (!lyrics) return (
    <div style={{ padding: '48px 28px', textAlign: 'center' }}>
      <AlignLeft size={36} color="var(--text-tertiary)" style={{ marginBottom: 12, opacity: .5 }} />
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>Lyrics not available</p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>We couldn't find lyrics for this track</p>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: '45vh' }}>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16, fontWeight: 500 }}>🎤 Lyrics</p>
      <div style={{ fontSize: 15, lineHeight: 2, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
        {lyrics}
      </div>
    </div>
  );
};

// ── Main PlayerBar ──
const PlayerBar = forwardRef(function PlayerBar({
  currentTrack,
  queue,
  onSkipNext,
  onSkipPrev,
  onPlayTrack,
  onPlaybackUpdate,
  onOpenNowPlaying,
  onNowPlayingPanelVisible, // eslint-disable-line no-unused-vars
}, ref) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [showFull, setShowFull] = useState(false);
  const [closing, setClosing] = useState(false); // fullscreen close animation
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [songSwitching, setSongSwitching] = useState(false); // song switch animation
  const [, forceUpdate] = useState(0);
  const [streamUrl, setStreamUrl] = useState('');
  const audioRef = useRef(null);
  const prevTrackRef = useRef(null);
  const togglePlayRef = useRef(null);
  const { device, showCast, setShowCast, availableDevices } = useAudioDevice();

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, currentTrack]);

  useEffect(() => {
    onPlaybackUpdate?.({ isPlaying, progress, currentTime, duration, currentTrack, streamUrl });
  }, [isPlaying, progress, currentTime, duration, currentTrack, onPlaybackUpdate, streamUrl]);

  useEffect(() => {
    if (!currentTrack) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStreamUrl('');
      return;
    }
    // Trigger song switch animation if track changed
    if (prevTrackRef.current && prevTrackRef.current.id !== currentTrack.id) {
      setSongSwitching(true);
      setTimeout(() => setSongSwitching(false), 400);
    }
    prevTrackRef.current = currentTrack;
    setActivePanel(null);

    if (currentTrack.audioUrl) {
      setStreamUrl(currentTrack.audioUrl);
    } else {
      // Resolve full-length audio from JioSaavn
      setStreamUrl(''); // clear while loading
      resolveAudioUrl(currentTrack.title, currentTrack.artist)
        .then(result => {
          if (result?.audioUrl) {
            setStreamUrl(result.audioUrl);
          } else {
            setStreamUrl('');
            console.warn('[Player] No audio found for:', currentTrack.title);
          }
        })
        .catch(() => setStreamUrl(''));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (streamUrl && audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (!streamUrl && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [streamUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || !streamUrl) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [isPlaying, currentTrack, streamUrl]);

  useEffect(() => {
    togglePlayRef.current = togglePlay;
  }, [togglePlay]);

  useImperativeHandle(ref, () => ({
    togglePlay: () => togglePlayRef.current(),
    openFullscreen: () => setShowFull(true),
  }), []);

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const c = audioRef.current.currentTime;
    const d = audioRef.current.duration;
    setCurrentTime(c);
    if (d > 0) { setProgress((c / d) * 100); setDuration(d); }
  };

  const onEnded = () => {
    if (repeat) { audioRef.current.currentTime = 0; audioRef.current.play(); return; }
    setIsPlaying(false); setProgress(0); onSkipNext?.();
  };

  const seekTo = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current?.duration) audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const switchDevice = async (deviceId) => {
    try { if (audioRef.current?.setSinkId) await audioRef.current.setSinkId(deviceId); setShowCast(false); }
    catch (e) { console.error('Failed to switch audio output:', e); }
  };

  const handleHeart = () => {
    if (!currentTrack) return;
    toggleFavorite(currentTrack);
    forceUpdate((n) => n + 1);
  };

  // Close fullscreen with animation
  const closeFull = () => {
    setClosing(true);
    setTimeout(() => { setShowFull(false); setClosing(false); }, 300);
  };

  const isFav = currentTrack ? isFavorite(currentTrack.id) : false;
  const disabled = !currentTrack;

  return (
    <>
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} preload="auto" />

      {!showFull && (
        <footer 
          className={`spot-player-bar ${songSwitching ? 'song-switch' : ''}`} 
          id="desktop-player"
          onClick={(e) => {
            // Only trigger fullscreen if the click wasn't on a button
            if (e.target.closest('button')) return;
            if (currentTrack) setShowFull(true);
          }}
        >
          <div className="spot-player-bar__left">
            {currentTrack?.cover ? (
              <button
                type="button"
                className="spot-player-artwork"
                onClick={() => currentTrack && setShowFull(true)}
                aria-label="Now playing"
              >
                <img src={currentTrack.cover} alt="" className={`spot-player-artwork__img ${songSwitching ? 'cover-switch' : ''}`} />
              </button>
            ) : (
              <div className="spot-player-artwork spot-player-artwork--empty" />
            )}
            <div className={`spot-player-bar__meta ${songSwitching ? 'meta-switch' : ''}`}>
              <button type="button" className="spot-player-bar__title" disabled={!currentTrack} onClick={() => currentTrack && setShowFull(true)}>
                {currentTrack?.title || 'Nothing playing'}
              </button>
              <span className="spot-player-bar__artist">{currentTrack?.artist || 'Pick a song to play'}</span>
            </div>
            <button
              type="button"
              className={`spot-heart ${disabled ? 'spot-heart--disabled' : ''}`}
              disabled={disabled || !currentTrack}
              onClick={(e) => {
                e.stopPropagation();
                handleHeart();
              }}
              aria-label="Like"
            >
              <Heart size={18} fill={isFav ? 'var(--sp-green)' : 'transparent'} color={isFav ? 'var(--sp-green)' : 'var(--sp-subdued)'} />
            </button>
            <button type="button" className="spot-icon-btn spot-icon-btn--ghost spot-player-pip" title="Picture in picture" disabled={disabled}>
              <PictureInPicture size={18} />
            </button>
          </div>

          <div className="spot-player-bar__center">
            <div className="spot-player-bar__transport">
              <button type="button" className="spot-transport-btn" disabled={disabled} onClick={() => setShuffle(!shuffle)}>
                <Shuffle size={18} color={shuffle ? 'var(--sp-green)' : 'var(--sp-subdued)'} />
              </button>
              <button type="button" className="spot-transport-btn" disabled={disabled} onClick={onSkipPrev}>
                <SkipBack size={22} fill="currentColor" color="var(--sp-primary)" />
              </button>
              <button type="button" className="spot-play-btn" disabled={disabled} onClick={togglePlay} id="play-pause-btn">
                {isPlaying ? <Pause size={22} fill="#000" /> : <Play size={22} fill="#000" style={{ marginLeft: 3 }} />}
              </button>
              <button type="button" className="spot-transport-btn" disabled={disabled} onClick={onSkipNext}>
                <SkipForward size={22} fill="currentColor" color="var(--sp-primary)" />
              </button>
              <button type="button" className="spot-transport-btn" disabled={disabled} onClick={() => setRepeat(!repeat)}>
                <Repeat size={18} color={repeat ? 'var(--sp-green)' : 'var(--sp-subdued)'} />
              </button>
            </div>
            <div className="spot-player-bar__timeline">
              <span className="spot-time">{formatTime(currentTime)}</span>
              <div
                role="slider"
                tabIndex={0}
                aria-valuenow={Math.round(progress)}
                className="spot-progress"
                onClick={disabled ? undefined : seekTo}
                onKeyDown={(e) => e.preventDefault()}
              >
                <div className="spot-progress__fill" style={{ width: disabled ? '0%' : `${progress}%` }} />
              </div>
              <span className="spot-time">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="spot-player-bar__right">
            <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="Lyrics" disabled={disabled} onClick={() => { setShowFull(true); setActivePanel('lyrics'); }}>
              <Mic2 size={18} />
            </button>
            <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="Queue" disabled={disabled} onClick={() => { setShowFull(true); setActivePanel('queue'); }}>
              <ListMusic size={18} />
            </button>
            <div className="spot-player-cast" onMouseEnter={() => setShowCast(true)} onMouseLeave={() => setShowCast(false)}>
              <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="Connect to a device">
                <Speaker size={18} />
              </button>
              {showCast && availableDevices.length > 0 && (
                <div className="spot-cast-pop">
                  <div className="spot-cast-pop__label">Connect to a device</div>
                  {availableDevices.map((d, i) => {
                    const label = d.label || `Device ${i + 1}`;
                    return (
                      <button key={d.deviceId || i} type="button" className="spot-cast-pop__row" onClick={() => switchDevice(d.deviceId)}>
                        <DeviceIcon type={label.toLowerCase().includes('bluetooth') ? 'bluetooth' : label.toLowerCase().includes('headphone') ? 'headphones' : 'speaker'} size={14} />
                        <span>{label.split('(')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="spot-volume">
              {volume === 0 ? <VolumeX size={18} color="var(--sp-subdued)" /> : <Volume2 size={18} color="var(--sp-subdued)" />}
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={volume}
                disabled={disabled}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="spot-volume__range"
                aria-label="Volume"
              />
            </div>
            <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="Full screen" disabled={!currentTrack} onClick={() => setShowFull(true)}>
              <Maximize2 size={18} />
            </button>
            <button type="button" className="spot-icon-btn spot-icon-btn--ghost" title="Now playing view" disabled={!currentTrack} onClick={() => onOpenNowPlaying?.()}>
              <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>

          {/* Mobile specific controls (visible only on mobile via CSS grid setup) */}
          <div className="spot-player-bar__mobile">
            <button type="button" className="spot-transport-btn" disabled={disabled} onClick={togglePlay}>
              {isPlaying ? <Pause size={24} fill="currentColor" color="var(--sp-primary)" /> : <Play size={24} fill="currentColor" color="var(--sp-primary)" />}
            </button>
          </div>
        </footer>
      )}

      {/* ── Full Screen Player ── */}
      {showFull && currentTrack && (
        <div className={`fullscreen-player ${closing ? 'fs-closing' : ''}`} id="fullscreen-player">
          {/* Background */}
          <div className={`fs-bg ${songSwitching ? 'bg-switch' : ''}`}>
            {currentTrack.cover && <img src={currentTrack.cover} alt="" />}
          </div>
          <div className="fs-bg-overlay" />

          {/* Header */}
          <div className="fs-header">
            <button className="fs-header-btn" onClick={closeFull}><ChevronDown size={26} /></button>
            <span className="fs-header-label">Now Playing</span>
            <button className="fs-header-btn" onClick={() => setActivePanel(activePanel === 'queue' ? null : 'queue')} style={{ color: activePanel === 'queue' ? 'var(--accent)' : undefined }}><ListMusic size={20} /></button>
          </div>

          {/* Cover Art — with vinyl glow */}
          <div className="fs-cover-wrap">
            <div className="fs-cover-glow" style={{ background: `url(${currentTrack.cover})`, filter: 'blur(80px) saturate(200%)', opacity: .35 }} />
            {currentTrack.cover ? (
              <img src={currentTrack.cover} alt="" className={`fs-cover ${songSwitching ? 'cover-switch' : ''}`}
                style={{ transform: isPlaying ? 'scale(1)' : 'scale(0.9)', transition: 'transform .6s cubic-bezier(.25,.46,.45,.94)' }} />
            ) : (
              <div className="fs-cover" style={{ background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={48} color="var(--text-secondary)" />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="fs-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="fs-title">{currentTrack.title}</div>
                <div className="fs-artist">{currentTrack.artist}</div>
              </div>
              <button className="fs-heart-btn" onClick={handleHeart}>
                <Heart size={22} fill={isFav ? 'var(--accent)' : 'transparent'} color={isFav ? 'var(--accent)' : 'rgba(255,255,255,.4)'} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="fs-progress">
            <div className="fs-progress-bar" onClick={seekTo}>
              <div className="fs-progress-fill" style={{ width: `${progress}%` }}>
                <div className="fs-progress-thumb" />
              </div>
            </div>
          </div>
          <div className="fs-times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="fs-controls">
            <button className="fs-ctrl-btn" onClick={() => setShuffle(!shuffle)}>
              <Shuffle size={20} color={shuffle ? 'var(--accent)' : 'rgba(255,255,255,.4)'} />
            </button>
            <button className="fs-ctrl-btn fs-skip" onClick={onSkipPrev}>
              <SkipBack size={26} fill="currentColor" />
            </button>
            <button className="fs-play" onClick={togglePlay}>
              {isPlaying ? <Pause size={26} fill="#000" /> : <Play size={26} fill="#000" style={{ marginLeft: 3 }} />}
            </button>
            <button className="fs-ctrl-btn fs-skip" onClick={onSkipNext}>
              <SkipForward size={26} fill="currentColor" />
            </button>
            <button className="fs-ctrl-btn" onClick={() => setRepeat(!repeat)}>
              <Repeat size={20} color={repeat ? 'var(--accent)' : 'rgba(255,255,255,.4)'} />
            </button>
          </div>

          {/* Bottom info row */}
          <div className="fs-extras">
            <span className="hq-badge">HQ</span>
            <div style={{ position: 'relative' }} onMouseEnter={() => setShowCast(true)} onMouseLeave={() => setShowCast(false)}>
              <button className="fs-device-btn">
                <DeviceIcon type={device.icon} size={13} />
                <span>{device.name}</span>
              </button>
              {showCast && availableDevices.length > 0 && (
                <div className="fs-cast-menu">
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '.08em' }}>Output Devices</div>
                  {availableDevices.map((d, i) => {
                    const label = d.label || `Device ${i + 1}`;
                    const isDefault = d.deviceId === 'default';
                    return (
                      <button key={d.deviceId || i} onClick={() => switchDevice(d.deviceId)} className="fs-cast-item" style={{ color: isDefault ? 'var(--accent)' : 'var(--text-primary)', background: isDefault ? 'var(--accent-soft)' : 'transparent' }}>
                        <DeviceIcon type={label.toLowerCase().includes('bluetooth') ? 'bluetooth' : label.toLowerCase().includes('headphone') ? 'headphones' : 'speaker'} size={14} />
                        <span>{label.split('(')[0].trim()}</span>
                        {isDefault && <Wifi size={12} color="var(--accent)" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Tab Buttons: Lyrics | Song DNA ── */}
          <div className="fs-tabs">
            <button className={`fs-tab ${activePanel === 'lyrics' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'lyrics' ? null : 'lyrics')}>
              <AlignLeft size={16} /> Lyrics
            </button>
            <button className={`fs-tab ${activePanel === 'dna' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'dna' ? null : 'dna')}>
              <Dna size={16} /> Song DNA
            </button>
          </div>

          {/* ── Expandable Panel ── */}
          {activePanel && (
            <div className="fs-panel">
              {activePanel === 'lyrics' && <LyricsPanel songId={currentTrack.id} title={currentTrack.title} artist={currentTrack.artist} />}
              {activePanel === 'dna' && <SongDNA track={currentTrack} />}
              {activePanel === 'queue' && (
                <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: '40vh' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, letterSpacing: '-.02em' }}>Up Next</h3>
                  {queue.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Queue is empty</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {queue.slice(0, 20).map((t, i) => {
                        const isCurrent = t.id === currentTrack.id;
                        return (
                          <button key={t.id + i} onClick={() => onPlayTrack?.(t)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10,
                              background: isCurrent ? 'var(--accent-soft)' : 'transparent', textAlign: 'left', transition: 'background .15s',
                            }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? 'var(--accent)' : 'var(--text-tertiary)', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                            {t.cover && <img src={t.cover} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: isCurrent ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artist}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
});

PlayerBar.displayName = 'PlayerBar';

export default PlayerBar;
