// Local day key as YYYY-MM-DD
export function dayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// streak counts only if the last check-in was today or yesterday
export function liveStreak(streakCount: number, lastCheckInDay: string | null): number {
  if (!lastCheckInDay) return 0;
  const today = dayKey();
  const yesterday = dayKey(addDays(new Date(), -1));
  return lastCheckInDay === today || lastCheckInDay === yesterday ? streakCount : 0;
}

// longest run of consecutive days in the set
export function longestStreak(dayKeys: string[]): number {
  const sorted = [...new Set(dayKeys)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const d = new Date(k + "T00:00:00");
    if (prev && Math.round((d.getTime() - prev.getTime()) / 864e5) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

// current run of days ending today or yesterday
export function currentStreak(dayKeys: string[]): number {
  const set = new Set(dayKeys);
  let streak = 0;
  let cursor = new Date();
  if (!set.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  while (set.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
