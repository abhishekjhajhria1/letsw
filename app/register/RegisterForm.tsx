"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function RegisterForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} onSubmit={() => playSound("success")} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="code">Invite code</label>
        <input id="code" name="code" defaultValue={initialCode} className="input font-mono tracking-widest" placeholder="11xwillwin" required />
      </div>
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" name="username" className="input" placeholder="how the world sees you" autoComplete="username" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="you@email.com" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" placeholder="at least 8 characters" autoComplete="new-password" required />
      </div>

      {state?.error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,92,124,0.12)", color: "var(--danger)" }}>
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Creating…" : "Create my account →"}
      </button>
    </form>
  );
}
