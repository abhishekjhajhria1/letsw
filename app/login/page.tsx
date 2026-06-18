"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md pop-in">
        <Link href="/" className="mb-8 block text-center text-2xl font-black tracking-tight">
          <span className="shimmer-text">LWTS</span>
        </Link>
        <div className="card">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
            Your partner&apos;s waiting on today&apos;s check-in.
          </p>

          <form action={action} onSubmit={() => playSound("success")} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" placeholder="you@email.com" autoComplete="email" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
            </div>

            {state?.error && (
              <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,92,124,0.12)", color: "var(--danger)" }}>
                {state.error}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={pending}>
              {pending ? "Logging in…" : "Log in →"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
          Got an invite? <Link href="/register" className="font-semibold" style={{ color: "var(--accent)" }}>Create an account</Link>
        </p>
      </div>
    </main>
  );
}
