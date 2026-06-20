"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createPartnershipAction } from "@/app/actions";
import { playSound } from "@/lib/sound";
import type { Connection } from "@/lib/connections";
import OnlineDot from "@/app/ui/OnlineDot";

// a pool of session-name ideas to spark something; not tied to the field choice
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

// length presets — short sprints first so a quick, winnable session is the easy pick
const LENGTHS = [
  { days: 3, label: "3-day sprint" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 21, label: "21 days" },
  { days: 30, label: "30 days" },
  { days: 60, label: "60 days" },
  { days: 90, label: "90 days" },
];

const RELATION_LABEL: Record<Connection["relation"], string> = {
  crew: "your crew",
  inviter: "invited you",
  partner: "past partner",
};

function pickThree(exclude?: string) {
  const pool = NAME_POOL.filter((n) => n !== exclude);
  const out: string[] = [];
  while (out.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export default function NewSeasonForm({ connections }: { connections: Connection[] }) {
  const [state, action, pending] = useActionState(createPartnershipAction, undefined);
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [days, setDays] = useState(7);
  const [custom, setCustom] = useState(false);
  const [manual, setManual] = useState(false);
  const [people, setPeople] = useState<Connection[]>(connections);
  // seed deterministically so server and client render the same first set
  const [suggestions, setSuggestions] = useState<string[]>(() => NAME_POOL.slice(0, 3));
  const reshuffle = useMemo(() => () => setSuggestions(pickThree(title)), [title]);

  // keep online dots fresh while the form is open
  useEffect(() => {
    let alive = true;
    const tick = () =>
      fetch("/api/connections")
        .then((r) => r.json())
        .then((d) => alive && Array.isArray(d.connections) && setPeople(d.connections))
        .catch(() => {});
    const id = setInterval(tick, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const hasConnections = people.length > 0;

  return (
    <form action={action} onSubmit={() => playSound("success")} className="space-y-4">
      {/* Pick a partner from people you're already connected to */}
      <div>
        <label className="label">Partner</label>
        {hasConnections && !manual && (
          <>
            <div className="mt-1 max-h-64 space-y-2 overflow-y-auto pr-1">
              {people.map((c) => {
                const selected = c.username === partner;
                const blocked = c.hasActive || c.pending;
                return (
                  <button
                    type="button"
                    key={c.id}
                    disabled={blocked}
                    onClick={() => {
                      setPartner(c.username);
                      playSound("pop");
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition"
                    style={{
                      borderColor: selected ? "var(--accent)" : "var(--border)",
                      background: selected ? "rgba(124,92,255,0.10)" : "var(--surface-2)",
                      opacity: blocked ? 0.55 : 1,
                      cursor: blocked ? "not-allowed" : "pointer",
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <OnlineDot online={c.online} />
                      <span>
                        <span className="font-semibold">@{c.username}</span>
                        <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>
                          {RELATION_LABEL[c.relation]}
                          {c.streak > 0 && ` · 🔥 ${c.streak}d`}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {c.hasActive ? "in a session" : c.pending ? "requested" : selected ? "✓ selected" : "select"}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setManual(true)}
              className="mt-2 text-xs font-semibold transition hover:opacity-80"
              style={{ color: "var(--accent-2)" }}
            >
              or enter a username manually
            </button>
          </>
        )}

        {(!hasConnections || manual) && (
          <>
            <input
              name="partner"
              className="input"
              placeholder="who's holding you accountable"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              required
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
              {hasConnections ? (
                <button
                  type="button"
                  onClick={() => setManual(false)}
                  className="font-semibold transition hover:opacity-80"
                  style={{ color: "var(--accent-2)" }}
                >
                  ← back to your connections
                </button>
              ) : (
                "No connections yet — invite people from the Invites tab and they'll show up here."
              )}
            </p>
          </>
        )}
        {/* selected partner travels with the form even when the picker is shown */}
        {hasConnections && !manual && <input type="hidden" name="partner" value={partner} />}
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

      {/* Length — short, winnable sessions are the default path */}
      <div>
        <label className="label">How long?</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {LENGTHS.map((l) => {
            const selected = !custom && days === l.days;
            return (
              <button
                key={l.days}
                type="button"
                onClick={() => {
                  setDays(l.days);
                  setCustom(false);
                  playSound("pop");
                }}
                className="chip transition"
                style={{
                  cursor: "pointer",
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  background: selected ? "rgba(124,92,255,0.10)" : "transparent",
                }}
              >
                {l.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCustom(true)}
            className="chip transition"
            style={{
              cursor: "pointer",
              borderColor: custom ? "var(--accent)" : "var(--border)",
              background: custom ? "rgba(124,92,255,0.10)" : "transparent",
            }}
          >
            Custom
          </button>
        </div>
        {custom && (
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
            className="input mt-2"
            placeholder="days"
          />
        )}
        <input type="hidden" name="lengthDays" value={days} />
        <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
          {days <= 7
            ? "Short and winnable — great for a first session together."
            : days >= 60
              ? "A real commitment. Make sure you both want this one."
              : `A ${days}-day session. You can always run it back after.`}
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,92,124,0.12)", color: "var(--danger)" }}>
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending || !partner.trim()}>
        {pending ? "Sending…" : partner ? `Send request to @${partner} →` : "Pick a partner first"}
      </button>
    </form>
  );
}
