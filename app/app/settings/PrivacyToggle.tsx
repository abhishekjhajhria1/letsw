"use client";

import { useState, useTransition } from "react";
import { setStatsPublicAction } from "@/app/actions";

export default function PrivacyToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    start(() => setStatsPublicAction(next));
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">Show my activity</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {on
            ? "Your crew & friends-of-friends can see your streaks and stats."
            : "You're private — your stats are hidden and you're off the public leaderboard."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Show my activity to others"
        onClick={toggle}
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{
          background: on ? "var(--accent)" : "var(--surface-2)",
          border: "1.5px solid var(--border)",
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
          style={{ left: on ? "1.5rem" : "0.125rem", background: "#fff", border: "1.5px solid var(--border)" }}
        />
      </button>
    </div>
  );
}
