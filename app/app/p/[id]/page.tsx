import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKey, currentStreak } from "@/lib/dates";
import { verifyCheckInAction, nudgeAction } from "@/app/actions";
import CheckInForm from "./CheckInForm";
import IntentionForm from "./IntentionForm";
import SoundButton from "@/app/ui/SoundButton";
import FocusPresence from "@/app/ui/FocusPresence";

export default async function SeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();

  const s = await prisma.partnerSeason.findUnique({
    where: { id },
    include: {
      inviter: true,
      invitee: true,
      checkIns: { include: { author: true }, orderBy: { day: "desc" } },
    },
  });

  if (!s || (s.inviterId !== me.id && s.inviteeId !== me.id)) notFound();

  const partner = s.inviterId === me.id ? s.invitee : s.inviter;
  const myGoal = s.inviterId === me.id ? s.inviterGoal : s.inviteeGoal;
  const partnerGoal = s.inviterId === me.id ? s.inviteeGoal : s.inviterGoal;
  const today = dayKey();

  const myDays = s.checkIns.filter((c) => c.authorId === me.id).map((c) => c.day);
  const partnerDays = s.checkIns.filter((c) => c.authorId === partner.id).map((c) => c.day);
  const myStreak = currentStreak(myDays);
  const partnerStreak = currentStreak(partnerDays);
  const myToday = s.checkIns.find((c) => c.authorId === me.id && c.day === today);

  const intentions = await prisma.dailyIntention.findMany({ where: { seasonId: id, day: today } });
  const myIntention = intentions.find((i) => i.userId === me.id);
  const partnerIntention = intentions.find((i) => i.userId === partner.id);

  const daysLeft = s.endsAt
    ? Math.max(0, Math.ceil((s.endsAt.getTime() - Date.now()) / 864e5))
    : s.lengthDays;

  // group checkins by day for the timeline
  const dayMap = new Map<string, typeof s.checkIns>();
  for (const c of s.checkIns) {
    const arr = dayMap.get(c.day) ?? [];
    arr.push(c);
    dayMap.set(c.day, arr);
  }
  const days = [...dayMap.keys()].sort().reverse();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app" className="text-sm" style={{ color: "var(--muted)" }}>
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{s.title}</h1>
          <span className="chip">{daysLeft} days left · {s.category}</span>
        </div>
      </div>

      {s.status === "active" && <FocusPresence seasonId={s.id} />}

      {/* The two commitments */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">You</span>
            <span className="chip" style={{ color: "var(--accent-2)" }}>🔥 {myStreak}d</span>
          </div>
          <p className="mt-2 text-sm">{myGoal}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Today&apos;s intention
          </p>
          <IntentionForm seasonId={s.id} current={myIntention?.text ?? ""} />
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="font-semibold">@{partner.username}</span>
            <span className="chip" style={{ color: "var(--accent-2)" }}>🔥 {partnerStreak}d</span>
          </div>
          <p className="mt-2 text-sm">{partnerGoal || "—"}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Today&apos;s intention
          </p>
          <p className="mt-1 text-sm">
            {partnerIntention?.text || <span style={{ color: "var(--muted)" }}>not set yet</span>}
          </p>
          {s.status === "active" && (
            <form action={nudgeAction} className="mt-3">
              <input type="hidden" name="seasonId" value={s.id} />
              <SoundButton sound="pop" className="btn btn-ghost px-3 py-2 text-sm">
                👀 Nudge @{partner.username}
              </SoundButton>
            </form>
          )}
        </div>
      </div>

      {/* Today's check-in */}
      <section className="card">
        <h2 className="mb-4 text-lg font-bold">
          {myToday ? "Today — checked in ✓" : "Today — not yet"}
        </h2>
        <CheckInForm
          seasonId={s.id}
          existingNote={myToday?.note ?? ""}
          existingProof={myToday?.proof ?? ""}
          done={!!myToday}
        />
      </section>

      {/* Timeline */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Timeline</h2>
        {days.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No check-ins yet. Be the first to show up.
          </p>
        )}
        <div className="space-y-4">
          {days.map((day) => {
            const entries = dayMap.get(day)!;
            return (
              <div key={day} className="card">
                <div className="mb-3 text-sm font-semibold" style={{ color: "var(--muted)" }}>
                  {day}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {entries.map((c) => {
                    const mine = c.authorId === me.id;
                    return (
                      <div key={c.id} className="rounded-xl border p-4" style={{ background: "var(--surface-2)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {mine ? "You" : `@${c.author.username}`}
                          </span>
                          {c.verifiedById ? (
                            <span className="chip" style={{ color: "var(--accent-2)" }}>✓ verified</span>
                          ) : (
                            <span className="chip" style={{ color: "var(--muted)" }}>unverified</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm">{c.note || <span style={{ color: "var(--muted)" }}>No note.</span>}</p>
                        {c.proof && (
                          <p className="mt-1 break-all text-xs" style={{ color: "var(--accent-2)" }}>{c.proof}</p>
                        )}
                        {!mine && !c.verifiedById && (
                          <form action={verifyCheckInAction} className="mt-3">
                            <input type="hidden" name="checkInId" value={c.id} />
                            <SoundButton sound="success" className="btn btn-primary w-full px-4 py-2 text-sm">
                              Verify this ✓
                            </SoundButton>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
