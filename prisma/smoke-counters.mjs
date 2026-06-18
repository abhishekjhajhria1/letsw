// streak/counter math checks

function key(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

function applyCheckIn(user, today) {
  user.checkInCount += 1;
  if (user.lastCheckInDay !== today) {
    const yesterday = key(addDays(new Date(today + "T00:00:00"), -1));
    const newStreak = user.lastCheckInDay === yesterday ? user.streakCount + 1 : 1;
    user.streakCount = newStreak;
    user.longestStreak = Math.max(user.longestStreak, newStreak);
    user.lastCheckInDay = today;
  }
  return user;
}

function liveStreak(streakCount, lastCheckInDay, todayKey) {
  if (!lastCheckInDay) return 0;
  const yesterday = key(addDays(new Date(todayKey + "T00:00:00"), -1));
  return lastCheckInDay === todayKey || lastCheckInDay === yesterday ? streakCount : 0;
}

let failures = 0;
function eq(label, got, want) {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${pass ? "✓" : "✗"} ${label}${pass ? "" : ` — got ${got}, want ${want}`}`);
  if (!pass) failures++;
}

const u = { checkInCount: 0, streakCount: 0, longestStreak: 0, lastCheckInDay: null };

applyCheckIn(u, "2026-06-01");
eq("day1: streak=1", u.streakCount, 1);
eq("day1: checkInCount=1", u.checkInCount, 1);

applyCheckIn(u, "2026-06-02");
eq("day2: streak=2", u.streakCount, 2);
eq("day2: longest=2", u.longestStreak, 2);

applyCheckIn(u, "2026-06-02"); // second season, same day
eq("day2 again: streak unchanged", u.streakCount, 2);
eq("day2 again: checkInCount=3", u.checkInCount, 3);

applyCheckIn(u, "2026-06-04"); // skipped day 3
eq("day4 (gap): streak resets to 1", u.streakCount, 1);
eq("day4: longest stays 2", u.longestStreak, 2);
eq("day4: checkInCount=4", u.checkInCount, 4);

// liveStreak display
eq("alive when last==today", liveStreak(3, "2026-06-10", "2026-06-10"), 3);
eq("alive when last==yesterday", liveStreak(3, "2026-06-09", "2026-06-10"), 3);
eq("lapsed when 2 days stale", liveStreak(3, "2026-06-08", "2026-06-10"), 0);
eq("zero when never checked in", liveStreak(0, null, "2026-06-10"), 0);

if (failures) { console.error(`\n${failures} FAILED ❌`); process.exit(1); }
console.log("\nCOUNTER / STREAK MATH PASSED ✅");
