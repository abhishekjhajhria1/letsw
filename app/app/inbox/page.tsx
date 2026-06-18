import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MarkRead from "./MarkRead";

function ago(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const ICON: Record<string, string> = {
  checkin: "✅",
  verified: "🎉",
  invited: "🤝",
  accepted: "🚀",
  nudge: "👀",
  focus: "🎯",
  reminder: "⏰",
  intention: "📌",
};

export default async function InboxPage() {
  const me = await requireUser();
  const items = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <MarkRead />
      <h1 className="text-3xl font-bold">Notifications</h1>

      {items.length === 0 ? (
        <div className="card text-center">
          <p className="text-lg font-semibold">Nothing yet.</p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            When your partner checks in, verifies you, or nudges you, it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.url}
              className="card card-hover flex items-start gap-3 pop-in"
              style={!n.read ? { borderColor: "var(--accent)" } : undefined}
            >
              <span className="text-xl">{ICON[n.type] ?? "🔔"}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 truncate text-sm" style={{ color: "var(--muted)" }}>
                    {n.body}
                  </p>
                )}
              </div>
              <span className="whitespace-nowrap text-xs" style={{ color: "var(--muted)" }}>
                {ago(n.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
