"use client";

import { useState } from "react";
import { playSound } from "@/lib/sound";

export default function CopyCode({ code, used }: { code: string; used: boolean }) {
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined" ? `${window.location.origin}/register?code=${code}` : "";

  async function copy() {
    await navigator.clipboard.writeText(link || code);
    playSound("pop");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    const data = {
      title: "Join me on LWTS",
      text: `Here's your invite to LWTS — code ${code}. Let's keep each other accountable.`,
      url: link,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    copy();
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className="pill-mono"
        style={used ? { opacity: 0.4, textDecoration: "line-through" } : undefined}
      >
        {code}
      </span>
      {used ? (
        <span className="text-xs" style={{ color: "var(--muted)" }}>used</span>
      ) : (
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost px-3 py-1.5 text-xs" onClick={copy}>
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button type="button" className="btn btn-primary px-3 py-1.5 text-xs" onClick={share}>
            Share
          </button>
        </div>
      )}
    </div>
  );
}
