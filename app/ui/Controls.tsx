"use client";

import { useEffect, useState } from "react";
import { playSound, isMuted, setMuted } from "@/lib/sound";

export default function Controls() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [muted, setMutedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "light" | "dark") || "dark";
    setTheme(current);
    setMutedState(isMuted());
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("lwts_theme", next);
    } catch {}
    playSound("toggle");
  }

  function toggleSound() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) playSound("pop"); // confirm un-mute audibly
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Toggle sound"
        onClick={toggleSound}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-90"
        style={{ border: "1.5px solid var(--border)", background: "var(--surface)" }}
      >
        <span className="text-base">{mounted ? (muted ? "🔇" : "🔊") : "🔊"}</span>
      </button>

      <button
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-transform active:scale-90"
        style={{ border: "1.5px solid var(--border)", background: "var(--surface)" }}
      >
        {mounted && (
          <span key={theme} className="spin-in text-base">
            {theme === "dark" ? "🌙" : "☀️"}
          </span>
        )}
      </button>
    </div>
  );
}
