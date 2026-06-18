import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Focus</h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          Run a timer or stopwatch, then log the session straight to a partner.
        </p>
      </div>
      <FocusPresence />
      <FocusTimer seasons={seasons} />
      <FocusSounds />
    </div>
  );
}
