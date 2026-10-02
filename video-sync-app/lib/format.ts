/** Formats seconds as m:ss or h:mm:ss (e.g. 32:47, 1:02:05). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds % 60));
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** "3m ago", "2h ago", "5d ago", or a date for anything older. */
export function timeAgo(timestampMs: number): string {
  const diff = Math.max(0, Date.now() - timestampMs);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestampMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** "Oct 2, 2026 · 11:42 PM" */
export function formatDateTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "Mar 2026" for profile "member since". */
export function formatMonthYear(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
