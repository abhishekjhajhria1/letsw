"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationBell({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => alive && setCount(d.count || 0))
        .catch(() => {});
    const id = setInterval(tick, 30000);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <Link
      href="/app/inbox"
      aria-label="Notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90"
      style={{ border: "1.5px solid var(--border)", background: "var(--surface)" }}
    >
      <span className="text-base">🔔</span>
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ background: "var(--danger)", color: "#fff", border: "1.5px solid var(--background)" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
