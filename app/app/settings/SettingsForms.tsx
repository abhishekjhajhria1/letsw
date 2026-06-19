"use client";

import { useActionState } from "react";
import { changePasswordAction, deleteAccountAction } from "@/app/actions";

export function ChangePassword() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div>
        <label className="label" htmlFor="next">New password</label>
        <input id="next" name="next" type="password" className="input" autoComplete="new-password" required />
      </div>
      {state?.error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,92,124,0.12)", color: "var(--danger)" }}>{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(0,224,184,0.12)", color: "var(--accent-2)" }}>{state.ok}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

export function DeleteAccount({ username }: { username: string }) {
  return (
    <form action={deleteAccountAction} className="space-y-3">
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        This permanently deletes your account, sessions, and check-ins. People you
        invited stay, but leave your tree. Type <span className="pill-mono">{username}</span> to confirm.
      </p>
      <input name="confirm" className="input" placeholder={username} autoComplete="off" required />
      <button
        type="submit"
        className="btn"
        style={{ background: "var(--danger)", color: "white" }}
      >
        Delete my account
      </button>
    </form>
  );
}
