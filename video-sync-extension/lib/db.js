/**
 * Video Sync — Realtime Database writes over the REST API, authenticated with
 * a Firebase ID token. Every write is scoped to `users/{auth.uid}/…`, which
 * the security rules (`database.rules.json`) enforce server-side as well.
 *
 * Data model (same as the app):
 *   users/{uid}/latest              most recent push
 *   users/{uid}/sessions/{pushId}   full history
 *   users/{uid}/devices/{deviceId}  device registry
 */
const VSDB = (() => {
  const HISTORY_LIMIT = 60;

  function baseUrl() {
    return FIREBASE_CONFIG.databaseURL.replace(/\/+$/, '');
  }

  /** Chronological, lexicographically sortable push id (same scheme as the app). */
  function sessionKey(now) {
    const iso = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const rand = Math.random().toString(36).slice(2, 8);
    return `s${iso}_${rand}`;
  }

  async function rtdb(path, options = {}, params = {}) {
    const token = await VSAuth.idToken();
    if (!token) throw new Error('You need to log in first.');

    const search = new URLSearchParams(params);
    search.set('auth', token);
    const res = await fetch(`${baseUrl()}/${path}.json?${search.toString()}`, options);
    if (res.status === 401) {
      throw new Error('Your session expired. Please log in again.');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Firebase request failed (${res.status}).`);
    }
    return res.json();
  }

  /**
   * Pushes a video session. One atomic patch writes:
   *  - `latest` (what the app shows as Continue Watching)
   *  - a new history entry
   *  - the device heartbeat
   */
  async function pushVideo(video) {
    const user = await VSAuth.currentUser();
    if (!user) throw new Error('You need to log in first.');

    const now = Date.now();
    const key = sessionKey(now);
    const record = {
      platform: video.platform || 'generic',
      url: video.url,
      title: video.title || null,
      thumbnail: video.thumbnail || null,
      time: typeof video.time === 'number' && video.time > 0 ? Math.floor(video.time) : 0,
      deviceId: video.deviceId || null,
      deviceName: video.deviceName || null,
      createdAt: now,
      updatedAt: now,
    };

    const patch = {
      latest: record,
      [`sessions/${key}`]: record,
      [`devices/${video.deviceId || 'unknown'}`]: {
        name: video.deviceName || 'Chrome',
        lastSeen: now,
      },
    };

    await rtdb(`users/${user.uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    trimHistory(user.uid).catch(() => {}); // Best-effort housekeeping.
    return key;
  }

  /** Keeps only the newest HISTORY_LIMIT sessions. */
  async function trimHistory(uid) {
    const sessions = await rtdb(`users/${uid}/sessions`, {}, { shallow: 'true' });
    if (!sessions) return;
    const keys = Object.keys(sessions).sort().reverse();
    if (keys.length <= HISTORY_LIMIT) return;

    const removals = {};
    for (const key of keys.slice(HISTORY_LIMIT)) removals[key] = null;
    await rtdb(`users/${uid}/sessions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(removals),
    });
  }

  return { pushVideo };
})();
