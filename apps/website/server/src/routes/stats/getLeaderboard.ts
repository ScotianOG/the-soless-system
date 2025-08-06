// src/routes/stats/getLeaderboard.ts
import { PrismaClient } from "@prisma/client";
import { Platform } from "./types";

interface LeaderboardOptions {
  platform?: Platform;
  limit?: number;
  timeframe?: "all" | "daily" | "weekly" | "monthly";
}

interface LeaderboardEntry {
  wallet: string;
  points: number;
  telegramUsername?: string;
  discordUsername?: string;
  twitterUsername?: string;
  rank: number;
}

export async function getLeaderboard(
  prisma: PrismaClient,
  options: LeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const { platform, limit = 100, timeframe = "all" } = options;

  // Calculate date range based on timeframe
  const dateFilter = getDateFilter(timeframe);

  // Base query
  const query: any = {
    take: limit,
    orderBy: { points: "desc" },
    select: {
      wallet: true,
      points: true,
      telegramUsername: true,
      discordUsername: true,
      twitterUsername: true,
      pointTransactions: platform
        ? {
            where: {
              platform,
              ...(dateFilter && { timestamp: dateFilter }),
            },
            select: {
              amount: true,
            },
          }
        : undefined,
    },
  };

  // Add platform-specific filters if needed
  if (platform) {
    query.where = {
      pointTransactions: {
        some: {
          platform,
          ...(dateFilter && { timestamp: dateFilter }),
        },
      },
    };
  }

  const users = await prisma.user.findMany(query);

  // Calculate platform-specific points if needed
  const leaderboard = users.map((user: any, index) => {
    const entry: LeaderboardEntry = {
      wallet: user.wallet,
      points: platform
        ? user.pointTransactions?.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0) || 0
        : user.points,
      telegramUsername: user.telegramUsername ?? undefined,
      discordUsername: user.discordUsername ?? undefined,
      twitterUsername: user.twitterUsername ?? undefined,
      rank: index + 1,
    };
    return entry;
  });

  // Sort by points if using platform-specific points
  if (platform) {
    leaderboard.sort((a, b) => b.points - a.points);
    // Recalculate ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  return leaderboard;
}

function getDateFilter(timeframe: string) {
  const now = new Date();
  switch (timeframe) {
    case "daily":
      const today = new Date(now.setHours(0, 0, 0, 0));
      return { gte: today };
    case "weekly":
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return { gte: weekAgo };
    case "monthly":
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return { gte: monthAgo };
    default:
      return null;
  }
}
