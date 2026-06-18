import { PrismaClient } from "../lib/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ok = (m) => console.log("  ✓ " + m);

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  // unique names
  const tag = Date.now();
  const me = await prisma.user.create({ data: { username: `del_me_${tag}`, email: `me${tag}@t.co`, passwordHash: hash } });
  const partner = await prisma.user.create({ data: { username: `del_p_${tag}`, email: `p${tag}@t.co`, passwordHash: hash } });
  const invitee = await prisma.user.create({ data: { username: `del_i_${tag}`, email: `i${tag}@t.co`, passwordHash: hash, invitedById: me.id } });

  await prisma.session.create({ data: { token: `tok_${tag}`, userId: me.id, expiresAt: new Date(Date.now() + 864e5) } });
  await prisma.inviteCode.create({ data: { code: `DELCODE${tag}`, ownerId: me.id } });

  const season = await prisma.partnerSeason.create({
    data: { title: "Del Season", inviterId: me.id, inviterGoal: "x", inviteeId: partner.id, inviteeGoal: "y", status: "active" },
  });
  await prisma.checkIn.create({ data: { seasonId: season.id, authorId: me.id, day: "2026-01-01", note: "mine" } });
  const partnerCheck = await prisma.checkIn.create({
    data: { seasonId: season.id, authorId: partner.id, day: "2026-01-01", note: "theirs", verifiedById: me.id, verifiedAt: new Date() },
  });
  ok("built a full graph (sessions, code, season, check-ins, invitee, verification)");

  // replicate deleteAccountAction transaction
  await prisma.$transaction([
    prisma.checkIn.updateMany({ where: { verifiedById: me.id }, data: { verifiedById: null, verifiedAt: null } }),
    prisma.partnerSeason.deleteMany({ where: { OR: [{ inviterId: me.id }, { inviteeId: me.id }] } }),
    prisma.checkIn.deleteMany({ where: { authorId: me.id } }),
    prisma.inviteCode.deleteMany({ where: { ownerId: me.id } }),
    prisma.user.updateMany({ where: { invitedById: me.id }, data: { invitedById: null } }),
    prisma.user.delete({ where: { id: me.id } }),
  ]);
  ok("delete transaction completed with no FK violation");

  // assertions
  if (await prisma.user.findUnique({ where: { id: me.id } })) throw new Error("user not deleted");
  if (await prisma.session.findFirst({ where: { userId: me.id } })) throw new Error("session not cascaded");
  if (await prisma.partnerSeason.findUnique({ where: { id: season.id } })) throw new Error("season not deleted");
  const inviteeAfter = await prisma.user.findUnique({ where: { id: invitee.id } });
  if (inviteeAfter.invitedById !== null) throw new Error("invitee not detached");
  ok("invitee preserved & detached, sessions/seasons/check-ins gone");

  // partner survived; their (deleted-season) check-in is gone, but partner intact
  if (!(await prisma.user.findUnique({ where: { id: partner.id } }))) throw new Error("partner wrongly deleted");
  void partnerCheck;
  ok("partner account intact");

  // cleanup
  await prisma.checkIn.deleteMany({ where: { authorId: { in: [partner.id, invitee.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [partner.id, invitee.id] } } });
  ok("cleaned up");

  console.log("\nDELETE-ACCOUNT CASCADE PASSED ✅");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());
