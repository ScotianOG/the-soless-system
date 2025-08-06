import { prisma } from "../../lib/prisma";
import { Prisma, ContestStatus, Platform } from "@prisma/client";
import { EngagementType } from "../types/engagement";

export interface UserContestStats {
  totalContests: number;
  totalPoints: number;
  bestRank: number;
  contestHistory: Array<{
    contestId: string;
    rank: number | null;
    points: number;
  }>;
}

export class PointManager {
  private static instance: PointManager;
  private prismaClient: typeof prisma;

  private constructor() {
    this.prismaClient = prisma;
  }

  public static getInstance(): PointManager {
    if (!PointManager.instance) {
      PointManager.instance = new PointManager();
    }
    return PointManager.instance;
  }

  // For testing purposes
  public setPrismaClient(client: typeof prisma) {
    this.prismaClient = client;
  }

  public async processEngagement(event: {
    userId: string;
    platform: Platform;
    type: EngagementType;
    points: number;
    metadata?: Record<string, any>;
    timestamp: Date;
  }): Promise<boolean> {
    try {
      const { userId, platform, points, metadata, timestamp } = event;

      // Validate inputs
      if (!userId || !platform || points <= 0 || !timestamp) {
        return false;
      }

      // Validate platform
      if (!Object.values(Platform).includes(platform)) {
        return false;
      }

      // Use transaction to ensure atomicity
      return await this.prismaClient.$transaction(async (tx) => {
        // Verify user exists within transaction
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return false;
        }

        try {
          // Create engagement with unique constraint
          await tx.engagement.create({
            data: {
              userId,
              platform,
              type: event.type,
              metadata,
              timestamp,
            },
          });

          // Create point transaction
          await tx.pointTransaction.create({
            data: {
              userId,
              amount: points,
              platform,
              reason: event.type,
              metadata,
              timestamp,
            },
          });

          // Update user points
          await tx.user.update({
            where: { id: userId },
            data: {
              points: { increment: points },
              lifetimePoints: { increment: points },
            },
          });

          // Find and update contest entry if there's an active contest
          const activeContest = await tx.contest.findFirst({
            where: { status: ContestStatus.ACTIVE },
          });

          if (activeContest) {
            await tx.contestEntry.upsert({
              where: {
                contestId_userId: {
                  contestId: activeContest.id,
                  userId: userId,
                },
              },
              create: {
                contestId: activeContest.id,
                userId: userId,
                points: points,
                rank: null,
              },
              update: {
                points: {
                  increment: points,
                },
              },
            });
          }

          return true;
        } catch (error) {
          // If engagement creation fails due to unique constraint, return false
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            return false;
          }
          throw error;
        }
      });
    } catch (error) {
      console.error(
        "Error processing engagement:",
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  async getUserContestStats(userId: string): Promise<any> {
    const userContests = await this.prismaClient.contestEntry.findMany({
      where: { userId },
      include: { contest: true },
      orderBy: { contest: { endTime: "desc" } },
    });

    const totalContests = userContests.length;
    const totalPoints = userContests.reduce(
      (sum: number, entry: { points: number }) => sum + entry.points,
      0
    );
    const bestRank =
      userContests.length > 0
        ? Math.min(
            ...userContests.map(
              (entry: { rank: number | null }) => entry.rank ?? Number.MAX_VALUE
            )
          )
        : 0;

    const contestHistory = userContests.map(
      (entry: {
        contest: { id: string };
        rank: number | null;
        points: number;
      }) => ({
        contestId: entry.contest.id,
        rank: entry.rank,
        points: entry.points,
      })
    );

    return {
      totalContests,
      totalPoints,
      bestRank,
      contestHistory,
    };
  }

  async getLeaderboard({
    platform,
    limit,
  }: {
    platform: Platform;
    limit: number;
  }) {
    return await this.prismaClient.user.findMany({
      take: limit,
      orderBy: {
        points: "desc",
      },
      include: {
        telegramAccount: true,
        discordAccount: true,
        twitterAccount: true,
      },
    });
  }
}
