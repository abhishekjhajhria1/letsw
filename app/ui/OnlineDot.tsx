// Presentational presence dot. Green + glow when online, muted otherwise.
// Pure markup — safe to render from server components.
export default function OnlineDot({ online, size = 9 }: { online: boolean; size?: number }) {
  return (
    <span
      title={online ? "online now" : "offline"}
      aria-label={online ? "online" : "offline"}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 999,
        background: online ? "var(--accent-3, #22c55e)" : "var(--border)",
        boxShadow: online ? "0 0 0 3px rgba(34,197,94,0.18)" : "none",
        flexShrink: 0,
      }}
    />
  );
}
