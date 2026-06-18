// Blaze mascot
export default function Mascot({ size = 160, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Blaze, the LWTS mascot"
    >
      <defs>
        <linearGradient id="flameBody" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="0.55" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="#ffe08a" />
        </linearGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="100" cy="182" rx="46" ry="9" fill="rgba(0,0,0,0.18)" />

      {/* flame body — gently animated */}
      <g style={{ transformOrigin: "100px 150px", animation: "flame 1.8s ease-in-out infinite" }}>
        <path
          d="M100 18
             C 132 56, 150 78, 150 116
             a 50 50 0 1 1 -100 0
             C 50 92, 64 86, 72 104
             C 78 70, 84 52, 100 18 Z"
          fill="url(#flameBody)"
          stroke="var(--ink)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* inner glow */}
        <path
          d="M100 78 C 118 96, 124 112, 116 132 a 22 22 0 1 1 -34 -2 C 80 112, 88 104, 100 78 Z"
          fill="#fff4c2"
          opacity="0.55"
        />

        {/* face */}
        <g style={{ transformOrigin: "100px 132px", animation: "blink 4s infinite" }}>
          <circle cx="86" cy="128" r="6.5" fill="var(--ink)" />
          <circle cx="114" cy="128" r="6.5" fill="var(--ink)" />
          <circle cx="88" cy="126" r="2" fill="#fff" />
          <circle cx="116" cy="126" r="2" fill="#fff" />
        </g>
        {/* cheeks */}
        <circle cx="76" cy="142" r="5" fill="var(--danger)" opacity="0.35" />
        <circle cx="124" cy="142" r="5" fill="var(--danger)" opacity="0.35" />
        {/* smile */}
        <path d="M88 142 Q 100 154 112 142" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
