"use client";

import { useEffect, useState } from "react";
import OnlineDot from "./OnlineDot";

type Conn = { id: string; username: string; online: boolean; streak: number; relation: string };

// Live "check on other students" list: your crew / friends-of-friends with
// online dots, current focus status, and streaks. Polls every 20s.
export default function StudentsList() {
  const [conns, setConns] = useState<Conn[]>([]);
  const [focusing, setFocusing] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [c, f] = await Promise.all([
          fetch("/api/connections").then((r) => r.json()),
          fetch("/api/focus/active").then((r) => r.json()),
        ]);
        if (!alive) return;
        if (Array.isArray(c.connections)) setConns(c.connections);
        const map: Record<string, string> = {};
        for (const s of f.sessions || []) map[s.username] = s.endsAt;
        setFocusing(map);
        setLoaded(true);
      } catch {
        /* keep last good data */
      }
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (loaded && conns.length === 0) {
    return (
      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
        No students yet — invite people from the Invites tab and they&apos;ll show up here.
      </p>
    );
  }

  const sorted = [...conns].sort(
    (a, b) =>
      Number(!!focusing[b.username]) - Number(!!focusing[a.username]) ||
      Number(b.online) - Number(a.online) ||
      a.username.localeCompare(b.username),
  );

  return (
    <div className="space-y-1.5">
      {sorted.map((c) => {
        const isFocusing = !!focusing[c.username];
        return (
          <div
            key={c.id}
            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
            style={{ background: "var(--surface-2)", border: "1.5px solid var(--border)" }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <OnlineDot online={c.online} />
              <span className="truncate text-sm font-semibold">@{c.username}</span>
            </span>
            <span
              className="shrink-0 text-xs font-semibold"
              style={{ color: isFocusing ? "var(--accent-3)" : "var(--muted)" }}
            >
              {isFocusing ? "🎯 focusing" : c.streak > 0 ? `🔥${c.streak}d` : c.online ? "online" : "offline"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
