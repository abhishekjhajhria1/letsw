import Link from "next/link";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md pop-in">
        <Link href="/" className="mb-8 block text-center text-2xl font-black tracking-tight">
          <span className="shimmer-text">LWTS</span>
        </Link>
        <div className="card">
          <h1 className="text-2xl font-bold">Claim your spot</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
            {code ? (
              <>You&apos;ve got an invite — code&apos;s filled in. Finish signing up.</>
            ) : (
              <>
                Invite-only. Try code <span className="pill-mono">11xwillwin</span> if a
                member hasn&apos;t given you one yet.
              </>
            )}
          </p>

          <RegisterForm initialCode={code ?? ""} />
        </div>
        <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
          Already in?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
