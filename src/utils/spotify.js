// ── Pure Spotify Web API Integration ──
// Uses Client Credentials flow for search/browse/recommendations

const CLIENT_ID = 'ddfa6407b3c249a499edb6739fced2f6';
const CLIENT_SECRET = '86f693182ac0453a92e8faea31bd2c5a';

let accessToken = null;
let tokenExpiry = 0;

// ── Auth ──
const getToken = async () => {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (err) {
    console.error('[Spotify] Auth error:', err);
    return null;
  }
};

// ── Generic fetcher ──
const apiFetch = async (endpoint, params = {}) => {
  const token = await getToken();
  if (!token) return null;
  const url = new URL(`https://api.spotify.com/v1${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  try {
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.status === 401) {
      accessToken = null;
      const newToken = await getToken();
      if (!newToken) return null;
      const retry = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${newToken}` },
      });
      if (!retry.ok) return null;
      return await retry.json();
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`[Spotify] ${endpoint}:`, err);
    return null;
  }
};

// ── Normalize track ──
const normalize = (item) => {
  if (!item || !item.id) return null;
  const images = item.album?.images || [];
  return {
    id: item.id,
    title: item.name || 'Unknown',
    artist: item.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    artistId: item.artists?.[0]?.id || '',
    album: item.album?.name || '',
    albumId: item.album?.id || '',
    cover: images[0]?.url || images[1]?.url || '',
    audioUrl: item.preview_url || '',
    spotifyUri: item.uri || '',
    duration: Math.floor((item.duration_ms || 0) / 1000),
    year: item.album?.release_date?.split('-')[0] || '',
    popularity: item.popularity || 0,
    explicit: item.explicit || false,
    externalUrl: item.external_urls?.spotify || '',
    singers: item.artists?.map(a => a.name) || [],
    label: '',
    releaseDate: item.album?.release_date || '',
    language: '',
    playCount: item.popularity ? item.popularity * 100000 : 0,
    hasLyrics: false,
  };
};

