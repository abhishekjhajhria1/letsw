export type BadgeInput = {
  totalCheckIns: number;
  bestStreak: number;
  crewSize: number;
  verificationsGiven: number;
};

export type Badge = {
  key: string;
  emoji: string;
  name: string;
  desc: string;
  earned: boolean;
};

export function computeBadges(i: BadgeInput): Badge[] {
  const list: Array<Omit<Badge, "earned"> & { test: (i: BadgeInput) => boolean }> = [
    { key: "first", emoji: "🌱", name: "First Step", desc: "Logged your first check-in", test: (x) => x.totalCheckIns >= 1 },
    { key: "week", emoji: "🔥", name: "Week Warrior", desc: "Reached a 7-day streak", test: (x) => x.bestStreak >= 7 },
    { key: "month", emoji: "⚡", name: "Unstoppable", desc: "Reached a 30-day streak", test: (x) => x.bestStreak >= 30 },
    { key: "century", emoji: "💯", name: "Centurion", desc: "100 total check-ins", test: (x) => x.totalCheckIns >= 100 },
    { key: "partner", emoji: "🤝", name: "Good Partner", desc: "Verified 10 partner check-ins", test: (x) => x.verificationsGiven >= 10 },
    { key: "recruit", emoji: "🌳", name: "Recruiter", desc: "Grew a crew of 3+", test: (x) => x.crewSize >= 3 },
    { key: "kingpin", emoji: "👑", name: "Kingpin", desc: "Grew a crew of 10+", test: (x) => x.crewSize >= 10 },
  ];
  return list.map(({ test, ...b }) => ({ ...b, earned: test(i) }));
}
