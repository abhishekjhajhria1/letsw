import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConnections } from "@/lib/connections";
import NewSeasonForm from "./NewSeasonForm";

export default async function PartnersPage() {
  const me = await requireUser();

  const [sent, connections] = await Promise.all([
    prisma.partnerSeason.findMany({
      where: { inviterId: me.id, status: { in: ["pending", "declined"] } },
      include: { invitee: true },
      orderBy: { createdAt: "desc" },
    }),
    getConnections(me.id, me.invitedById),
  ]);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold">Start a session</h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Pick someone already on LWTS. Don&apos;t know anyone yet? Send them
          an invite code from the Invites tab first.
        </p>
        <div className="card mt-5">
          <NewSeasonForm connections={connections} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Requests you&apos;ve sent</h2>
        <div className="mt-5 space-y-3">
          {sent.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nothing sent yet.
            </p>
          )}
          {sent.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between">
                <span className="font-semibold">@{s.invitee.username}</span>
                <span
                  className="chip"
                  style={{ color: s.status === "declined" ? "var(--danger)" : "var(--muted)" }}
                >
                  {s.status === "declined" ? "declined" : "waiting"}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                “{s.title}” · {s.lengthDays} days
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
