import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMatchPool } from "@/lib/match";
import { notify } from "@/lib/notify";

const TTL_MS = 90_000; // a waiting ticket lives ~90s, then expires

async function prune() {
  await prisma.matchTicket.deleteMany({
    where: { status: "waiting", expiresAt: { lt: new Date() } },
  });
}

// POST: enter matchmaking for a session of `minutes`. If a compatible person
// from your crew / friends-of-friends is already waiting, pair instantly and
// create a co-focus session for both. Otherwise enqueue a waiting ticket.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const minutes = Math.max(30, Math.min(240, Math.round(Number(body.minutes) || 30)));

  await prune();

  const pool = await getMatchPool(me.id, me.invitedById);

  const partner = pool.size
    ? await prisma.matchTicket.findFirst({
        where: { status: "waiting", minutes, userId: { in: [...pool] }, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "asc" },
      })
    : null;

  if (partner) {
    const endsAt = new Date(Date.now() + minutes * 60000);
    const [mineFs, partnerFs] = await Promise.all([
      prisma.focusSession.create({ data: { userId: me.id, endsAt } }),
      prisma.focusSession.create({ data: { userId: partner.userId, endsAt } }),
    ]);
    await prisma.matchTicket.update({
      where: { id: partner.id },
      data: { status: "matched", partnerId: me.id, partnerName: me.username, focusSessionId: partnerFs.id },
    });
    await prisma.matchTicket.deleteMany({ where: { userId: me.id } }); // clear any stale ticket of mine
    await notify(partner.userId, {
      type: "match",
      title: `Matched with @${me.username} for ${minutes} min`,
      body: "Your co-focus session is starting now — go.",
      url: "/app/timer",
    });
    return NextResponse.json({ status: "matched", partner: partner.username, minutes, focusSessionId: mineFs.id });
  }

  await prisma.matchTicket.upsert({
    where: { userId: me.id },
    update: {
      minutes,
      status: "waiting",
      partnerId: null,
      partnerName: null,
      focusSessionId: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
    create: { userId: me.id, username: me.username, minutes, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return NextResponse.json({ status: "waiting", minutes });
}

// GET: poll my ticket. Resolves to matched (consumes the ticket) / waiting / none.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const t = await prisma.matchTicket.findUnique({ where: { userId: me.id } });
  if (!t) return NextResponse.json({ status: "none" });

  if (t.status === "matched") {
    await prisma.matchTicket.deleteMany({ where: { userId: me.id } });
    return NextResponse.json({ status: "matched", partner: t.partnerName, minutes: t.minutes, focusSessionId: t.focusSessionId });
  }
  if (t.expiresAt < new Date()) {
    await prisma.matchTicket.deleteMany({ where: { userId: me.id } });
    return NextResponse.json({ status: "none" });
  }
  return NextResponse.json({ status: "waiting", minutes: t.minutes });
}

// DELETE: cancel matchmaking.
export async function DELETE() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.matchTicket.deleteMany({ where: { userId: me.id } });
  return NextResponse.json({ ok: true });
}
