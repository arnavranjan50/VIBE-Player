// ── JioSaavn Audio Resolver ──
// Searches JioSaavn for full-length 320kbps audio streams.
// Uses a minimal DES-ECB implementation (pure JS, no dependencies).

const DES_KEY = '38346591';

// ════════════════════════════════════════════
// Minimal DES-ECB implementation (browser-safe)
// ════════════════════════════════════════════

// DES tables
const PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,
  63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
const PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,
  41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
const IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,
  57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
const FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,
  36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
const E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
const P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
const SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];
const S = [
  [[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7],[0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8],[4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0],[15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13]],
  [[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10],[3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5],[0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15],[13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9]],
  [[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8],[13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1],[13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7],[1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12]],
  [[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15],[13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9],[10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4],[3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14]],
  [[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9],[14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6],[4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14],[11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3]],
  [[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11],[10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8],[9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6],[4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13]],
  [[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1],[13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6],[1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2],[6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12]],
  [[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7],[1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2],[7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8],[2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]]
];

function permute(input, table) {
  const out = new Uint8Array(table.length);
  for (let i = 0; i < table.length; i++) {
    const bit = table[i] - 1;
    const byteIdx = bit >> 3;
    const bitIdx = 7 - (bit & 7);
    out[i] = (input[byteIdx] >> bitIdx) & 1;
  }
  return out;
}

function bitsToBytes(bits) {
  const bytes = new Uint8Array(bits.length >> 3);
  for (let i = 0; i < bits.length; i++) {
    bytes[i >> 3] |= bits[i] << (7 - (i & 7));
  }
  return bytes;
}


function generateSubKeys(keyBytes) {
  const cd = permute(keyBytes, PC1);
  let c = cd.slice(0, 28);
  let d = cd.slice(28, 56);
  const subKeys = [];
  for (let i = 0; i < 16; i++) {
    const shift = SHIFTS[i];
    c = Uint8Array.from([...c.slice(shift), ...c.slice(0, shift)]);
    d = Uint8Array.from([...d.slice(shift), ...d.slice(0, shift)]);
    const cd56 = new Uint8Array(56);
    cd56.set(c, 0);
    cd56.set(d, 28);
    // PC2 permutation on bits
    const subKey = new Uint8Array(48);
    for (let j = 0; j < 48; j++) subKey[j] = cd56[PC2[j] - 1];
    subKeys.push(subKey);
  }
  return subKeys;
}

function desBlock(block, subKeys, decrypt) {
  const ip = permute(block, IP);
  let l = ip.slice(0, 32);
  let r = ip.slice(32, 64);

  for (let round = 0; round < 16; round++) {
    const ki = decrypt ? subKeys[15 - round] : subKeys[round];
    // Expand R
    const er = new Uint8Array(48);
    for (let i = 0; i < 48; i++) er[i] = r[E[i] - 1];
    // XOR with key
    for (let i = 0; i < 48; i++) er[i] ^= ki[i];
    // S-boxes
    const sOut = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
      const offset = i * 6;
      const row = (er[offset] << 1) | er[offset + 5];
      const col = (er[offset + 1] << 3) | (er[offset + 2] << 2) | (er[offset + 3] << 1) | er[offset + 4];
      const val = S[i][row][col];
      sOut[i * 4] = (val >> 3) & 1;
      sOut[i * 4 + 1] = (val >> 2) & 1;
      sOut[i * 4 + 2] = (val >> 1) & 1;
      sOut[i * 4 + 3] = val & 1;
    }
    // P permutation
    const pOut = new Uint8Array(32);
    for (let i = 0; i < 32; i++) pOut[i] = sOut[P[i] - 1];
    // XOR with L
    const newR = new Uint8Array(32);
    for (let i = 0; i < 32; i++) newR[i] = l[i] ^ pOut[i];
    l = r;
    r = newR;
  }

  // Final: combine R+L (swapped) and apply FP
  const rl = new Uint8Array(64);
  rl.set(r, 0);
  rl.set(l, 32);
  const fpBits = new Uint8Array(64);
  for (let i = 0; i < 64; i++) fpBits[i] = rl[FP[i] - 1];
  return bitsToBytes(fpBits);
}

