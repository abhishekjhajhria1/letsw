"use client";

import { useEffect, useRef, useState } from "react";
import { checkInAction, startCoFocusAction, endFocusAction, completeFocusAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

type Season = { id: string; title: string };
type CoPartner = { id: string; username: string; online: boolean };

function fmt(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    /* audio not available */
  }
}

// short, daily, winnable — 30 min up to a 4-hour deep block
const PRESETS = [
  { label: "30 min", min: 30 },
  { label: "45 min", min: 45 },
  { label: "1 hr", min: 60 },
  { label: "1.5 hr", min: 90 },
  { label: "2 hr", min: 120 },
  { label: "3 hr", min: 180 },
  { label: "4 hr", min: 240 },
];
const MIN_MINUTES = 30;
const MAX_MINUTES = 240;

export default function FocusTimer({
  seasons,
  connections = [],
  initialStreak = 0,
}: {
  seasons: Season[];
  connections?: CoPartner[];
  initialStreak?: number;
}) {
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const [running, setRunning] = useState(false);

  // stopwatch
  const [swElapsed, setSwElapsed] = useState(0);

  // countdown — defaults to the smallest daily session
  const [total, setTotal] = useState(MIN_MINUTES * 60);
  const [remaining, setRemaining] = useState(MIN_MINUTES * 60);
  const [done, setDone] = useState(false);

  // daily session streak (advances when a timed session completes)
  const [streak, setStreak] = useState(initialStreak);
  const [showWellness, setShowWellness] = useState(false);

  // random matchmaking (co-focus with a crew / friend-of-friend who's online)
  const [matchPhase, setMatchPhase] = useState<"idle" | "confirm" | "searching" | "matched">("idle");
  const [matchPartner, setMatchPartner] = useState<string | null>(null);
  const [matchNote, setMatchNote] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef(0);

  // co-focus session (notifies a chosen connection you're focusing)
  const focusIdRef = useRef<string | null>(null);
  const [focusPartnerId, setFocusPartnerId] = useState("");

  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      if (mode === "stopwatch") {
        setSwElapsed((e) => e + 1);
      } else {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            setDone(true);
            beep();
            playSound("achievement");
            completeNow();
            return 0;
          }
          return r - 1;
        });
      }
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running, mode]);

  // stop polling matchmaking if the page unmounts mid-search
  useEffect(() => () => stopPolling(), []);

  const focusedSeconds = mode === "stopwatch" ? swElapsed : total - remaining;
  const display = mode === "stopwatch" ? swElapsed : remaining;
  const progress = mode === "timer" && total > 0 ? 1 - remaining / total : 0;

  async function startFocus() {
    if (focusIdRef.current) return;
    const mins = mode === "timer" ? Math.max(MIN_MINUTES, Math.round(remaining / 60)) : 30;
    focusIdRef.current = await startCoFocusAction(focusPartnerId || null, mins);
  }
  function stopFocus() {
    if (focusIdRef.current) {
      endFocusAction(focusIdRef.current);
      focusIdRef.current = null;
    }
  }
  // ran to completion: bank the session, advance the streak, prompt wellness
  async function completeNow() {
    const id = focusIdRef.current;
    focusIdRef.current = null;
    try {
      const res = await completeFocusAction(id ?? "");
      if (res) setStreak(res.streak);
    } catch {
      /* streak update is best-effort */
    }
    setShowWellness(true);
  }

  // ---- random matchmaking ----
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }
  function onMatched(d: { partner?: string | null; minutes: number; focusSessionId?: string | null }) {
    stopPolling();
    setTotal(d.minutes * 60);
    setRemaining(d.minutes * 60);
    setDone(false);
    setShowWellness(false);
    focusIdRef.current = d.focusSessionId ?? null; // session already created server-side
    setMatchPartner(d.partner ?? null);
    setMatchPhase("matched");
    playSound("achievement");
    setRunning(true); // begins the countdown; startFocus is skipped (id already set)
  }
  function startPolling() {
    stopPolling();
    pollDeadline.current = Date.now() + 95000;
    pollRef.current = setInterval(async () => {
      if (Date.now() > pollDeadline.current) {
        stopPolling();
        try { await fetch("/api/match", { method: "DELETE" }); } catch {}
        setMatchPhase("idle");
        setMatchNote("No one from your crew is free right now — try again, or start solo.");
        return;
      }
      try {
        const r = await fetch("/api/match");
        const d = await r.json();
        if (d.status === "matched") onMatched(d);
        else if (d.status === "none") {
          stopPolling();
          setMatchPhase("idle");
          setMatchNote("That match expired — give it another go.");
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  }
  async function joinMatch() {
    setMatchNote("");
    setMatchPhase("searching");
    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ minutes: Math.round(total / 60) }),
      });
      const d = await r.json();
      if (d.status === "matched") onMatched(d);
      else startPolling();
    } catch {
      setMatchPhase("idle");
      setMatchNote("Couldn't reach matchmaking — try again.");
    }
  }
  async function cancelMatch() {
    stopPolling();
    try { await fetch("/api/match", { method: "DELETE" }); } catch {}
    setMatchPhase("idle");
  }
  async function toggleRun() {
    const next = !running;
    setRunning(next);
    if (next) await startFocus();
  }

  function applyPreset(min: number) {
    setRunning(false);
    setDone(false);
    setShowWellness(false);
    setTotal(min * 60);
    setRemaining(min * 60);
  }
  function resetAll() {
    setRunning(false);
    setDone(false);
    setShowWellness(false);
    stopFocus();
    stopPolling();
    setMatchPhase("idle");
    setMatchPartner(null);
    if (mode === "stopwatch") setSwElapsed(0);
    else setRemaining(total);
  }

  return (
    <div className="space-y-6">
      {/* daily session streak */}
      <div className="flex items-center justify-between">
        <span className="chip" style={{ color: "var(--accent-2)", borderColor: "var(--accent-2)" }}>
          🔥 {streak}-day session streak
        </span>
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Finish a session daily to keep it
        </span>
      </div>

      {matchPhase === "matched" && matchPartner && (
        <div
          className="card-flat flex items-center gap-2 pop-in"
          style={{ borderColor: "var(--accent-3)" }}
        >
          <span className="text-lg">🎲</span>
          <p className="text-sm">
            Co-focusing with <span className="font-semibold">@{matchPartner}</span> — finish the
            session together. 💪
          </p>
        </div>
      )}

      {/* mode switch */}
      <div className="flex gap-2">
        {(["timer", "stopwatch"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setRunning(false);
              setDone(false);
            }}
            className="btn px-4 py-2 text-sm"
            style={
              mode === m
                ? { background: "var(--accent)", color: "white" }
                : { border: "1px solid var(--border)", color: "var(--foreground)" }
            }
          >
            {m === "timer" ? "Timer" : "Stopwatch"}
          </button>
        ))}
      </div>

      {/* dial */}
      <div className="card flex flex-col items-center py-10">
        {mode === "timer" && (
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.min)}
                className="chip"
                style={total === p.min * 60 ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
              >
                {p.label} · {p.min}m
              </button>
            ))}
          </div>
        )}

        <div
          className="my-6 font-mono text-7xl font-black tabular-nums"
          style={{ color: done ? "var(--accent-2)" : "var(--foreground)" }}
        >
          {fmt(display)}
        </div>

        {mode === "timer" && (
          <div className="mb-6 h-2 w-full max-w-sm overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
            />
          </div>
        )}

        {done && (
          <div className="mb-5 w-full max-w-sm space-y-2 text-center pop-in">
            <p className="font-semibold" style={{ color: "var(--accent-2)" }}>
              Session complete — streak now 🔥 {streak}. 🎉
            </p>
            {showWellness && (
              <div
                className="card-flat flex items-center justify-center gap-3 text-sm"
                style={{ borderColor: "var(--accent-3)" }}
              >
                <span>💧 Drink some water</span>
                <span style={{ color: "var(--muted)" }}>·</span>
                <span>🚶 Move a little</span>
              </div>
            )}
          </div>
        )}

        {mode === "timer" && (
          <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <span>Focus with:</span>
            <select
              value={focusPartnerId}
              onChange={(e) => setFocusPartnerId(e.target.value)}
              className="input w-auto py-1.5 text-sm"
              disabled={running}
            >
              <option value="">Solo</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  @{c.username}{c.online ? " · 🟢 online" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={toggleRun} className="btn btn-primary" disabled={mode === "timer" && remaining === 0}>
            {running ? "Pause" : focusedSeconds > 0 ? "Resume" : "Start"}
          </button>
          <button onClick={resetAll} className="btn btn-ghost">Reset</button>
        </div>

        {mode === "timer" && (
          <div className="mt-4 flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => { setMatchNote(""); setMatchPhase("confirm"); }}
              className="btn btn-ghost text-sm"
              disabled={running}
              title="Pair up with someone online from your crew"
            >
              🎲 Match me with someone online
            </button>
            {matchNote && (
              <p className="max-w-xs text-center text-xs" style={{ color: "var(--muted)" }}>{matchNote}</p>
            )}
          </div>
        )}

        {mode === "timer" && (
          <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <span>Custom:</span>
            <input
              type="number"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              step={5}
              className="input w-20 py-1.5 text-center"
              value={Math.round(total / 60)}
              onChange={(e) => applyPreset(Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, Number(e.target.value) || MIN_MINUTES)))}
            />
            <span>min (30–240)</span>
          </div>
        )}
      </div>

      {/* log as check-in */}
      {seasons.length > 0 ? (
        <form action={checkInAction} onSubmit={() => playSound("checkin")} className="card space-y-3">
          <h3 className="font-semibold">Log this session as today&apos;s check-in</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {fmt(focusedSeconds)} of focus so far — turn it into proof.
          </p>
          <input type="hidden" name="proof" value={`Focused ${fmt(focusedSeconds)} via timer`} />
          <div>
            <label className="label">Session</label>
            <select name="seasonId" className="input" required>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <input name="note" className="input" placeholder="What did you work on?" />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={focusedSeconds < 1}>
            Log {fmt(focusedSeconds)} as check-in ✓
          </button>
        </form>
      ) : (
        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          Start an active session to log your focus time as check-ins.
        </p>
      )}

      {/* random match popup — reminds you to set the time, then finds a partner */}
      {(matchPhase === "confirm" || matchPhase === "searching") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        >
          <div className="card w-full max-w-sm text-center pop-in">
            {matchPhase === "confirm" ? (
              <>
                <div className="text-4xl">🎲</div>
                <h3 className="mt-2 text-lg font-bold">Find a focus partner</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  We&apos;ll pair you with someone online from your crew or friends-of-friends for a{" "}
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                    {Math.round(total / 60)}-minute
                  </span>{" "}
                  session. Set your time first — if that&apos;s not right, change it above, then come back.
                </p>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => setMatchPhase("idle")} className="btn btn-ghost flex-1">
                    Change time
                  </button>
                  <button onClick={joinMatch} className="btn btn-primary flex-1">
                    Find a partner →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl animate-float">🔍</div>
                <h3 className="mt-2 text-lg font-bold">Looking for someone…</h3>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  Matching you for a {Math.round(total / 60)}-minute session with your crew &amp;
                  friends-of-friends who are online right now.
                </p>
                <button onClick={cancelMatch} className="btn btn-ghost mt-5 w-full">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
