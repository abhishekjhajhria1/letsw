"use client";

import { useEffect, useState } from "react";
import { saveReminderAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function ReminderSettings({
  enabled,
  time,
}: {
  enabled: boolean;
  time: string;
}) {
  const [tz, setTz] = useState("UTC");

  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {}
  }, []);

  return (
    <form action={saveReminderAction} onSubmit={() => playSound("pop")} className="space-y-4">
      <input type="hidden" name="tz" value={tz} />
      <label className="flex items-center gap-3">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="h-4 w-4" />
        <span className="font-medium">Send me a daily reminder</span>
      </label>
      <div>
        <label className="label" htmlFor="time">Time ({tz})</label>
        <input id="time" name="time" type="time" defaultValue={time || "19:00"} className="input" />
      </div>
      <button type="submit" className="btn btn-primary">Save reminder</button>
    </form>
  );
}
