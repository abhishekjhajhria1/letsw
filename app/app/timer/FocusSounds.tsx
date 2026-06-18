"use client";

import { useEffect, useState } from "react";
import { playNoise, stopNoise, setNoiseVolume, type NoiseType } from "@/lib/noise";

const OPTIONS: { type: NoiseType; label: string; emoji: string }[] = [
  { type: "white", label: "White", emoji: "🌫️" },
  { type: "brown", label: "Brown", emoji: "🟤" },
  { type: "rain", label: "Rain", emoji: "🌧️" },
];

export default function FocusSounds() {
  const [active, setActive] = useState<NoiseType | null>(null);
  const [vol, setVol] = useState(0.4);

  useEffect(() => () => stopNoise(), []);

  function choose(type: NoiseType) {
    if (active === type) {
      stopNoise();
      setActive(null);
    } else {
      playNoise(type, vol);
      setActive(type);
    }
  }

  return (
    <div className="card">
      <h3 className="font-bold">Focus sounds</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Mask distractions with steady ambient noise.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.type}
            onClick={() => choose(o.type)}
            className="btn px-4 py-2 text-sm"
            style={
              active === o.type
                ? { background: "var(--accent)", color: "#fff", border: "1.5px solid var(--ink)" }
                : { border: "1.5px solid var(--border)", color: "var(--foreground)" }
            }
          >
            {o.emoji} {o.label}
          </button>
        ))}
        {active && (
          <button onClick={() => { stopNoise(); setActive(null); }} className="btn btn-ghost px-4 py-2 text-sm">
            Stop
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
        <span>Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={vol}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVol(v);
            setNoiseVolume(v);
          }}
          className="flex-1"
        />
      </div>
    </div>
  );
}
