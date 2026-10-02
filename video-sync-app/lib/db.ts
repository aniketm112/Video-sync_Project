import { get, onValue, ref, update } from 'firebase/database';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { detectPlatform, thumbnailForUrl } from './platforms';

/**
 * Data model (Firebase Realtime Database):
 *
 * users/{uid}/profile              { username, email, createdAt }
 * users/{uid}/latest               VideoSession (most recent push)
 * users/{uid}/sessions/{pushId}    VideoSession (full history, newest first)
 * users/{uid}/devices/{deviceId}   { name, lastSeen, createdAt }
 *
 * Reads/writes are always scoped to `users/{auth.uid}/…` and the security
 * rules (database.rules.json) reject anything else.
 *
 * Legacy compatibility: the previous version of the app stored
 * `{ url, time, updatedAt }` under `latest`. normalizeSession fills in the
 * missing fields so old pushes keep working without a migration.
 */

export type VideoSession = {
  id: string | null;
  url: string;
  platform: string;
  title: string | null;
  thumbnail: string | null;
  /** Playback position in seconds. */
  time: number;
  deviceId: string | null;
  deviceName: string | null;
  /** Epoch ms. */
  updatedAt: number;
};

export type UserProfile = {
  username: string;
  email: string;
  createdAt: number;
};

export type DeviceEntry = {
  name: string;
  lastSeen: number;
  createdAt: number;
};

const HISTORY_LIMIT = 60;

export function normalizeSession(raw: Record<string, unknown> | null, id: string | null = null): VideoSession | null {
  if (!raw || typeof raw !== 'object' || typeof raw.url !== 'string') return null;

  const url = raw.url;
  return {
    id,
    url,
    platform: typeof raw.platform === 'string' ? raw.platform : detectPlatform(url),
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : null,
    thumbnail: thumbnailForUrl(url, typeof raw.thumbnail === 'string' ? raw.thumbnail : null),
    time: typeof raw.time === 'number' && raw.time > 0 ? raw.time : 0,
    deviceId: typeof raw.deviceId === 'string' ? raw.deviceId : null,
    deviceName: typeof raw.deviceName === 'string' ? raw.deviceName : null,
    updatedAt:
      typeof raw.updatedAt === 'number'
        ? raw.updatedAt
        : typeof raw.createdAt === 'number'
          ? raw.createdAt
          : 0,
  };
}

/** Creates the user's profile node if it doesn't exist yet (never overwrites). */
export async function ensureProfile(user: User): Promise<void> {
  if (!db) return;
  const profileRef = ref(db, `users/${user.uid}/profile`);
  const snap = await get(profileRef);
  if (snap.exists()) return;

  const username =
    user.displayName?.trim() || user.email?.split('@')[0] || 'Viewer';
  await update(ref(db, `users/${user.uid}`), {
    profile: {
      username,
      email: user.email ?? '',
      createdAt: Date.now(),
    },
  });
}

export function subscribeProfile(
  uid: string,
  cb: (profile: UserProfile | null) => void
): () => void {
  if (!db) {
    cb(null);
    return () => {};
  }
  const unsub = onValue(
    ref(db, `users/${uid}/profile`),
    (snap) => {
      const v = snap.val() as Record<string, unknown> | null;
      if (!v) return cb(null);
      cb({
        username: typeof v.username === 'string' ? v.username : 'Viewer',
        email: typeof v.email === 'string' ? v.email : '',
        createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0,
      });
    },
    () => cb(null)
  );
  return unsub;
}

export function subscribeLatest(
  uid: string,
  cb: (session: VideoSession | null) => void
): () => void {
  if (!db) {
    cb(null);
    return () => {};
  }
  const unsub = onValue(
    ref(db, `users/${uid}/latest`),
    (snap) => cb(normalizeSession(snap.val())),
    () => cb(null)
  );
  return unsub;
}

export function subscribeHistory(
  uid: string,
  cb: (sessions: VideoSession[]) => void
): () => void {
  if (!db) {
    cb([]);
    return () => {};
  }
  const unsub = onValue(
    ref(db, `users/${uid}/sessions`),
    (snap) => {
      const val = snap.val() as Record<string, Record<string, unknown>> | null;
      const sessions: VideoSession[] = [];
      if (val) {
        for (const [id, raw] of Object.entries(val)) {
          const s = normalizeSession(raw, id);
          if (s) sessions.push(s);
        }
      }
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      cb(sessions.slice(0, HISTORY_LIMIT));
    },
    () => cb([])
  );
  return unsub;
}

export function subscribeDevices(
  uid: string,
  cb: (devices: Record<string, DeviceEntry>) => void
): () => void {
  if (!db) {
    cb({});
    return () => {};
  }
  const unsub = onValue(
    ref(db, `users/${uid}/devices`),
    (snap) => {
      const val = (snap.val() as Record<string, DeviceEntry> | null) ?? {};
      cb(val);
    },
    () => cb({})
  );
  return unsub;
}

export async function getSession(uid: string, id: string): Promise<VideoSession | null> {
  if (!db) return null;
  const snap = await get(ref(db, `users/${uid}/sessions/${id}`));
  return normalizeSession(snap.val() as Record<string, unknown> | null, id);
}