// ── Normalize a title for dedup comparison ──
const normalizeTitle = (title) =>
  (title || '')
    .toLowerCase()
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\(ft\..*?\)/gi, '')
    .replace(/\(from\s+[""].*?[""]\)/gi, '')
    .replace(/\(from\s+.*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s*-\s*(official|audio|video|lyric|full song|remix).*/gi, '')
    .replace(/\(.*?(remix|version|edit|remaster|deluxe|acoustic|live|radio).*?\)/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

// ── Dedup by normalized title + primary artist ──
export const dedup = (tracks) => {
  const seen = new Set();
  return (tracks || []).filter(t => {
    if (!t) return false;
    const key = `${normalizeTitle(t.title)}::${(t.artist || '').split(',')[0].toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ═══════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════

// Search songs
export const searchSongs = async (query, limit = 20, market = 'IN') => {
  if (!query) return [];
  const params = { q: query, type: 'track', limit: Math.min(limit, 50) };
  if (market) params.market = market;
  const data = await apiFetch('/search', params);
  if (!data?.tracks?.items) return [];
  return dedup(data.tracks.items.map(normalize).filter(Boolean));
};

// Artist top tracks — from same artist, DIFFERENT album
export const getArtistTopTracks = async (artistId, excludeAlbumId = null) => {
  if (!artistId) return [];
  const data = await apiFetch(`/artists/${artistId}/top-tracks`, { market: 'IN' });
  if (!data?.tracks) return [];
  let tracks = data.tracks.map(normalize).filter(Boolean);
  if (excludeAlbumId) {
    tracks = tracks.filter(t => t.albumId !== excludeAlbumId);
  }
  return dedup(tracks);
};

// Trending — search-based (playlists require user auth)
export const fetchTrending = async () => {
  return searchSongs('top hits India 2025', 20);
};

// Playlist tracks (search fallback since Client Credentials can't access playlists)
export const fetchPlaylistTracks = async (playlistId, limit = 20) => {
  // Client Credentials flow can't access playlists (403), use search instead
  return searchSongs('trending popular songs', limit);
};

// Mood / genre
export const fetchByMood = async (mood) => {
  const moodMap = {
    happy: 'happy upbeat bollywood', sad: 'sad heartbreak songs hindi',
    energetic: 'high energy workout', chill: 'chill lofi relax',
    romantic: 'romantic love songs hindi', party: 'party dance hits',
    focus: 'focus instrumental ambient', angry: 'angry rap rock',
    devotional: 'devotional bhajan', retro: 'retro classic 90s bollywood',
  };
  return searchSongs(moodMap[mood?.toLowerCase()] || mood || 'top hits', 25);
};

// Search albums
export const searchAlbums = async (query, limit = 10) => {
  if (!query) return [];
  const data = await apiFetch('/search', { q: query, type: 'album', limit, market: 'IN' });
  if (!data?.albums?.items) return [];
  return data.albums.items.map(a => ({
    id: a.id,
    title: a.name || '',
    artist: a.artists?.map(x => x.name).join(', ') || '',
    cover: a.images?.[0]?.url || '',
    year: a.release_date?.split('-')[0] || '',
    songCount: a.total_tracks || 0,
  }));
};

// Album songs
export const getAlbumSongs = async (albumId) => {
  if (!albumId) return [];
  const data = await apiFetch(`/albums/${albumId}`, { market: 'IN' });
  if (!data?.tracks?.items) return [];
  const albumInfo = { name: data.name, id: data.id, images: data.images, release_date: data.release_date };
  return data.tracks.items.map(item => normalize({ ...item, album: albumInfo })).filter(Boolean);
};

// Song suggestions via Spotify recommendations
export const getSongSuggestions = async (trackId) => {
  if (!trackId) return [];
  const data = await apiFetch('/recommendations', { seed_tracks: trackId, limit: 15, market: 'IN' });
  if (!data?.tracks) return [];
  return dedup(data.tracks.map(normalize).filter(Boolean));
};

// Fetch a single track by ID to get a preview URL (if missing in search results).
export const getTrackDetails = async (trackId, market = 'US') => {
  if (!trackId) return null;
  const data = await apiFetch(`/tracks/${trackId}`, { market });
  if (!data) return null;
  return normalize(data);
};

// Lyrics — Lyrics.ovh
export const fetchLyrics = async (songId, title, artist) => {
  const clean = (title || '')
    .replace(/\(feat\..*?\)/gi, '').replace(/\(ft\..*?\)/gi, '')
    .replace(/\(from\s+".*?"\)/gi, '').replace(/\(from\s+.*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s*-\s*(Official|Audio|Video|Lyric|Full Song).*/gi, '')
    .trim();
  const artists = artist ? artist.split(',').map(a => a.trim()) : [];

  for (const art of artists.slice(0, 2)) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(art)}/${encodeURIComponent(clean)}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.lyrics?.trim()) return data.lyrics.trim();
      }
    } catch { /* continue */ }
  }
  return null;
};

// Artist bio — Wikipedia
export const fetchArtistBio = async (artist) => {
  if (!artist) return null;
  const name = artist.split(',')[0].trim();
  try {
    const sr = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name + ' singer')}&format=json&origin=*&srlimit=3`);
    if (!sr.ok) return null;
    const sd = await sr.json();
    const results = sd?.query?.search;
    if (!results?.length) return null;
    const page = results.find(r => {
      const s = (r.snippet || '').toLowerCase();
      return r.title.toLowerCase().includes(name.toLowerCase().split(' ')[0]) &&
        (s.includes('singer') || s.includes('musician') || s.includes('artist') || s.includes('born'));
    }) || results[0];
    const er = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page.title)}&prop=extracts|pageimages&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=300&format=json&origin=*`);
    if (!er.ok) return null;
    const ed = await er.json();
    const pd = Object.values(ed?.query?.pages || {})[0];
    if (pd?.extract?.length > 60) {
      return { name: page.title, bio: pd.extract, image: pd?.thumbnail?.source || null, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}` };
    }
  } catch { /* fail silently */ }
  return null;
};

// Search all
export const searchAll = async (query) => {
  if (!query) return null;
  return apiFetch('/search', { q: query, type: 'track,album,artist', limit: 5, market: 'IN' });
};

// Legacy
export const fetchSongs = searchSongs;
