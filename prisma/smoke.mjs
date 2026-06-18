import { PrismaClient } from "../lib/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const ok = (m) => console.log("  ✓ " + m);

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function register(username, email, codeStr) {
  const code = await prisma.inviteCode.findUnique({ where: { code: codeStr } });
  if (!code || code.disabled || code.uses >= code.maxUses) throw new Error("bad code");
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.$transaction(async (tx) => {
    await tx.inviteCode.update({ where: { id: code.id }, data: { uses: { increment: 1 } } });
    return tx.user.create({ data: { username, email, passwordHash, invitedById: code.ownerId ?? null } });
  });
  await prisma.inviteCode.createMany({
    data: Array.from({ length: 3 }, (_, i) => ({ code: `${username.toUpperCase()}${i}${Date.now() % 1000}`, ownerId: user.id })),
  });
  return user;
}

async function cleanup() {
  const users = await prisma.user.findMany({ where: { username: { in: ["smoke_a", "smoke_b"] } } });
  const ids = users.map((u) => u.id);
  if (!ids.length) return;
  await prisma.checkIn.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.partnerSeason.deleteMany({ where: { OR: [{ inviterId: { in: ids } }, { inviteeId: { in: ids } }] } });
  await prisma.inviteCode.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  // break self-relation before deleting (invitee references inviter)
  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { invitedById: null } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await cleanup(); // clear any leftovers from a prior run

  const a = await register("smoke_a", `a${Date.now()}@t.co`, "11xwillwin");
  ok(`registered @${a.username} via seed code`);

  // a generates a code, b uses it -> b is in a's tree
  const aCode = await prisma.inviteCode.findFirst({ where: { ownerId: a.id, uses: 0 } });
  const b = await register("smoke_b", `b${Date.now()}@t.co`, aCode.code);
  if (b.invitedById !== a.id) throw new Error("invite tree broken");
  ok(`@${b.username} joined @${a.username}'s tree`);

  // a invites b into a season
  const season = await prisma.partnerSeason.create({
    data: { title: "Smoke Season", inviterId: a.id, inviterGoal: "Ship daily", inviteeId: b.id, lengthDays: 30, status: "pending" },
  });
  ok("partnership created (pending)");

  // b accepts
  const started = new Date();
  await prisma.partnerSeason.update({
    where: { id: season.id },
    data: { status: "active", inviteeGoal: "Run daily", startedAt: started, endsAt: new Date(started.getTime() + 30 * 864e5) },
  });
  ok("partnership accepted (active)");

  // both check in today
  const today = dayKey();
  const aCheck = await prisma.checkIn.create({ data: { seasonId: season.id, authorId: a.id, day: today, note: "shipped" } });
  await prisma.checkIn.create({ data: { seasonId: season.id, authorId: b.id, day: today, note: "ran 5k" } });
  ok("both partners checked in");

  // duplicate check-in same day must fail (unique constraint)
  let dup = false;
  try {
    await prisma.checkIn.create({ data: { seasonId: season.id, authorId: a.id, day: today, note: "again" } });
  } catch {
    dup = true;
  }
  if (!dup) throw new Error("duplicate check-in was allowed!");
  ok("duplicate same-day check-in correctly blocked");

  // b verifies a's check-in
  await prisma.checkIn.update({ where: { id: aCheck.id }, data: { verifiedById: b.id, verifiedAt: new Date() } });
  const verified = await prisma.checkIn.findUnique({ where: { id: aCheck.id } });
  if (verified.verifiedById !== b.id) throw new Error("verify failed");
  ok("partner verification works");

  // cleanup
  await cleanup();
  ok("cleaned up smoke data");

  console.log("\nALL SMOKE CHECKS PASSED ✅");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());
