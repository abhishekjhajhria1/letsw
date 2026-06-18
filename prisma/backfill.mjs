import { prisma } from "./db.mjs";

function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function key(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function longest(days) {
  const s = [...new Set(days)].sort();
  let best = 0, run = 0, prev = null;
  for (const k of s) {
    const d = new Date(k + "T00:00:00");
    run = prev && Math.round((d - prev) / 864e5) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}
function streakEndingAt(days) {
  const set = new Set(days);
  if (!set.size) return { streak: 0, last: null };
  const last = [...set].sort().at(-1);
  let cursor = new Date(last + "T00:00:00");
  let streak = 0;
  while (set.has(key(cursor))) { streak++; cursor = addDays(cursor, -1); }
  return { streak, last };
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  let n = 0;
  for (const u of users) {
    const [authored, verifyCount, crewCount] = await Promise.all([
      prisma.checkIn.findMany({ where: { authorId: u.id }, select: { day: true } }),
      prisma.checkIn.count({ where: { verifiedById: u.id } }),
      prisma.user.count({ where: { invitedById: u.id } }),
    ]);
    const days = authored.map((c) => c.day);
    const { streak, last } = streakEndingAt(days);
    await prisma.user.update({
      where: { id: u.id },
      data: {
        checkInCount: days.length,
        verifyCount,
        crewCount,
        streakCount: streak,
        longestStreak: longest(days),
        lastCheckInDay: last,
      },
    });
    n++;
  }
  console.log(`Backfilled counters for ${n} user(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
