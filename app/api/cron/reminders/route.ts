import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";

// Drive this every ~15 min from a free external cron (cron-job.org / GitHub Actions)
// with header:  Authorization: Bearer <CRON_SECRET>   (or ?secret=<CRON_SECRET>)
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const ok = secret && (auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { reminderEnabled: true, NOT: { reminderTime: null } },
    select: { id: true, reminderTime: true, reminderTz: true, lastRemindedDay: true },
  });

  const now = new Date();
  let sent = 0;

  for (const u of users) {
    const tz = u.reminderTz || "UTC";
    let localDay: string, localMinutes: number;
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).formatToParts(now);
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
      localDay = `${get("year")}-${get("month")}-${get("day")}`;
      localMinutes = Number(get("hour")) * 60 + Number(get("minute"));
    } catch {
      continue;
    }

    const [h, m] = (u.reminderTime || "0:0").split(":").map(Number);
    const target = h * 60 + m;

    // fire once per local day inside a 20-min window after the chosen time
    if (u.lastRemindedDay === localDay) continue;
    if (localMinutes < target || localMinutes >= target + 20) continue;

    await prisma.user.update({ where: { id: u.id }, data: { lastRemindedDay: localDay } });
    await notify(u.id, {
      type: "reminder",
      title: "Time to focus ⏰",
      body: "Check in with your partner and keep the streak alive.",
      url: "/app",
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
