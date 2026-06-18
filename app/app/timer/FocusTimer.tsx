"use client";

import { useEffect, useRef, useState } from "react";
import { checkInAction, startFocusAction, endFocusAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

type Season = { id: string; title: string };

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

const PRESETS = [
  { label: "Pomodoro", min: 25 },
  { label: "Short", min: 5 },
  { label: "Long", min: 15 },
  { label: "Deep", min: 50 },
];

export default function FocusTimer({ seasons }: { seasons: Season[] }) {
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const [running, setRunning] = useState(false);

  // stopwatch
  const [swElapsed, setSwElapsed] = useState(0);

  // countdown
  const [total, setTotal] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [done, setDone] = useState(false);

  // co-focus session (notifies a partner you're focusing)
  const focusIdRef = useRef<string | null>(null);
  const [focusSeasonId, setFocusSeasonId] = useState(seasons[0]?.id ?? "");

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
            stopFocus();
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

  const focusedSeconds = mode === "stopwatch" ? swElapsed : total - remaining;
  const display = mode === "stopwatch" ? swElapsed : remaining;
  const progress = mode === "timer" && total > 0 ? 1 - remaining / total : 0;

  async function startFocus() {
    if (focusIdRef.current) return;
    const mins = mode === "timer" ? Math.max(1, Math.round(remaining / 60)) : 30;
    focusIdRef.current = await startFocusAction(focusSeasonId || null, mins);
  }
  function stopFocus() {
    if (focusIdRef.current) {
      endFocusAction(focusIdRef.current);
      focusIdRef.current = null;
    }
  }
  async function toggleRun() {
    const next = !running;
    setRunning(next);
    if (next) await startFocus();
  }

  function applyPreset(min: number) {
    setRunning(false);
    setDone(false);
    setTotal(min * 60);
    setRemaining(min * 60);
  }
  function resetAll() {
    setRunning(false);
    setDone(false);
    stopFocus();
    if (mode === "stopwatch") setSwElapsed(0);
    else setRemaining(total);
  }

  return (
    <div className="space-y-6">
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

        {done && <p className="mb-4 font-semibold" style={{ color: "var(--accent-2)" }}>Session complete — nice work. 🎉</p>}

        {seasons.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <span>Co-focus:</span>
            <select
              value={focusSeasonId}
              onChange={(e) => setFocusSeasonId(e.target.value)}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="">solo</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
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
          <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <span>Custom:</span>
            <input
              type="number"
              min={1}
              max={240}
              className="input w-20 py-1.5 text-center"
              value={Math.round(total / 60)}
              onChange={(e) => applyPreset(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
            />
            <span>min</span>
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
            <label className="label">Season</label>
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
          Start an active season to log focus sessions as check-ins.
        </p>
      )}
    </div>
  );
}
