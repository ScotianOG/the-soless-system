// src/routes/stats/getPlatformStats.ts
import { PrismaClient } from "@prisma/client";
import { Platform, PlatformStats } from "./types";

export async function getPlatformStats(
  prisma: PrismaClient,
  platform: Platform,
  userId: string
): Promise<PlatformStats> {
  const [points, engagements] = await Promise.all([
    prisma.pointTransaction.aggregate({
      where: {
        userId,
        platform,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.engagement.count({
      where: {
        userId,
        platform,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    points: points._sum.amount || 0,
    interactions: engagements,
    engagements,
  };
}
