// ── Local Storage Persistence Layer ──
// Manages listening history, favorites, playlists, user prefs, and AI chat

const KEYS = {
  HISTORY: 'vibe_history',
  FAVORITES: 'vibe_favorites',
  PLAYLISTS: 'vibe_playlists',
  CHAT: 'vibe_chat',
  PREFS: 'vibe_prefs',
  QUEUE: 'vibe_queue',
  RECENT_SEARCHES: 'vibe_recent_searches',
};

const MAX_HISTORY = 50;
const MAX_RECENT_SEARCHES = 10;

// ── Helpers ──
const safeGet = (key, fallback = null) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};

const safeSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

// ── Listening History ──
export const saveToHistory = (track) => {
  if (!track?.id) return;
  const history = getHistory();
  const filtered = history.filter(t => t.id !== track.id);
  safeSet(KEYS.HISTORY, [track, ...filtered].slice(0, MAX_HISTORY));
};

export const getHistory = () => safeGet(KEYS.HISTORY, []);

export const getRecentArtists = () => {
  const history = getHistory();
  const artists = [...new Set(history.map(t => t.artist).filter(Boolean))];
  return artists.slice(0, 8);
};

// ── Recommendation Engine ──
export const getRecommendationQuery = () => {
  const history = getHistory();
  if (history.length === 0) {
    const defaults = ['Latest Bollywood Hits', 'Top English Pop', 'Trending 2025', 'Best of Arijit Singh', 'Chill Lofi Beats'];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
  // Weighted random from recent history artists
  const recentArtists = history.slice(0, 10).map(t => t.artist).filter(Boolean);
  if (recentArtists.length > 0) {
    return recentArtists[Math.floor(Math.random() * Math.min(5, recentArtists.length))];
  }
  return history[0]?.title || 'Top Hits';
};

// ── Favorites ──
export const getFavorites = () => safeGet(KEYS.FAVORITES, []);

export const toggleFavorite = (track) => {
  if (!track?.id) return false;
  const favs = getFavorites();
  const exists = favs.some(t => t.id === track.id);
  const newFavs = exists ? favs.filter(t => t.id !== track.id) : [track, ...favs];
  safeSet(KEYS.FAVORITES, newFavs);
  return !exists;
};

export const isFavorite = (trackId) => {
  if (!trackId) return false;
  return getFavorites().some(t => t.id === trackId);
};

// ── Playlists ──
export const getPlaylists = () => safeGet(KEYS.PLAYLISTS, []);

export const createPlaylist = (name) => {
  const playlists = getPlaylists();
  const newPl = { id: Date.now().toString(), name, tracks: [], createdAt: new Date().toISOString() };
  safeSet(KEYS.PLAYLISTS, [newPl, ...playlists]);
  return newPl;
};

export const addToPlaylist = (playlistId, track) => {
  const playlists = getPlaylists();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1 || !track?.id) return;
  if (!playlists[idx].tracks.some(t => t.id === track.id)) {
    playlists[idx].tracks.unshift(track);
    safeSet(KEYS.PLAYLISTS, playlists);
  }
};

export const removeFromPlaylist = (playlistId, trackId) => {
  const playlists = getPlaylists();
  const idx = playlists.findIndex(p => p.id === playlistId);
  if (idx === -1) return;
  playlists[idx].tracks = playlists[idx].tracks.filter(t => t.id !== trackId);
  safeSet(KEYS.PLAYLISTS, playlists);
};

// ── Recent Searches ──
export const getRecentSearches = () => safeGet(KEYS.RECENT_SEARCHES, []);

export const addRecentSearch = (query) => {
  if (!query?.trim()) return;
  const searches = getRecentSearches().filter(s => s.toLowerCase() !== query.toLowerCase());
  safeSet(KEYS.RECENT_SEARCHES, [query, ...searches].slice(0, MAX_RECENT_SEARCHES));
};

export const clearRecentSearches = () => safeSet(KEYS.RECENT_SEARCHES, []);

// ── Chat History ──
export const saveChatHistory = (messages) => safeSet(KEYS.CHAT, messages);
export const getChatHistory = () => safeGet(KEYS.CHAT, null);

// ── User Profile & Preferences ──
export const getPrefs = () => safeGet(KEYS.PREFS, { 
  username: 'Arnav',
  displayName: 'Arnav Ranjan',
  initials: 'AR',
  bio: 'Music Lover 🎵',
  favoriteGenres: ['Bollywood', 'Pop', 'Lo-Fi'],
  quality: '320kbps',
  crossfade: false,
  autoplay: true,
  explicitContent: true,
  language: 'Hindi',
  joinedDate: new Date().toISOString(),
  accentColor: '#fa2d48',
  isLoggedIn: true,
});

export const updatePrefs = (updates) => {
  const current = getPrefs();
  safeSet(KEYS.PREFS, { ...current, ...updates });
};

// ── Queue ──
export const saveQueue = (queue) => safeSet(KEYS.QUEUE, queue);
export const getQueue = () => safeGet(KEYS.QUEUE, []);
