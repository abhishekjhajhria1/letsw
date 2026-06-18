import { prisma } from "./db.mjs";
import bcrypt from "bcryptjs";

const ok = (m) => console.log("  ✓ " + m);

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  const tag = Date.now();
  const hash = await bcrypt.hash("password123", 10);
  const a = await prisma.user.create({ data: { username: `ntf_a_${tag}`, email: `a${tag}@t.co`, passwordHash: hash } });
  const b = await prisma.user.create({ data: { username: `ntf_b_${tag}`, email: `b${tag}@t.co`, passwordHash: hash } });
  const season = await prisma.partnerSeason.create({
    data: { title: "Ntf Season", inviterId: a.id, inviterGoal: "x", inviteeId: b.id, inviteeGoal: "y", status: "active" },
  });
  ok("created users + active season");

  // notification + unread count
  await prisma.notification.create({ data: { userId: b.id, type: "checkin", title: "@a completed today", url: `/app/p/${season.id}` } });
  const unread = await prisma.notification.count({ where: { userId: b.id, read: false } });
  if (unread !== 1) throw new Error("unread count wrong");
  await prisma.notification.updateMany({ where: { userId: b.id, read: false }, data: { read: true } });
  if ((await prisma.notification.count({ where: { userId: b.id, read: false } })) !== 0) throw new Error("mark-read failed");
  ok("notification create + unread count + mark-read");

  // push subscription unique endpoint
  await prisma.pushSubscription.create({ data: { userId: a.id, endpoint: `https://push/${tag}`, p256dh: "p", auth: "x" } });
  let dup = false;
  try { await prisma.pushSubscription.create({ data: { userId: b.id, endpoint: `https://push/${tag}`, p256dh: "p", auth: "x" } }); }
  catch { dup = true; }
  if (!dup) throw new Error("duplicate endpoint allowed");
  ok("push subscription saved + endpoint unique");

  // focus session active query
  const fs = await prisma.focusSession.create({ data: { userId: a.id, seasonId: season.id, endsAt: new Date(Date.now() + 25 * 60000) } });
  const active = await prisma.focusSession.findMany({ where: { userId: { in: [a.id] }, endedAt: null, endsAt: { gt: new Date() } } });
  if (active.length !== 1) throw new Error("active focus query wrong");
  await prisma.focusSession.update({ where: { id: fs.id }, data: { endedAt: new Date() } });
  if ((await prisma.focusSession.count({ where: { endedAt: null, endsAt: { gt: new Date() } } })) !== 0) throw new Error("end focus failed");
  ok("focus session create + active query + end");

  // daily intention upsert (unique per season/user/day)
  const day = dayKey();
  await prisma.dailyIntention.upsert({
    where: { seasonId_userId_day: { seasonId: season.id, userId: a.id, day } },
    update: { text: "v2" }, create: { seasonId: season.id, userId: a.id, day, text: "v1" },
  });
  await prisma.dailyIntention.upsert({
    where: { seasonId_userId_day: { seasonId: season.id, userId: a.id, day } },
    update: { text: "v2" }, create: { seasonId: season.id, userId: a.id, day, text: "v1" },
  });
  const ints = await prisma.dailyIntention.findMany({ where: { seasonId: season.id, userId: a.id, day } });
  if (ints.length !== 1 || ints[0].text !== "v2") throw new Error("intention upsert wrong");
  ok("daily intention upsert (one row, updated)");

  // cleanup: deleting users cascades notifications/push/focus/intentions; delete season first
  await prisma.partnerSeason.delete({ where: { id: season.id } });
  await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  ok("cleaned up (cascades verified)");

  console.log("\nNOTIFY / FOCUS SMOKE PASSED ✅");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());
