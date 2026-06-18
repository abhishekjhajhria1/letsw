"use client";

import { checkInAction } from "@/app/actions";
import { playSound } from "@/lib/sound";

export default function CheckInForm({
  seasonId,
  existingNote,
  existingProof,
  done,
}: {
  seasonId: string;
  existingNote: string;
  existingProof: string;
  done: boolean;
}) {
  return (
    <form action={checkInAction} onSubmit={() => playSound("checkin")} className="space-y-3">
      <input type="hidden" name="seasonId" value={seasonId} />
      <div>
        <label className="label">What did you do today?</label>
        <textarea
          name="note"
          defaultValue={existingNote}
          className="input min-h-20"
          placeholder="Be specific. Your partner is reading this."
        />
      </div>
      <div>
        <label className="label">Proof (optional link or number)</label>
        <input name="proof" defaultValue={existingProof} className="input" placeholder="photo URL, reps, pages, screenshot…" />
      </div>
      <button type="submit" className="btn btn-primary w-full">
        {done ? "Update today's check-in" : "Check in for today ✓"}
      </button>
    </form>
  );
}
