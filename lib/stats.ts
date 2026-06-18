import { unstable_cache } from "next/cache";
import { prisma } from "./db";

// cached landing counts
export const getPublicStats = unstable_cache(
  async () => {
    const [members, activeSeasons, checkIns] = await Promise.all([
      prisma.user.count(),
      prisma.partnerSeason.count({ where: { status: "active" } }),
      prisma.checkIn.count(),
    ]);
    return { members, activeSeasons, checkIns };
  },
  ["public-stats"],
  { revalidate: 300, tags: ["public-stats"] }
);

// top 20, cached
export const getLeaderboard = unstable_cache(
  async () => {
    return prisma.user.findMany({
      orderBy: [{ checkInCount: "desc" }, { longestStreak: "desc" }, { crewCount: "desc" }],
      take: 20,
      select: {
        id: true,
        username: true,
        checkInCount: true,
        streakCount: true,
        longestStreak: true,
        lastCheckInDay: true,
        crewCount: true,
      },
    });
  },
  ["leaderboard"],
  { revalidate: 120, tags: ["leaderboard"] }
);
