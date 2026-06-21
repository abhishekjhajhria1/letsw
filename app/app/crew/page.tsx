import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/stats";
import { liveStreak } from "@/lib/dates";
import { isOnline } from "@/lib/presence";
import OnlineDot from "@/app/ui/OnlineDot";

export default async function CrewPage() {
  const me = await requireUser();

  const [board, betterCount, myCrew] = await Promise.all([
    getLeaderboard(),
    prisma.user.count({ where: { checkInCount: { gt: me.checkInCount }, statsPublic: true } }),
    prisma.user.findMany({
      where: { invitedById: me.id },
      orderBy: [{ streakCount: "desc" }, { checkInCount: "desc" }],
      take: 50,
      select: {
        id: true,
        username: true,
        checkInCount: true,
        streakCount: true,
        lastCheckInDay: true,
        lastSeenAt: true,
        crewCount: true,
        sessionStreak: true,
        lastSessionDay: true,
        statsPublic: true,
      },
    }),
  ]);

  const myRank = betterCount + 1;
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Crew & Leaderboard</h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          You&apos;re ranked <span style={{ color: "var(--accent-2)" }}>#{myRank}</span> · your
          crew is {me.crewCount} strong.
        </p>
      </div>

      {/* My crew */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Your crew ({me.crewCount})
        </h2>
        {myCrew.length === 0 ? (
          <div className="card text-center">
            <p className="font-semibold">No one in your crew yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--muted)" }}>
              Share an invite code — everyone you bring in joins your tree and lifts your rank.
            </p>
            <Link href="/app/invite" className="btn btn-primary mt-5">
              Get invite codes →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myCrew.map((r) => {
              const hidden = !r.statsPublic;
              return (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {!hidden && <OnlineDot online={isOnline(r.lastSeenAt)} size={8} />}
                      @{r.username}
                    </span>
                    {hidden ? (
                      <span className="chip" style={{ color: "var(--muted)" }}>🔒 private</span>
                    ) : (
                      <span className="chip" style={{ color: "var(--accent-2)" }}>
                        🔥 {liveStreak(r.streakCount, r.lastCheckInDay)}d
                      </span>
                    )}
                  </div>
                  {hidden ? (
                    <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                      Keeps their stats private.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-4 text-sm" style={{ color: "var(--muted)" }}>
                      <span>{r.checkInCount} check-ins</span>
                      <span>🎯 {liveStreak(r.sessionStreak, r.lastSessionDay)}d sessions</span>
                      <span>{r.crewCount} in their crew</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Global leaderboard */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Leaderboard
        </h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--muted)" }} className="text-left">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 text-right font-medium">Streak</th>
                <th className="px-4 py-3 text-right font-medium">Sessions</th>
                <th className="px-4 py-3 text-right font-medium">Check-ins</th>
                <th className="px-4 py-3 text-right font-medium">Crew</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, i) => {
                const mine = r.id === me.id;
                return (
                  <tr key={r.id} className="border-t" style={mine ? { background: "rgba(124,92,255,0.12)" } : undefined}>
                    <td className="px-4 py-3 font-semibold">{medal(i)}</td>
                    <td className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <OnlineDot online={isOnline(r.lastSeenAt)} size={8} />
                        @{r.username} {mine && <span style={{ color: "var(--accent)" }}>· you</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--accent-2)" }}>
                      🔥 {liveStreak(r.streakCount, r.lastCheckInDay)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--accent-3)" }}>
                      🎯 {liveStreak(r.sessionStreak, r.lastSessionDay)}d
                    </td>
                    <td className="px-4 py-3 text-right">{r.checkInCount}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--muted)" }}>{r.crewCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {myRank > board.length && (
          <p className="mt-3 text-center text-sm" style={{ color: "var(--muted)" }}>
            You&apos;re #{myRank}. Keep checking in to climb.
          </p>
        )}
      </section>
    </div>
  );
}
