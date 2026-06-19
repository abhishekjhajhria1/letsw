import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPublicStats } from "@/lib/stats";
import Controls from "./ui/Controls";
import Mascot from "./ui/Mascot";

export default async function Home() {
  const me = await getCurrentUser();
  if (me) redirect("/app");

  const { members, activeSeasons, checkIns } = await getPublicStats();

  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-2xl font-black tracking-tight">
          <span className="shimmer-text">LWTS</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Controls />
          <Link href="/login" className="btn btn-ghost px-4 py-2 text-sm">
            Log in
          </Link>
          <Link href="/register" className="btn btn-primary px-4 py-2 text-sm">
            I have an invite
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20 text-center">
        <div className="pop-in flex justify-center">
          <Mascot size={150} className="animate-float animate-wiggle" />
        </div>
        <span className="chip mx-auto mt-2 slide-up">🔒 Invite-only · members bring members</span>
        <h1 className="slide-up mx-auto mt-6 max-w-4xl text-5xl font-black leading-[1.03] sm:text-7xl" style={{ animationDelay: "0.05s" }}>
          You don&apos;t quit
          <br />
          on your <span className="shimmer-text">partner.</span>
        </h1>
        <p className="slide-up mx-auto mt-6 max-w-2xl text-lg" style={{ color: "var(--muted)", animationDelay: "0.1s" }}>
          LWTS pairs you with one person for a session. You each set a goal — any
          field, any pace — and check in daily. They verify yours, you verify
          theirs. Streaks build. Excuses don&apos;t.
        </p>

        <div className="slide-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.15s" }}>
          <Link href="/register" className="btn btn-primary w-full sm:w-auto">
            Claim your spot →
          </Link>
          <Link href="/login" className="btn btn-ghost w-full sm:w-auto">
            I&apos;m already in
          </Link>
        </div>
        <p className="slide-up mt-4 text-sm" style={{ color: "var(--muted)", animationDelay: "0.2s" }}>
          Free while we&apos;re in early access. All you need is an email and an invite code.
        </p>

        {/* Live stats — social proof */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
          {[
            { value: members, label: "members in" },
            { value: activeSeasons, label: "active sessions" },
            { value: checkIns, label: "check-ins logged" },
          ].map((s, i) => (
            <div key={s.label} className="pop-in" style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
              <Stat value={s.value} label={s.label} />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-10 text-center text-3xl font-bold">How a session works</h2>
        <div className="grid gap-5 md:grid-cols-4">
          <Step n="1" title="Get invited" body="A member hands you a code. You pick a username — no real names required." />
          <Step n="2" title="Pair up" body="Invite one partner. You each declare a goal and a session length." />
          <Step n="3" title="Check in daily" body="Log proof. Your partner confirms it. Miss a day and they'll know." />
          <Step n="4" title="Keep the streak" body="Watch the streak climb. End the session, run a recap, go again." />
        </div>
      </section>

      {/* Why it sticks */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature emoji="🤝" title="Accountability that's real" body="A check-in isn't done until your partner verifies it. Someone is actually watching — in the good way." />
          <Feature emoji="🛡️" title="Safe by design" body="Username-only identity, no contact info exchanged, in-app only, with report & block built in." />
          <Feature emoji="🌳" title="Built to spread" body="Every member gets invite codes to bring the people they want in their corner. Your crew, your tree." />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
        <div className="card card-hover">
          <div className="mb-2 text-4xl animate-float">🔥</div>
          <h2 className="text-3xl font-bold">Got a code burning a hole in your pocket?</h2>
          <p className="mx-auto mt-3 max-w-md" style={{ color: "var(--muted)" }}>
            Early-access spots are handed out by members, one at a time. Use yours
            before someone else uses theirs.
          </p>
          <Link href="/register" className="btn btn-primary mt-6">
            Redeem my invite →
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-sm" style={{ color: "var(--muted)", borderTop: "1.5px solid var(--border)" }}>
        <p>LWTS · lwts.site · built for people who refuse to do it alone.</p>
        <a
          href="https://x.com/hmm11x"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 font-semibold transition hover:opacity-80"
          style={{ color: "var(--foreground)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
          </svg>
          @hmm11x
        </a>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card card-hover py-5">
      <div className="text-3xl font-black" style={{ color: "var(--accent-2)" }}>
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card card-hover">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-lg font-black"
        style={{ background: "var(--accent)", color: "#fff", border: "1.5px solid var(--ink)" }}
      >
        {n}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
        {body}
      </p>
    </div>
  );
}

function Feature({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="card card-hover">
      <div className="mb-2 text-3xl">{emoji}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
        {body}
      </p>
    </div>
  );
}
