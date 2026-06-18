"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Session = { id: string; username: string; endsAt: string; seasonId: string | null };

function until(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  const m = Math.max(0, Math.round(ms / 60000));
  return m <= 0 ? "almost done" : `${m} min left`;
}

// seasonId: if given, only show presence for that season's partner
export default function FocusPresence({ seasonId }: { seasonId?: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      fetch("/api/focus/active")
        .then((r) => r.json())
        .then((d) => alive && setSessions(d.sessions || []))
        .catch(() => {});
    tick();
    const id = setInterval(tick, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const shown = seasonId ? sessions.filter((s) => s.seasonId === seasonId) : sessions;
  if (shown.length === 0) return null;

  return (
    <div className="space-y-2">
      {shown.map((s) => (
        <div
          key={s.id}
          className="card flex items-center justify-between gap-3 pop-in"
          style={{ borderColor: "var(--accent-3)" }}
        >
          <p className="text-sm">
            <span style={{ color: "var(--accent-3)" }}>🟢 @{s.username} is focusing</span>{" "}
            <span style={{ color: "var(--muted)" }}>· {until(s.endsAt)}</span>
          </p>
          <Link href="/app/timer" className="btn btn-primary px-4 py-2 text-sm whitespace-nowrap">
            Join →
          </Link>
        </div>
      ))}
    </div>
  );
}
