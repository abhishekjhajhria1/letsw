"use client";

import { useEffect } from "react";

// Pings presence while the app is open so connections see an accurate online dot.
export default function Heartbeat() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/presence", { method: "POST" }).catch(() => {});
      }
    };
    ping();
    const id = setInterval(ping, 60000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);
  return null;
}
