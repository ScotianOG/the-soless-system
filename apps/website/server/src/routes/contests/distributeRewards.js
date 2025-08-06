"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributeRewards = distributeRewards;
// src/routes/contests/distributeRewards.ts
const client_1 = require("@prisma/client");
async function distributeRewards(prisma, contestId) {
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
    if (contest.status !== client_1.ContestStatus.COMPLETED) {
        throw new Error("Cannot distribute rewards for a contest that is not completed");
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
    const rules = contest.rules;
    if (!rules || !rules.tiers) {
        throw new Error("Contest rules are not properly configured");
    }
    // Map tier levels to reward types
    const tierRewards = {};
    rules.tiers.forEach((tier) => {
        tierRewards[tier.name] = tier.reward;
    });
    // Find qualified users who meet the minimum threshold
    const qualifiedEntries = contest.entries.filter((entry) => entry.qualifiedAt !== null &&
        entry.points >= (rules.entryRequirements?.minimumPoints || 0));
    // Batch create rewards for all qualifying users based on their tiers
    const rewardPromises = qualifiedEntries.map(async (entry) => {
        // Determine user's tier based on points
        let userTier = client_1.ContestTier.BRONZE; // Default tier
        let rewardType = client_1.RewardType.WHITELIST; // Default reward
        // Sort tiers by points (highest to lowest) and find the highest tier the user qualifies for
        const sortedTiers = [...rules.tiers].sort((a, b) => b.minPoints - a.minPoints);
        for (const tier of sortedTiers) {
            if (entry.points >= tier.minPoints) {
                userTier = tier.name;
                rewardType = tierRewards[tier.name] || client_1.RewardType.WHITELIST;
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
                status: client_1.RewardStatus.PENDING,
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
            BRONZE: rewards.filter((r) => r.metadata.tier === "BRONZE")
                .length,
            SILVER: rewards.filter((r) => r.metadata.tier === "SILVER")
                .length,
            GOLD: rewards.filter((r) => r.metadata.tier === "GOLD").length,
            PLATINUM: rewards.filter((r) => r.metadata.tier === "PLATINUM")
                .length,
            DIAMOND: rewards.filter((r) => r.metadata.tier === "DIAMOND")
                .length,
        },
    };
}
