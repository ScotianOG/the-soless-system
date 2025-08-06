// src/core/contest/RewardManager.ts
import { PrismaClient, ContestStatus } from "@prisma/client";
import { ContestTier, ContestTierName, RewardType } from "../types/contest";
import { configManager } from "../../config/ConfigManager";
import { DistributedLock } from "../utils/DistributedLock";

interface ContestEntry {
  id: string;
  userId: string;
  points: number;
  rank: number | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: any;
  contestId: string;
  qualifiedAt: Date | null;
}

export class RewardManager {
  checkAndAwardEngagementRewards(id: string) {
    throw new Error("Method not implemented.");
  }
  private static instance: RewardManager;
  private prisma: PrismaClient;
  private distributedLock: DistributedLock;
  private configManager = configManager;

  public setPrismaClient(client: PrismaClient): void {
    this.prisma = client;
  }

  constructor() {
    this.prisma = new PrismaClient();
    this.distributedLock = new DistributedLock();
  }

  static getInstance(): RewardManager {
    if (!RewardManager.instance) {
      RewardManager.instance = new RewardManager();
    }
    return RewardManager.instance;
  }

  async distributeRewards(contestId: string): Promise<void> {
    try {
      const contest = await this.prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          entries: {
            orderBy: { points: "desc" },
          },
        },
      });

      if (!contest) throw new Error("Contest not found");

      const tiers = this.configManager.getContestConfig().tiers || [];
      const prizes = this.configManager.getContestConfig().prizes;

      // Process rewards in smaller, more efficient batches
      await this.prisma.$transaction(
        async (
          tx: Omit<
            PrismaClient,
            | "$connect"
            | "$disconnect"
            | "$on"
            | "$transaction"
            | "$use"
            | "$extends"
          >
        ) => {
          // Step 1: Batch update all entries with ranks and points
          const rankUpdates = contest.entries.map((entry, index) =>
            tx.contestEntry.update({
              where: { id: entry.id },
              data: {
                rank: index + 1,
                points: entry.points || 0,
              },
            })
          );
          await Promise.all(rankUpdates);

          // Step 2: Prepare all rewards data for batch creation
          const rewardsToCreate: any[] = [];
          const entryUpdates: any[] = [];

          contest.entries.forEach((entry, index) => {
            if (!entry.points) return; // Skip entries with no points

            const rank = index + 1;

            // Process tier-based rewards
            const qualifiedTiers = tiers.filter(
              (tier: any) => entry.points >= tier.minPoints
            );

            // Process rank-based rewards
            const rankPrize = prizes.find((p: any) => p.rank === rank);

            // Prepare tier-based rewards for batch creation
            qualifiedTiers.forEach((tier: any) => {
              rewardsToCreate.push({
                contestId,
                userId: entry.userId,
                type: tier.reward,
                status: "PENDING",
                expiresAt: this.calculateExpiryDate(tier.reward),
                metadata: {
                  tierName: tier.name,
                  qualifyingPoints: tier.minPoints,
                  actualPoints: entry.points,
                  rewardSystem: "tier",
                },
              });
            });

            // Prepare rank-based reward for batch creation
            if (rankPrize) {
              rewardsToCreate.push({
                contestId,
                userId: entry.userId,
                type: "USDC",
                status: "PENDING",
                expiresAt: this.calculateExpiryDate("USDC"),
                metadata: {
                  rank: rankPrize.rank,
                  amount: rankPrize.reward,
                  description: rankPrize.description,
                  actualPoints: entry.points,
                  rewardSystem: "rank",
                },
              });
            }

            // Prepare entry metadata update
            entryUpdates.push({
              where: { id: entry.id },
              data: {
                qualifiedAt: new Date(),
                metadata: {
                  tier:
                    qualifiedTiers.length > 0
                      ? qualifiedTiers[qualifiedTiers.length - 1].name
                      : undefined,
                  rank: rank,
                  rankPrize: rankPrize
                    ? {
                        amount: rankPrize.reward,
                        description: rankPrize.description,
                      }
                    : undefined,
                  qualifiedAt: new Date(),
                  finalPoints: entry.points,
                },
              },
            });
          });

          // Step 3: Batch create all rewards
          if (rewardsToCreate.length > 0) {
            await tx.contestReward.createMany({
              data: rewardsToCreate,
            });
          }

          // Step 4: Batch update all entry metadata
          const metadataUpdates = entryUpdates.map((update) =>
            tx.contestEntry.update(update)
          );
          await Promise.all(metadataUpdates);
        },
        {
          maxWait: 10000, // 10 seconds
          timeout: 30000, // 30 seconds
        }
      );
    } catch (error) {
      console.error("Error distributing rewards:", error);
      throw new Error("Error distributing rewards");
    }
  }

  async claimReward(rewardId: string, userId: string): Promise<boolean> {
    try {
      const reward = await this.prisma.contestReward.findUnique({
        where: { id: rewardId },
        include: {
          user: true,
        },
      });

      // Validate reward status and eligibility
      const validationErrors: string[] = [];
      if (!reward) {
        throw new Error("Reward not found");
      }

      if (reward.userId !== userId)
        validationErrors.push("Not authorized to claim this reward");
      if (reward.status !== "PENDING")
        validationErrors.push("Reward not claimable");
      if (reward.expiresAt && reward.expiresAt < new Date())
        validationErrors.push("Reward expired");

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      await this.prisma.contestReward.update({
        where: { id: rewardId },
        data: {
          status: "CLAIMED",
          claimedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("Error claiming reward:", error);
      throw error;
    }
  }

  async getUserRewards(userId: string): Promise<any[]> {
    return this.prisma.contestReward.findMany({
      where: {
        userId: userId,
      },
      include: {
        contest: {
          select: {
            name: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  private calculateExpiryDate(rewardType: RewardType | "USDC"): Date | null {
    // For USDC rewards (immediate prizes) - keep short expiry
    if (rewardType === "USDC") {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7); // 7-day expiry for USDC rewards
      return expiry;
    }
    // For mint/whitelist rewards - no expiry
    return null; // Null expiry means it won't expire
  }

  async checkTierEligibility(
    userId: string,
    contestId: string
  ): Promise<{
    eligible: boolean;
    currentTier?: {
      name: ContestTierName;
      minPoints: number;
      reward: RewardType;
    };
    nextTier?: {
      name: ContestTierName;
      minPoints: number;
      reward: RewardType;
    };
    pointsNeeded?: number;
  }> {
    const entry = await this.prisma.contestEntry.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId,
        },
      },
    });

    if (!entry) return { eligible: false };

    const tiers = this.configManager.getContestConfig().tiers || [];
    const currentTier =
      tiers.length > 0
        ? tiers.filter((tier: any) => entry.points >= tier.minPoints).pop()
        : undefined;

    const nextTier =
      tiers.length > 0
        ? tiers.find((tier: any) => entry.points < tier.minPoints)
        : undefined;

    return {
      eligible: !!currentTier,
      currentTier,
      nextTier,
      pointsNeeded: nextTier ? nextTier.minPoints - entry.points : 0,
    };
  }

  async startNewContest(): Promise<void> {
    const lockKey = "contest:lifecycle:start";
    const lockTimeout = 30000; // 30 seconds

    const lockValue = await this.distributedLock.acquire(lockKey, {
      ttl: lockTimeout,
    });
    if (!lockValue) {
      throw new Error("Failed to acquire lock for starting new contest");
    }

    try {
      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() +
          configManager.getContestConfig().roundDurationHours * 60 * 60 * 1000
      );

      await this.prisma.$transaction([
        // End any active contests
        this.prisma.contest.updateMany({
          where: { status: ContestStatus.ACTIVE },
          data: { status: ContestStatus.COMPLETED },
        }),

        // Create new contest
        this.prisma.contest.create({
          data: {
            name: `Contest Round ${startTime.toISOString()}`,
            startTime,
            endTime,
            status: ContestStatus.ACTIVE,
            metadata: {
              currentPhase: "START",
              createdAt: startTime,
              qualifiedUsers: [],
            },
          },
        }),
      ]);
    } finally {
      await this.distributedLock.release(lockKey, lockValue);
    }
  }

  async endCurrentContest(): Promise<void> {
    const lockKey = "contest:lifecycle:end";
    const lockTimeout = 60000; // 60 seconds for ending contest (longer as it includes reward distribution)

    const lockValue = await this.distributedLock.acquire(lockKey, {
      ttl: lockTimeout,
    });
    if (!lockValue) {
      throw new Error("Failed to acquire lock for ending current contest");
    }

    try {
      const currentContest = await this.prisma.contest.findFirst({
        where: { status: ContestStatus.ACTIVE },
        include: {
          entries: {
            orderBy: { points: "desc" },
          },
        },
      });

      if (!currentContest) {
        throw new Error("No active contest found to end");
      }

      // Update entries with ranks
      await this.prisma.$transaction(
        async (
          tx: Omit<
            PrismaClient,
            | "$connect"
            | "$disconnect"
            | "$on"
            | "$transaction"
            | "$use"
            | "$extends"
          >
        ) => {
          // Update ranks for all entries
          for (let i = 0; i < currentContest.entries.length; i++) {
            const entry = currentContest.entries[i];
            await tx.contestEntry.update({
              where: { id: entry.id },
              data: {
                rank: i + 1,
                points: entry.points || 0, // Ensure points is not null
              },
            });
          }

          // Update contest status
          await tx.contest.update({
            where: { id: currentContest.id },
            data: {
              status: ContestStatus.COMPLETED,
              metadata: {
                currentPhase: "END",
                completedAt: new Date(),
                qualifiedUsers: currentContest.entries
                  .filter(
                    (entry: ContestEntry) =>
                      entry.points >=
                      configManager.getContestConfig().minPointsToQualify
                  )
                  .map((entry: ContestEntry) => entry.userId),
              },
            },
          });
        }
      );

      // Distribute rewards after ranks are updated
      await this.distributeRewards(currentContest.id);
    } finally {
      await this.distributedLock.release(lockKey, lockValue);
    }
  }

  async cleanupOldContests(): Promise<void> {
    const oldContests = await this.prisma.contest.findMany({
      where: {
        status: ContestStatus.COMPLETED,
        endTime: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const contest of oldContests) {
      await this.prisma.contest.update({
        where: { id: contest.id },
        data: {
          metadata: {
            ...(contest.metadata as Record<string, any>),
            archived: true,
            archiveDate: new Date(),
          },
        },
      });
    }
  }

  // New method to check rank-based eligibility
  async checkRankEligibility(
    userId: string,
    contestId: string
  ): Promise<{
    eligible: boolean;
    currentRank: number | null;
    reward?: {
      amount: string;
      description: string;
    };
  }> {
    const entry = await this.prisma.contestEntry.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId,
        },
      },
    });

    if (!entry) return { eligible: false, currentRank: null };

    const prizes = configManager.getContestConfig().prizes;
    const prize = prizes.find((p: any) => p.rank === entry.rank);

    return {
      eligible: !!prize,
      currentRank: entry.rank || null,
      reward: prize
        ? {
            amount: prize.reward,
            description: prize.description,
          }
        : undefined,
    };
  }

  async getCurrentRound(): Promise<number> {
    const completedContests = await this.prisma.contest.count({
      where: { status: ContestStatus.COMPLETED },
    });
    return completedContests + 1;
  }

  async getTimeLeft(): Promise<string> {
    const currentContest = await this.prisma.contest.findFirst({
      where: { status: ContestStatus.ACTIVE },
    });

    if (!currentContest || !currentContest.endTime) {
      return "No active contest";
    }

    const timeLeft = currentContest.endTime.getTime() - Date.now();
    if (timeLeft <= 0) return "Contest ending...";

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  async getQualifiedUsersCount(): Promise<number> {
    const currentContest = await this.prisma.contest.findFirst({
      where: { status: ContestStatus.ACTIVE },
      include: {
        entries: true,
      },
    });

    if (!currentContest) return 0;

    return currentContest.entries.filter(
      (entry: { points: number }) =>
        entry.points >= configManager.getContestConfig().minPointsToQualify
    ).length;
  }

  async getTopParticipants(): Promise<
    Array<{ username: string; points: number }>
  > {
    const currentContest = await this.prisma.contest.findFirst({
      where: { status: ContestStatus.ACTIVE },
      include: {
        entries: {
          orderBy: { points: "desc" },
          take: 10,
          include: {
            user: true,
          },
        },
      },
    });

    if (!currentContest) return [];

    return currentContest.entries.map((entry) => ({
      username:
        entry.user.telegramUsername ??
        entry.user.discordUsername ??
        entry.user.twitterUsername ??
        "Unknown",
      points: entry.points ?? 0,
    }));
  }
}

// Export singleton instance
export default RewardManager.getInstance();