function desEcbDecrypt(dataBytes, keyBytes) {
  const subKeys = generateSubKeys(keyBytes);
  const out = [];
  for (let i = 0; i < dataBytes.length; i += 8) {
    const block = dataBytes.slice(i, i + 8);
    if (block.length < 8) break;
    out.push(...desBlock(block, subKeys, true));
  }
  // Remove PKCS5 padding
  const result = new Uint8Array(out);
  const padLen = result[result.length - 1];
  if (padLen > 0 && padLen <= 8) {
    return result.slice(0, result.length - padLen);
  }
  return result;
}

// ════════════════════════════════════════════
// JioSaavn Decryption
// ════════════════════════════════════════════

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function decryptMediaUrl(encUrl) {
  if (!encUrl) return '';
  try {
    const keyBytes = new TextEncoder().encode(DES_KEY);
    const dataBytes = base64ToBytes(encUrl);
    const decBytes = desEcbDecrypt(dataBytes, keyBytes);
    const url = new TextDecoder().decode(decBytes);
    // Upgrade to 320kbps
    return url.replace(/_\d+\./, '_320.');
  } catch (err) {
    console.error('[JioSaavn] Decrypt error:', err);
    return '';
  }
}

// ════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════

const JIO_BASE = '/jio-api';

/**
 * Search JioSaavn and return full-length streaming URLs.
 * Returns an array of { title, artist, audioUrl, cover, duration, ... }
 */
export const resolveAudioUrl = async (title, artist) => {
  if (!title) return null;
  const query = `${title} ${(artist || '').split(',')[0].trim()}`.trim();
  try {
    const params = new URLSearchParams({
      __call: 'search.getResults',
      _format: 'json',
      _marker: '0',
      cc: 'in',
      p: '1',
      q: query,
      n: '5',
    });
    const resp = await fetch(`${JIO_BASE}?${params}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    // Find best match
    const titleLower = title.toLowerCase().trim();
    const match =
      results.find(r => (r.song || r.title || '').toLowerCase().trim() === titleLower) ||
      results.find(r => (r.song || r.title || '').toLowerCase().includes(titleLower)) ||
      results[0];

    if (!match) return null;

    const encUrl = match.encrypted_media_url;
    const audioUrl = decryptMediaUrl(encUrl);

    if (!audioUrl) return null;

    return {
      audioUrl,
      jioId: match.id,
      jioDuration: parseInt(match.duration) || 0,
    };
  } catch (err) {
    console.error('[JioSaavn] resolveAudioUrl error:', err);
    return null;
  }
};

/**
 * Search JioSaavn directly and return full track objects.
 * Used by AI assistant for immediate playback.
 */
export const searchJioSaavn = async (query, limit = 10) => {
  if (!query) return [];
  try {
    const params = new URLSearchParams({
      __call: 'search.getResults',
      _format: 'json',
      _marker: '0',
      cc: 'in',
      p: '1',
      q: query,
      n: String(limit),
    });
    const resp = await fetch(`${JIO_BASE}?${params}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const results = data?.results;
    if (!Array.isArray(results)) return [];

    return results
      .map(r => {
        const audioUrl = decryptMediaUrl(r.encrypted_media_url);
        if (!audioUrl) return null;
        const img = (r.image || '').replace('-150x150', '-500x500').replace('-50x50', '-500x500');
        return {
          id: r.id || '',
          title: r.song || r.title || 'Unknown',
          artist: r.primary_artists || r.singers || 'Unknown Artist',
          artistId: r.primary_artists_id?.split(',')[0]?.trim() || '',
          album: r.album || '',
          albumId: r.albumid || '',
          cover: img,
          audioUrl,
          duration: parseInt(r.duration) || 0,
          year: r.year || '',
          language: r.language || '',
          playCount: parseInt(r.play_count) || 0,
          label: r.label || '',
          releaseDate: r.release_date || '',
          singers: (r.singers || '').split(',').map(s => s.trim()).filter(Boolean),
          hasLyrics: r.has_lyrics === 'true',
          explicit: !!r.explicit_content,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('[JioSaavn] search error:', err);
    return [];
  }
};
