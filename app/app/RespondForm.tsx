"use client";

import { respondPartnershipAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function RespondForm({ id }: { id: string }) {
  return (
    <form action={respondPartnershipAction} className="mt-4 space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="label">Your goal for this season</label>
        <input name="goal" className="input" placeholder="e.g. Read 20 pages every day" />
      </div>
      <div className="flex gap-2">
        <button name="accept" value="1" className="btn btn-primary flex-1" onClick={() => playSound("success")}>
          Accept &amp; commit
        </button>
        <button name="accept" value="0" className="btn btn-ghost" onClick={() => playSound("click")}>
          Decline
        </button>
      </div>
    </form>
  );
}
