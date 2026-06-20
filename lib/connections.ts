import "server-only";
import { prisma } from "./db";
import { isOnline } from "./presence";
import { liveStreak } from "./dates";

export type Connection = {
  id: string;
  username: string;
  online: boolean;
  streak: number;
  relation: "crew" | "inviter" | "partner";
  hasActive: boolean; // already in an active session together
  pending: boolean; // an outstanding request already exists between us
};

// People you already have a tie to: anyone you invited (your crew), whoever
// invited you, and anyone you've shared a session with. This is the pool the
// "start a session" picker draws from — no typing a username from memory.
export async function getConnections(
  meId: string,
  meInvitedById: string | null,
): Promise<Connection[]> {
  const [seasons, crew] = await Promise.all([
    prisma.partnerSeason.findMany({
      where: { OR: [{ inviterId: meId }, { inviteeId: meId }] },
      select: { inviterId: true, inviteeId: true, status: true },
    }),
    prisma.user.findMany({ where: { invitedById: meId }, select: { id: true } }),
  ]);

  // relation label, most "owned" relation wins (crew > inviter > partner)
  const relation = new Map<string, Connection["relation"]>();
  const active = new Set<string>();
  const pending = new Set<string>();
  for (const s of seasons) {
    const other = s.inviterId === meId ? s.inviteeId : s.inviterId;
    if (!relation.has(other)) relation.set(other, "partner");
    if (s.status === "active") active.add(other);
    if (s.status === "pending") pending.add(other);
  }
  if (meInvitedById) relation.set(meInvitedById, "inviter");
  for (const c of crew) relation.set(c.id, "crew");

  const ids = [...relation.keys()].filter((id) => id !== meId);
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, username: true, lastSeenAt: true, streakCount: true, lastCheckInDay: true },
  });

  return users
    .map((u) => ({
      id: u.id,
      username: u.username,
      online: isOnline(u.lastSeenAt),
      streak: liveStreak(u.streakCount, u.lastCheckInDay),
      relation: relation.get(u.id)!,
      hasActive: active.has(u.id),
      pending: pending.has(u.id),
    }))
    // online first, then alphabetical
    .sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));
}
