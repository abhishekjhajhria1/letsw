"use client";

import { useActionState } from "react";
import { createPartnershipAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function NewSeasonForm() {
  const [state, action, pending] = useActionState(createPartnershipAction, undefined);

  return (
    <form action={action} onSubmit={() => playSound("success")} className="space-y-4">
      <div>
        <label className="label" htmlFor="partner">Partner&apos;s username</label>
        <input id="partner" name="partner" className="input" placeholder="who's holding you accountable" required />
      </div>
      <div>
        <label className="label" htmlFor="title">Season name</label>
        <input id="title" name="title" className="input" placeholder="e.g. Summer Lock-In" required />
      </div>
      <div>
        <label className="label" htmlFor="goal">Your goal</label>
        <input id="goal" name="goal" className="input" placeholder="what you'll do every day" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="category">Field</label>
          <select id="category" name="category" className="input">
            <option value="fitness">Fitness</option>
            <option value="study">Study</option>
            <option value="work">Work / Career</option>
            <option value="creative">Creative</option>
            <option value="habit">Habit / Health</option>
            <option value="general">General</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="lengthDays">Length (days)</label>
          <input id="lengthDays" name="lengthDays" type="number" min={1} max={365} defaultValue={30} className="input" />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,92,124,0.12)", color: "var(--danger)" }}>
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Send partner request →"}
      </button>
    </form>
  );
}
