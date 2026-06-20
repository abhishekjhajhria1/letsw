// Rough online presence. A user is "online" if their heartbeat landed recently.
// Kept loose on purpose — this drives a green dot, not anything load-bearing.
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

export function isOnline(lastSeenAt: Date | string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}
