import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logoutAction } from "@/app/actions";
import Controls from "@/app/ui/Controls";
import NotificationBell from "@/app/ui/NotificationBell";
import BottomNav from "@/app/ui/BottomNav";
import SideRail from "@/app/ui/SideRail";
import StudentsDrawer from "@/app/ui/StudentsDrawer";
import Heartbeat from "@/app/ui/Heartbeat";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const unread = await prisma.notification.count({ where: { userId: me.id, read: false } });

  return (
    <div className="flex min-h-full flex-1 flex-col lg:pr-60">
      <header className="sticky top-0 z-10" style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)", backdropFilter: "blur(10px)", borderBottom: "1.5px solid var(--border)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link href="/app" className="text-xl font-black tracking-tight">
            <span className="shimmer-text">LWTS</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {/* tablet: inline links. phone: BottomNav. desktop: right SideRail. */}
            <div className="hidden items-center gap-1 md:flex lg:hidden">
              <NavLink href="/app">Dashboard</NavLink>
              <NavLink href="/app/partners">Partners</NavLink>
              <NavLink href="/app/timer">Focus</NavLink>
              <NavLink href="/app/crew">Crew</NavLink>
              <NavLink href="/app/invite">Invites</NavLink>
            </div>
            <Link href="/app/settings" className="mx-1 hidden rounded-lg px-2 py-2 font-medium transition hover:bg-surface-2 sm:inline" style={{ color: "var(--muted)" }}>
              @{me.username}
            </Link>
            <NotificationBell initial={unread} />
            <Controls />
            <form action={logoutAction}>
              <button className="btn btn-ghost px-2 py-2 text-sm sm:px-3">Log out</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-6 lg:pb-8">{children}</main>
      <SideRail />
      <StudentsDrawer />
      <BottomNav />
      <Heartbeat />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 font-medium transition hover:bg-surface-2">
      {children}
    </Link>
  );
}
