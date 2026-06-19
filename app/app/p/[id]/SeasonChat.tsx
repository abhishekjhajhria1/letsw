"use client";

import { useEffect, useRef, useState } from "react";
import { playSound } from "@/lib/sound";

type Msg = { id: string; senderId: string; senderName: string; body: string; createdAt: string };

const MAX_LEN = 280;

function clockOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// A lightweight, ephemeral back-and-forth between the two partners. Messages are
// not kept as history — they're auto-pruned server-side — so this is just for a
// quick "you around?" during a session.
export default function SeasonChat({
  seasonId,
  meId,
  partnerName,
}: {
  seasonId: string;
  meId: string;
  partnerName: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  const lastTs = useRef<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const scroller = useRef<HTMLDivElement | null>(null);
  const initial = useRef(true);

  function merge(incoming: Msg[], { silent }: { silent?: boolean } = {}) {
    const fresh = incoming.filter((m) => !seen.current.has(m.id));
    if (fresh.length === 0) return;
    fresh.forEach((m) => seen.current.add(m.id));
    const newest = fresh[fresh.length - 1].createdAt;
    if (!lastTs.current || newest > lastTs.current) lastTs.current = newest;
    setMessages((prev) => [...prev, ...fresh].slice(-100));
    // chime only for a partner's message that arrived live (not on first load)
    if (!silent && !initial.current && fresh.some((m) => m.senderId !== meId)) {
      playSound("pop");
    }
  }

  // poll for new lines
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const q = lastTs.current ? `?after=${encodeURIComponent(lastTs.current)}` : "";
        const r = await fetch(`/api/seasons/${seasonId}/messages${q}`);
        if (!r.ok) return;
        const d = (await r.json()) as { messages: Msg[] };
        if (alive) {
          merge(d.messages || []);
          initial.current = false;
        }
      } catch {
        /* offline — try again next tick */
      }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId]);

  // keep pinned to the newest line
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      const r = await fetch(`/api/seasons/${seasonId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (r.ok) {
        const d = (await r.json()) as { message: Msg };
        if (d.message) merge([d.message], { silent: true });
      } else {
        setText(body); // restore so the line isn't lost
      }
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }

  const partnerUnseen = !open && messages.length > 0;

  return (
    <section className="card" style={{ borderColor: "var(--accent-3)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 font-bold">
          💬 Quick chat
          {partnerUnseen && (
            <span className="chip" style={{ color: "var(--accent-3)", borderColor: "var(--accent-3)" }}>
              {messages.length}
            </span>
          )}
        </span>
        <span className="text-sm" style={{ color: "var(--muted)" }}>{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div
            ref={scroller}
            className="max-h-72 space-y-2 overflow-y-auto rounded-xl p-3"
            style={{ background: "var(--surface-2)" }}
          >
            {messages.length === 0 ? (
              <p className="py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
                No messages yet. Say hi to @{partnerName} 👋
                <br />
                <span className="text-xs">These disappear — they&apos;re just for right now.</span>
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === meId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                      style={{
                        background: mine ? "var(--accent)" : "var(--surface)",
                        color: mine ? "#fff" : "var(--foreground)",
                        border: "1.5px solid var(--border)",
                      }}
                    >
                      <p className="break-words">{m.body}</p>
                      <p
                        className="mt-0.5 text-[10px]"
                        style={{ color: mine ? "rgba(255,255,255,0.7)" : "var(--muted)" }}
                      >
                        {clockOf(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type a quick message…"
              className="input flex-1 resize-none py-2.5"
              style={{ minHeight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !text.trim()}
              className="btn btn-primary px-4 py-2.5"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
