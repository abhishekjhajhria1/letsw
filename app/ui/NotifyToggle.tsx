"use client";

import { useEffect, useState } from "react";
import { savePushSubscriptionAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Status = "loading" | "unsupported" | "blocked" | "off" | "on";

export default function NotifyToggle({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("blocked");
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(key),
      });
      await savePushSubscriptionAction(JSON.parse(JSON.stringify(sub)));
      playSound("success");
      setStatus("on");
    } catch {
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "unsupported") return null;
  if (status === "on") {
    return compact ? null : (
      <span className="chip" style={{ color: "var(--accent-2)" }}>🔔 Notifications on</span>
    );
  }
  if (status === "blocked") {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Notifications are blocked in your browser settings — enable them there to get partner alerts.
      </p>
    );
  }

  // off
  if (compact) {
    return (
      <div className="card card-hover flex items-center justify-between gap-3" style={{ borderColor: "var(--accent)" }}>
        <div>
          <p className="font-bold">Turn on notifications 🔔</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Get pinged when your partner checks in, verifies you, or nudges you.
          </p>
        </div>
        <button onClick={enable} disabled={busy} className="btn btn-primary whitespace-nowrap">
          {busy ? "…" : "Enable"}
        </button>
      </div>
    );
  }
  return (
    <button onClick={enable} disabled={busy} className="btn btn-primary">
      {busy ? "Enabling…" : "🔔 Enable notifications"}
    </button>
  );
}
