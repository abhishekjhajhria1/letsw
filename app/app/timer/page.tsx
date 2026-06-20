import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { liveStreak } from "@/lib/dates";
import FocusTimer from "./FocusTimer";
import FocusSounds from "./FocusSounds";
import FocusPresence from "@/app/ui/FocusPresence";

export default async function TimerPage() {
  const me = await requireUser();

  const seasons = await prisma.partnerSeason.findMany({
    where: { status: "active", OR: [{ inviterId: me.id }, { inviteeId: me.id }] },
    select: { id: true, title: true },
    orderBy: { startedAt: "desc" },
  });

  const sessionStreak = liveStreak(me.sessionStreak, me.lastSessionDay);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Focus session</h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          Pick a short block (30 min–4 hr) and finish it. Show up daily to build
          your streak — then hydrate and move before the next one.
        </p>
      </div>
      <FocusPresence />
      <FocusTimer seasons={seasons} initialStreak={sessionStreak} />
      <FocusSounds />
    </div>
  );
}
