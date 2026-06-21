import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConnections } from "@/lib/connections";
import { liveStreak } from "@/lib/dates";
import FocusTimer from "../timer/FocusTimer";
import NewSeasonForm from "./NewSeasonForm";

export default async function PartnersPage() {
  const me = await requireUser();

  const [sent, connections, seasons] = await Promise.all([
    prisma.partnerSeason.findMany({
      where: { inviterId: me.id, status: { in: ["pending", "declined"] } },
      include: { invitee: true },
      orderBy: { createdAt: "desc" },
    }),
    getConnections(me.id, me.invitedById),
    prisma.partnerSeason.findMany({
      where: { status: "active", OR: [{ inviterId: me.id }, { inviteeId: me.id }] },
      select: { id: true, title: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const sessionStreak = liveStreak(me.sessionStreak, me.lastSessionDay);

  return (
    <div className="space-y-12">
      {/* Primary: a short, timed session — pick a partner or go random */}
      <section>
        <h1 className="text-3xl font-bold">Start a session</h1>
        <p className="mt-1.5" style={{ color: "var(--muted)" }}>
          Pick a partner below or hit 🎲 <span className="font-semibold">Random</span>, choose
          30 min–4 hr, and go. Finishing your session builds your streak.
        </p>
        <div className="mt-6">
          <FocusTimer seasons={seasons} connections={connections} initialStreak={sessionStreak} />
        </div>
      </section>

      {/* Secondary: a longer, multi-day accountability partnership */}
      <section>
        <h2 className="text-xl font-bold">Or commit to a multi-day partnership</h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Want something longer? Pair up, each set a goal, and check in daily for a set number of
          days. Don&apos;t know anyone yet? Send an invite code from the Invites tab first.
        </p>
        <div className="card mt-4">
          <NewSeasonForm connections={connections} />
        </div>
      </section>

      {/* Outstanding partnership requests */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Requests you&apos;ve sent
        </h2>
        <div className="mt-4 space-y-3">
          {sent.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nothing sent yet.
            </p>
          )}
          {sent.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between">
                <span className="font-semibold">@{s.invitee.username}</span>
                <span
                  className="chip"
                  style={{ color: s.status === "declined" ? "var(--danger)" : "var(--muted)" }}
                >
                  {s.status === "declined" ? "declined" : "waiting"}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                “{s.title}” · {s.lengthDays} days
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
