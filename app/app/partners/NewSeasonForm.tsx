"use client";

import { useActionState, useMemo, useState } from "react";
import { createPartnershipAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

// a pool of season-name ideas to spark something; not tied to the field choice
const NAME_POOL = [
  "Summer Lock-In",
  "No Zero Days",
  "The Comeback",
  "Operation Discipline",
  "30 Days of Showing Up",
  "Grind Mode",
  "Built Different",
  "Early Risers",
  "The Streak",
  "Locked & Focused",
  "Last Dance",
  "Prove It",
  "Eyes on the Prize",
  "Quiet Consistency",
  "Beast Mode",
  "The Long Game",
  "Better Every Day",
  "Run It Back",
];

function pickThree(exclude?: string) {
  const pool = NAME_POOL.filter((n) => n !== exclude);
  const out: string[] = [];
  while (out.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export default function NewSeasonForm() {
  const [state, action, pending] = useActionState(createPartnershipAction, undefined);
  const [title, setTitle] = useState("");
  // seed deterministically so server and client render the same first set
  const [suggestions, setSuggestions] = useState<string[]>(() => NAME_POOL.slice(0, 3));
  const reshuffle = useMemo(() => () => setSuggestions(pickThree(title)), [title]);

  return (
    <form action={action} onSubmit={() => playSound("success")} className="space-y-4">
      <div>
        <label className="label" htmlFor="partner">Partner&apos;s username</label>
        <input id="partner" name="partner" className="input" placeholder="who's holding you accountable" required />
      </div>
      <div>
        <label className="label" htmlFor="title">Session name</label>
        <input
          id="title"
          name="title"
          className="input"
          placeholder="e.g. Summer Lock-In"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Ideas:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTitle(s);
                playSound("pop");
              }}
              className="chip transition hover:border-[var(--accent)]"
              style={{ cursor: "pointer" }}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={reshuffle}
            className="chip transition hover:border-[var(--accent)]"
            style={{ cursor: "pointer" }}
            aria-label="Shuffle suggestions"
          >
            🎲 more
          </button>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="goal">Your goal</label>
        <input id="goal" name="goal" className="input" placeholder="what you'll do every day" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
