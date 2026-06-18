import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import Controls from "@/app/ui/Controls";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10" style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)", backdropFilter: "blur(10px)", borderBottom: "1.5px solid var(--border)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-6 py-3">
          <Link href="/app" className="text-xl font-black tracking-tight">
            <span className="shimmer-text">LWTS</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/app">Dashboard</NavLink>
            <NavLink href="/app/partners">Partners</NavLink>
            <NavLink href="/app/timer">Focus</NavLink>
            <NavLink href="/app/crew">Crew</NavLink>
            <NavLink href="/app/invite">Invites</NavLink>
            <Link href="/app/settings" className="mx-1 hidden rounded-lg px-2 py-2 font-medium transition hover:bg-[var(--surface-2)] sm:inline" style={{ color: "var(--muted)" }}>
              @{me.username}
            </Link>
            <Controls />
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-2 text-sm">Log out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 font-medium transition hover:bg-[var(--surface-2)]">
      {children}
    </Link>
  );
}
