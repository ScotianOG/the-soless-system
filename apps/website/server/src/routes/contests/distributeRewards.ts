// src/routes/contests/distributeRewards.ts
import {
  PrismaClient,
  ContestStatus,
  RewardStatus,
  RewardType,
  ContestTier,
} from "@prisma/client";

interface TierRewardMapping {
  [key: string]: RewardType;
}

export async function distributeRewards(
  prisma: PrismaClient,
  contestId: string
) {
  // Verify the contest exists and is completed
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      entries: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  if (contest.status !== ContestStatus.COMPLETED) {
    throw new Error(
      "Cannot distribute rewards for a contest that is not completed"
    );
  }

  // Check if rewards have already been distributed
  const existingRewards = await prisma.contestReward.count({
    where: {
      contestId: contestId,
    },
  });

  if (existingRewards > 0) {
    throw new Error("Rewards have already been distributed for this contest");
  }

  // Parse contest rules to determine tier thresholds and rewards
  const rules = contest.rules as any;
  if (!rules || !rules.tiers) {
    throw new Error("Contest rules are not properly configured");
  }

  // Map tier levels to reward types
  const tierRewards: TierRewardMapping = {};
  rules.tiers.forEach((tier: any) => {
    tierRewards[tier.name] = tier.reward;
  });

  // Find qualified users who meet the minimum threshold
  const qualifiedEntries = contest.entries.filter(
    (entry) =>
      entry.qualifiedAt !== null &&
      entry.points >= (rules.entryRequirements?.minimumPoints || 0)
  );

  // Batch create rewards for all qualifying users based on their tiers
  const rewardPromises = qualifiedEntries.map(async (entry) => {
    // Determine user's tier based on points
    let userTier: ContestTier = ContestTier.BRONZE; // Default tier
    let rewardType: RewardType = RewardType.WHITELIST; // Default reward

    // Sort tiers by points (highest to lowest) and find the highest tier the user qualifies for
    const sortedTiers = [...rules.tiers].sort(
      (a, b) => b.minPoints - a.minPoints
    );

    for (const tier of sortedTiers) {
      if (entry.points >= tier.minPoints) {
        userTier = tier.name as ContestTier;
        rewardType = tierRewards[tier.name] || RewardType.WHITELIST;
        break;
      }
    }

    // Create qualification record
    const qualification = await prisma.contestQualification.create({
      data: {
        contestId: contestId,
        userId: entry.userId,
        tier: userTier,
        metadata: {
          pointsEarned: entry.points,
          rank: entry.rank,
        },
      },
    });

    // Create reward record
    return prisma.contestReward.create({
      data: {
        contestId: contestId,
        userId: entry.userId,
        type: rewardType,
        status: RewardStatus.PENDING,
        description: `${userTier} tier reward for ${contest.name}`,
        metadata: {
          qualification: qualification.id,
          tier: userTier,
          pointsEarned: entry.points,
          rewardSystem: "tier",
        },
      },
    });
  });

  // Execute all the reward creation operations
  const rewards = await Promise.all(rewardPromises);

  // Return summary
  return {
    contestId: contestId,
    rewardsDistributed: rewards.length,
    tiers: {
      BRONZE: rewards.filter((r) => (r.metadata as any).tier === "BRONZE")
        .length,
      SILVER: rewards.filter((r) => (r.metadata as any).tier === "SILVER")
        .length,
      GOLD: rewards.filter((r) => (r.metadata as any).tier === "GOLD").length,
      PLATINUM: rewards.filter((r) => (r.metadata as any).tier === "PLATINUM")
        .length,
      DIAMOND: rewards.filter((r) => (r.metadata as any).tier === "DIAMOND")
        .length,
    },
  };
}
