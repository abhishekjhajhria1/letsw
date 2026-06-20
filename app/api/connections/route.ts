import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConnections } from "@/lib/connections";

// Live connection list with online flags, polled by the new-session picker.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ connections: [] });
  const connections = await getConnections(me.id, me.invitedById);
  return NextResponse.json({ connections });
}
