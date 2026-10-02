// Talks to the same Firebase Realtime Database the Chrome extension writes to.
// No Firebase SDK needed — the RTDB REST API is just plain HTTPS + JSON.

const FIREBASE_BASE = "https://video-sync-app-e65d8-default-rtdb.firebaseio.com";

export type SyncedVideo = {
  url: string;
  time: number;
  updatedAt: number;
};

export async function fetchLatest(uid: string): Promise<SyncedVideo | null> {
  const res = await fetch(`${FIREBASE_BASE}/users/${uid}/latest.json`);
  if (!res.ok) throw new Error(`Firebase request failed (${res.status})`);
  const data = await res.json();
  if (!data || !data.url) return null;
  return data as SyncedVideo;
}

// Pulls the 11-char video ID out of any common YouTube URL shape.
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // Handles /shorts/<id> and /embed/<id>
      const match = u.pathname.match(/\/(shorts|embed)\/([^/]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

export function thumbnailFor(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Rebuilds a YouTube URL that seeks straight to the saved timestamp.
export function urlWithTimestamp(url: string, time: number): string {
  const seconds = Math.floor(time);
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
  }
  return url;
}

export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function timeAgo(timestampMs: number): string {
  const diff = Math.max(0, Date.now() - timestampMs);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}