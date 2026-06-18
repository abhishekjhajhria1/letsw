import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ sessions: [] });

  const seasons = await prisma.partnerSeason.findMany({
    where: { status: "active", OR: [{ inviterId: me.id }, { inviteeId: me.id }] },
    select: { inviterId: true, inviteeId: true },
  });
  const partnerIds = [
    ...new Set(seasons.map((s) => (s.inviterId === me.id ? s.inviteeId : s.inviterId))),
  ];
  if (partnerIds.length === 0) return NextResponse.json({ sessions: [] });

  const sessions = await prisma.focusSession.findMany({
    where: { userId: { in: partnerIds }, endedAt: null, endsAt: { gt: new Date() } },
    select: { id: true, endsAt: true, seasonId: true, user: { select: { username: true } } },
    orderBy: { endsAt: "desc" },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      username: s.user.username,
      endsAt: s.endsAt,
      seasonId: s.seasonId,
    })),
  });
}
