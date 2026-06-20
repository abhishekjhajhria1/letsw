import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Heartbeat. The client pings this every ~60s while the app is open; we stamp
// lastSeenAt so others can see a green dot. One small write per minute per
// open tab — fine at this scale; throttle/batch if it ever isn't.
export async function POST() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.user.update({ where: { id: me.id }, data: { lastSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
