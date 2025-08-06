// src/services/PlatformStatsService.ts
import { PrismaClient } from "@prisma/client";
import { Platform, PlatformStats } from "../routes/stats/types";

export class PlatformStatsService {
  constructor(private prisma: PrismaClient) {}

  async getPlatformStats(
    platform: Platform,
    userId: string
  ): Promise<PlatformStats> {
    const [points, engagements] = await Promise.all([
      this.prisma.pointTransaction.aggregate({
        where: {
          userId,
          platform,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.engagement.count({
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

  async getGlobalRank(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      return 0;
    }

    const higherRankedCount = await this.prisma.user.count({
      where: {
        points: {
          gt: user.points,
        },
      },
    });

    return higherRankedCount + 1;
  }

  async getTotalEngagements(
    userId: string,
    platform?: Platform
  ): Promise<number> {
    return this.prisma.engagement.count({
      where: {
        userId,
        ...(platform && { platform }),
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });
  }

  async getStreakData(userId: string, platform: Platform): Promise<number> {
    const streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      return 0;
    }

    switch (platform) {
      case "TELEGRAM":
        return streak.telegramStreak;
      case "DISCORD":
        return streak.discordStreak;
      case "TWITTER":
        return streak.twitterStreak;
      default:
        return 0;
    }
  }

  async getUserTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.pointTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }
}
