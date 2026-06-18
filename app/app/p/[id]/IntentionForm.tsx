"use client";

import { setIntentionAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function IntentionForm({ seasonId, current }: { seasonId: string; current: string }) {
  return (
    <form action={setIntentionAction} onSubmit={() => playSound("pop")} className="mt-3 flex gap-2">
      <input type="hidden" name="seasonId" value={seasonId} />
      <input
        name="text"
        defaultValue={current}
        maxLength={200}
        placeholder="Today's focus — one thing"
        className="input py-2 text-sm"
      />
      <button type="submit" className="btn btn-ghost px-3 py-2 text-sm whitespace-nowrap">
        Set
      </button>
    </form>
  );
}
