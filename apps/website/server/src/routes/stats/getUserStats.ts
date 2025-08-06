// src/routes/stats/getUserStats.ts
import { PrismaClient, Engagement } from "@prisma/client";
import {
  ActivityLog,
  MultiPlatformStats,
  Platform,
  ActivityType,
} from "./types";
import { getPlatformStats } from "./getPlatformStats";
import { getGlobalRank } from "./getGlobalRank";

async function getRecentActivity(
  prisma: PrismaClient,
  userId: string
): Promise<ActivityLog[]> {
  // First get the engagements
  const activities = await prisma.engagement.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: 10,
  });

  // Then get the point transactions within a small time window of each engagement
  const pointTransactions =
    activities.length > 0
      ? await prisma.pointTransaction.findMany({
          where: {
            userId,
            platform: {
              in: activities.map((a) => a.platform),
            },
            timestamp: {
              gte: activities[activities.length - 1].timestamp,
              lte: activities[0].timestamp,
            },
          },
        })
      : [];

  // Create a map of platform+timestamp to points for quick lookup
  const getPointKey = (platform: string, timestamp: Date) =>
    `${platform}-${timestamp.getTime()}`;

  const pointsByActivity = new Map(
    pointTransactions.map((pt) => [
      getPointKey(pt.platform, pt.timestamp),
      pt.amount,
    ])
  );

  return activities.map((activity: Engagement) => ({
    timestamp: activity.timestamp,
    type: activity.type as ActivityType,
    platform: activity.platform as Platform,
    points:
      pointsByActivity.get(
        getPointKey(activity.platform, activity.timestamp)
      ) || 0,
    metadata: activity.metadata
      ? (activity.metadata as Record<string, any>)
      : {},
  }));
}

export async function getUserStats(
  prisma: PrismaClient,
  wallet: string
): Promise<MultiPlatformStats> {
  const user = await prisma.user.findUnique({
    where: { wallet },
    include: {
      telegramAccount: true,
      discordAccount: true,
      twitterAccount: true,
      engagements: {
        take: 10,
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const [telegramStats, discordStats, twitterStats, recentActivity] =
    await Promise.all([
      getPlatformStats(prisma, "TELEGRAM" as Platform, user.id),
      getPlatformStats(prisma, "DISCORD" as Platform, user.id),
      getPlatformStats(prisma, "TWITTER" as Platform, user.id),
      getRecentActivity(prisma, user.id),
    ]);

  const totalPoints =
    telegramStats.points + discordStats.points + twitterStats.points;

  return {
    points: totalPoints,
    totalPoints,
    rank: await getGlobalRank(prisma, user.id),
    platforms: {
      telegram: telegramStats,
      discord: discordStats,
      twitter: twitterStats,
    },
    platformStats: {
      TELEGRAM: telegramStats,
      DISCORD: discordStats,
      TWITTER: twitterStats,
    },
    recentActivity,
  };
}
