import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCodeAction } from "@/app/actions";
import CopyCode from "./CopyCode";
import SoundButton from "@/app/ui/SoundButton";

const MAX_CODES = 10;

export default async function InvitePage() {
  const me = await requireUser();

  const [codes, inviteeCount] = await Promise.all([
    prisma.inviteCode.findMany({ where: { ownerId: me.id }, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where: { invitedById: me.id } }),
  ]);

  const available = codes.filter((c) => c.uses < c.maxUses).length;
  const atCap = codes.length >= MAX_CODES;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Bring your people in</h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
        Lockstep grows by invitation only. Each code lets one person in — and they
        join your tree.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat value={available} label="codes ready" />
        <Stat value={inviteeCount} label="you've invited" />
        <Stat value={codes.length} label={`of ${MAX_CODES} total`} />
      </div>

      <form action={generateCodeAction} className="mt-5">
        <SoundButton sound="pop" className="btn btn-primary w-full" disabled={atCap}>
          {atCap ? "You've reached your code limit" : "Generate a new invite code"}
        </SoundButton>
      </form>

      <div className="card mt-5 space-y-3">
        {codes.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No codes yet — generate one above and share it.
          </p>
        )}
        {codes.map((c) => (
          <CopyCode key={c.id} code={c.code} used={c.uses >= c.maxUses} />
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card py-4 text-center">
      <div className="text-2xl font-black" style={{ color: "var(--accent-2)" }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
