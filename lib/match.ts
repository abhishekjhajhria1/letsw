import "server-only";
import { prisma } from "./db";

// The set of user IDs a person may be randomly matched with: their crew
// (people they invited), friends-of-friends (their crew's crew + invite-tree
// siblings + whoever invited them), and anyone they've partnered with. Keeps
// "random" inside the invite-only trust graph — never total strangers.
export async function getMatchPool(meId: string, meInvitedById: string | null): Promise<Set<string>> {
  const crew = await prisma.user.findMany({ where: { invitedById: meId }, select: { id: true } });
  const crewIds = crew.map((c) => c.id);

  const [fofDown, siblings, partnerSeasons] = await Promise.all([
    crewIds.length
      ? prisma.user.findMany({ where: { invitedById: { in: crewIds } }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
    meInvitedById
      ? prisma.user.findMany({ where: { invitedById: meInvitedById }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
    prisma.partnerSeason.findMany({
      where: { OR: [{ inviterId: meId }, { inviteeId: meId }] },
      select: { inviterId: true, inviteeId: true },
    }),
  ]);

  const pool = new Set<string>(crewIds);
  for (const u of fofDown) pool.add(u.id);
  for (const u of siblings) pool.add(u.id);
  if (meInvitedById) pool.add(meInvitedById);
  for (const s of partnerSeasons) {
    pool.add(s.inviterId);
    pool.add(s.inviteeId);
  }
  pool.delete(meId);
  return pool;
}
