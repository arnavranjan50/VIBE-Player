import { useState } from 'react';
import { Edit3, Music, Globe, Shield, Headphones, Check, Palette, Zap } from 'lucide-react';
import { getPrefs, updatePrefs, getFavorites, getHistory } from '../utils/storage';

const GENRES = ['Bollywood', 'Pop', 'Hip Hop', 'Lo-Fi', 'Rock', 'EDM', 'Punjabi', 'Classical', 'Jazz', 'R&B', 'K-Pop', 'Indie'];
const LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati'];
const ACCENT_COLORS = ['#fa2d48', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'];

const Profile = () => {
  const [prefs, setPrefs] = useState(getPrefs());
  const [editing, setEditing] = useState(null); // 'name' | 'bio' | null
  const [tempVal, setTempVal] = useState('');

  const stats = {
    liked: getFavorites().length,
    listened: getHistory().length,
  };

  const save = (updates) => {
    updatePrefs(updates);
    setPrefs({ ...prefs, ...updates });
  };

  const startEdit = (field) => {
    setEditing(field);
    setTempVal(prefs[field] || '');
  };

  const confirmEdit = () => {
    if (tempVal.trim()) {
      const updates = { [editing]: tempVal.trim() };
      if (editing === 'displayName') {
        const parts = tempVal.trim().split(' ');
        updates.initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
        updates.username = parts[0];
      }
      save(updates);
    }
    setEditing(null);
  };

  const toggleGenre = (genre) => {
    const current = prefs.favoriteGenres || [];
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    save({ favoriteGenres: updated });
  };

  return (
    <div style={{ padding: '20px 20px 40px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28, letterSpacing: '-.04em' }}>Profile</h1>

      {/* Avatar & Name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: `linear-gradient(135deg, ${prefs.accentColor || '#fa2d48'}, ${prefs.accentColor || '#fa2d48'}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 800, marginBottom: 16,
          boxShadow: `0 8px 32px ${prefs.accentColor || '#fa2d48'}55`,
          letterSpacing: '-.02em',
        }}>
          {prefs.initials || 'AR'}
        </div>

        {editing === 'displayName' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={tempVal} onChange={e => setTempVal(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && confirmEdit()}
              style={{ background: 'var(--bg-highlight)', border: '2px solid var(--accent)', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', width: 200 }}
            />
            <button onClick={confirmEdit} style={{ background: 'var(--accent)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color="#fff" />
            </button>
          </div>
        ) : (
          <button onClick={() => startEdit('displayName')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{prefs.displayName || 'Your Name'}</h2>
            <Edit3 size={14} color="var(--text-secondary)" />
          </button>
        )}

        {editing === 'bio' ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <input value={tempVal} onChange={e => setTempVal(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && confirmEdit()}
              style={{ background: 'var(--bg-highlight)', border: '2px solid var(--accent)', borderRadius: 10, padding: '6px 14px', color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', outline: 'none', width: 200 }}
            />
            <button onClick={confirmEdit} style={{ background: 'var(--accent)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="#fff" />
            </button>
          </div>
        ) : (
          <button onClick={() => startEdit('bio')} style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            {prefs.bio || 'Add a bio'}
            <Edit3 size={12} />
          </button>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.liked}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Liked</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.listened}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Listened</div>
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Palette size={18} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Profile Color</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ACCENT_COLORS.map(c => (
            <button key={c} onClick={() => save({ accentColor: c })} style={{
              width: 36, height: 36, borderRadius: '50%', background: c,
              border: prefs.accentColor === c ? '3px solid #fff' : '3px solid transparent',
              transition: 'all .2s', boxShadow: prefs.accentColor === c ? `0 4px 16px ${c}66` : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Favorite Genres */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Music size={18} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Favorite Genres</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GENRES.map(g => {
            const active = (prefs.favoriteGenres || []).includes(g);
            return (
              <button key={g} onClick={() => toggleGenre(g)} style={{
                padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
                background: active ? 'var(--accent)' : 'var(--bg-highlight)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--glass-border)',
                transition: 'all .2s',
              }}>
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 14 }}>
        {/* Quality */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Headphones size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: 15 }}>Audio Quality</span>
          </div>
          <select value={prefs.quality} onChange={e => save({ quality: e.target.value })} style={{
            background: 'var(--bg-highlight)', color: 'var(--text-primary)', border: 'none', borderRadius: 8,
            padding: '6px 10px', fontSize: 13, fontWeight: 600, outline: 'none',
          }}>
            <option value="128kbps">128kbps</option>
            <option value="320kbps">320kbps (HQ)</option>
          </select>
        </div>

        {/* Language */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Globe size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: 15 }}>Preferred Language</span>
          </div>
          <select value={prefs.language} onChange={e => save({ language: e.target.value })} style={{
            background: 'var(--bg-highlight)', color: 'var(--text-primary)', border: 'none', borderRadius: 8,
            padding: '6px 10px', fontSize: 13, fontWeight: 600, outline: 'none',
          }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Autoplay */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Zap size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: 15 }}>Autoplay</span>
          </div>
          <button onClick={() => save({ autoplay: !prefs.autoplay })} style={{
            width: 44, height: 26, borderRadius: 13, background: prefs.autoplay ? 'var(--accent)' : 'var(--bg-highlight)',
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
              left: prefs.autoplay ? 21 : 3, transition: 'left .2s', boxShadow: '0 2px 4px rgba(0,0,0,.3)',
            }} />
          </button>
        </div>

        {/* Explicit */}
        <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: 15 }}>Explicit Content</span>
          </div>
          <button onClick={() => save({ explicitContent: !prefs.explicitContent })} style={{
            width: 44, height: 26, borderRadius: 13, background: prefs.explicitContent ? 'var(--accent)' : 'var(--bg-highlight)',
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
              left: prefs.explicitContent ? 21 : 3, transition: 'left .2s', boxShadow: '0 2px 4px rgba(0,0,0,.3)',
            }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
