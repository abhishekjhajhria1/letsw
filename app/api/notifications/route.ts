import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ count: 0 });
  const count = await prisma.notification.count({ where: { userId: me.id, read: false } });
  return NextResponse.json({ count });
}
