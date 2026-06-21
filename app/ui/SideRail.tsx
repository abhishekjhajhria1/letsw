"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StudentsList from "./StudentsList";

const NAV = [
  { href: "/app", label: "Home", icon: "🏠", exact: true },
  { href: "/app/partners", label: "Partners", icon: "🤝" },
  { href: "/app/timer", label: "Focus", icon: "⏱️" },
  { href: "/app/crew", label: "Crew", icon: "🌳" },
  { href: "/app/invite", label: "Invites", icon: "🎟️" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

// Desktop (lg+) right-edge navigation rail. Below lg, BottomNav + StudentsDrawer
// take over. The rail doubles as the "check on other students" presence panel.
export default function SideRail() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-20 hidden h-full w-60 flex-col lg:flex"
      style={{
        background: "var(--surface)",
        borderRight: "1.5px solid var(--border)",
      }}
    >
      <nav className="flex flex-col gap-1 p-3 pt-5">
        {NAV.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition hover:bg-surface-2"
              style={
                active
                  ? { background: "var(--accent)", color: "#fff", border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--foreground)" }
              }
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 my-1" style={{ borderTop: "1.5px solid var(--border)" }} />

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          👥 Students online
        </h3>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <StudentsList />
        </div>
      </div>
    </aside>
  );
}
