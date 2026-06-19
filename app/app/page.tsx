import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKey, currentStreak } from "@/lib/dates";
import { computeBadges } from "@/lib/badges";
import RespondForm from "./RespondForm";
import Mascot from "@/app/ui/Mascot";
import NotifyToggle from "@/app/ui/NotifyToggle";
import FocusPresence from "@/app/ui/FocusPresence";

export default async function Dashboard() {
  const me = await requireUser();

  const [pending, active] = await Promise.all([
    prisma.partnerSeason.findMany({
      where: { inviteeId: me.id, status: "pending" },
      include: { inviter: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.partnerSeason.findMany({
      where: {
        status: "active",
        OR: [{ inviterId: me.id }, { inviteeId: me.id }],
      },
      include: { inviter: true, invitee: true, checkIns: true },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const today = dayKey();

  const badges = computeBadges({
    totalCheckIns: me.checkInCount,
    bestStreak: me.longestStreak,
    crewSize: me.crewCount,
    verificationsGiven: me.verifyCount,
  });
  const earned = badges.filter((b) => b.earned);

  return (
    <div className="space-y-10">
      <div className="slide-up">
        <h1 className="text-3xl font-bold">Hey @{me.username} 👋</h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          {active.length
            ? "Your partners are counting on today's check-in."
            : "Pair up with someone and start a session."}
        </p>
      </div>

      <NotifyToggle compact />
      <FocusPresence />

      <section className="slide-up" style={{ animationDelay: "0.05s" }}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Achievements {earned.length > 0 && <span style={{ color: "var(--accent-2)" }}>· {earned.length}/{badges.length}</span>}
        </h2>
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span
              key={b.key}
              title={b.desc}
              className={`chip animate-wiggle pop-in ${b.earned ? "" : ""}`}
              style={
                b.earned
                  ? { color: "var(--foreground)", borderColor: "var(--accent)", animationDelay: `${i * 0.04}s` }
                  : { opacity: 0.4, animationDelay: `${i * 0.04}s` }
              }
            >
              <span>{b.emoji}</span> {b.name}
            </span>
          ))}
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Partner requests
          </h2>
          <div className="space-y-4">
            {pending.map((s) => (
              <div key={s.id} className="card" style={{ borderColor: "var(--accent)" }}>
                <p>
                  <span className="font-semibold">@{s.inviter.username}</span> invited you
                  into <span className="font-semibold">“{s.title}”</span> for {s.lengthDays} days.
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  Their goal: {s.inviterGoal}
                </p>
                <RespondForm id={s.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Active sessions
          </h2>
          <Link href="/app/partners" className="btn btn-primary px-4 py-2 text-sm">
            + New session
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="card pop-in text-center">
            <div className="flex justify-center">
              <Mascot size={120} className="animate-float" />
            </div>
            <p className="mt-2 text-lg font-bold">No active sessions yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--muted)" }}>
              Accountability needs a witness. Invite a partner and commit to a goal together.
            </p>
            <Link href="/app/partners" className="btn btn-primary mt-5">
              Find a partner →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((s) => {
              const partner = s.inviterId === me.id ? s.invitee : s.inviter;
              const myGoal = s.inviterId === me.id ? s.inviterGoal : s.inviteeGoal;
              const myDays = s.checkIns.filter((c) => c.authorId === me.id).map((c) => c.day);
              const streak = currentStreak(myDays);
              const iCheckedIn = myDays.includes(today);
              const partnerCheckedToday = s.checkIns.some(
                (c) => c.authorId === partner.id && c.day === today
              );
              const myCheckToday = s.checkIns.find((c) => c.authorId === me.id && c.day === today);
              const needsMyVerify = s.checkIns.some(
                (c) => c.authorId === partner.id && c.day === today && !c.verifiedById
              );
              return (
                <Link key={s.id} href={`/app/p/${s.id}`} className="card transition hover:border-[var(--accent)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{s.title}</h3>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        with @{partner.username}
                      </p>
                    </div>
                    <span className="chip" style={{ color: "var(--accent-2)" }}>
                      🔥 {streak}d
                    </span>
                  </div>
                  <p className="mt-3 text-sm">{myGoal}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="chip" style={iCheckedIn ? { color: "var(--accent-2)" } : { color: "var(--danger)" }}>
                      {iCheckedIn ? "✓ You checked in" : "○ You haven't today"}
                    </span>
                    <span className="chip" style={{ color: "var(--muted)" }}>
                      {partnerCheckedToday ? "Partner: in ✓" : "Partner: pending"}
                    </span>
                    {needsMyVerify && (
                      <span className="chip" style={{ color: "var(--accent)" }}>
                        ⚡ Verify their check-in
                      </span>
                    )}
                    {myCheckToday && !myCheckToday.verifiedById && (
                      <span className="chip" style={{ color: "var(--muted)" }}>
                        awaiting verify
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
