import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// how far back chat is ever visible. older rows are pruned on send — these
// messages are ephemeral by design, not a stored conversation history.
const WINDOW_MS = 2 * 60 * 60 * 1000; // 2h
const MAX_RETURN = 50;
const MAX_LEN = 280;

// confirm the caller is one of the two partners in this (active) season
async function membership(seasonId: string, userId: string) {
  const season = await prisma.partnerSeason.findUnique({
    where: { id: seasonId },
    select: { status: true, inviterId: true, inviteeId: true },
  });
  if (!season) return null;
  if (season.inviterId !== userId && season.inviteeId !== userId) return null;
  return season;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ messages: [] }, { status: 401 });
  const { id } = await params;
  if (!(await membership(id, me.id))) return NextResponse.json({ messages: [] }, { status: 403 });

  const url = new URL(req.url);
  const afterRaw = url.searchParams.get("after");
  const after = afterRaw ? new Date(afterRaw) : null;
  const since = new Date(Date.now() - WINDOW_MS);

  const rows = await prisma.seasonMessage.findMany({
    where: {
      seasonId: id,
      createdAt: after && !isNaN(after.getTime()) ? { gt: after } : { gte: since },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_RETURN,
  });

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const season = await membership(id, me.id);
  if (!season) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (season.status !== "active") return NextResponse.json({ error: "season not active" }, { status: 409 });

  let body = "";
  try {
    body = String(((await req.json()) as { body?: unknown })?.body ?? "").trim();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!body) return NextResponse.json({ error: "empty" }, { status: 400 });
  body = body.slice(0, MAX_LEN);

  // ephemeral: drop anything older than the window before adding the new line
  await prisma.seasonMessage.deleteMany({
    where: { seasonId: id, createdAt: { lt: new Date(Date.now() - WINDOW_MS) } },
  });

  const m = await prisma.seasonMessage.create({
    data: { seasonId: id, senderId: me.id, senderName: me.username, body },
  });

  return NextResponse.json({
    message: {
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    },
  });
}
