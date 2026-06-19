"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "Home", icon: "🏠", exact: true },
  { href: "/app/partners", label: "Partners", icon: "🤝" },
  { href: "/app/timer", label: "Focus", icon: "⏱️" },
  { href: "/app/crew", label: "Crew", icon: "🌳" },
  { href: "/app/invite", label: "Invites", icon: "🎟️" },
];

// Mobile-only bottom tab bar. The header's inline links are hidden under md,
// so this is the primary nav on phones.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 md:hidden"
      style={{
        background: "color-mix(in oklab, var(--background) 92%, transparent)",
        backdropFilter: "blur(10px)",
        borderTop: "1.5px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition"
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
