/**
 * Platform adapters.
 *
 * The extension captures video data; this module interprets it for display and
 * builds "continue watching" links. Only YouTube gets full timestamp
 * restoration today — generic sites simply open at their URL, because most
 * players cannot be seeked from a URL parameter.
 */

export type PlatformId = 'youtube' | 'generic';

/** Pulls the 11-char video ID out of any common YouTube URL shape. */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
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

export function detectPlatform(url: string): PlatformId {
  return extractYouTubeId(url) ? 'youtube' : 'generic';
}

export function platformLabel(platform: string | null | undefined): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'generic':
      return 'Web video';
    default:
      return 'Unknown';
  }
}

export function thumbnailFor(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** Best-effort thumbnail for any session URL. */
export function thumbnailForUrl(url: string, stored?: string | null): string | null {
  if (stored) return stored;
  const videoId = extractYouTubeId(url);
  return videoId ? thumbnailFor(videoId) : null;
}

/**
 * Rebuilds a URL that resumes playback at the saved timestamp where the
 * platform supports it (YouTube does; generic sites open as-is).
 */
export function continueUrl(url: string, time: number): string {
  const seconds = Math.floor(time);
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`;
  }
  return url;
}

export function supportsTimestampRestore(platform: string | null | undefined): boolean {
  return platform === 'youtube';
}
