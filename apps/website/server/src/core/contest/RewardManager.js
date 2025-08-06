"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardManager = void 0;
// src/core/contest/RewardManager.ts
const client_1 = require("@prisma/client");
const ConfigManager_1 = require("../../config/ConfigManager");
const DistributedLock_1 = require("../utils/DistributedLock");
class RewardManager {
    checkAndAwardEngagementRewards(id) {
        throw new Error("Method not implemented.");
    }
    setPrismaClient(client) {
        this.prisma = client;
    }
    constructor() {
        this.configManager = ConfigManager_1.configManager;
        this.prisma = new client_1.PrismaClient();
        this.distributedLock = new DistributedLock_1.DistributedLock();
    }
    static getInstance() {
        if (!RewardManager.instance) {
            RewardManager.instance = new RewardManager();
        }
        return RewardManager.instance;
    }
    async distributeRewards(contestId) {
        try {
            const contest = await this.prisma.contest.findUnique({
                where: { id: contestId },
                include: {
                    entries: {
                        orderBy: { points: "desc" },
                    },
                },
            });
            if (!contest)
                throw new Error("Contest not found");
            const tiers = this.configManager.getContestConfig().tiers || [];
            const prizes = this.configManager.getContestConfig().prizes;
            // Process rewards in smaller, more efficient batches
            await this.prisma.$transaction(async (tx) => {
                // Step 1: Batch update all entries with ranks and points
                const rankUpdates = contest.entries.map((entry, index) => tx.contestEntry.update({
                    where: { id: entry.id },
                    data: {
                        rank: index + 1,
                        points: entry.points || 0,
                    },
                }));
                await Promise.all(rankUpdates);
                // Step 2: Prepare all rewards data for batch creation
                const rewardsToCreate = [];
                const entryUpdates = [];
                contest.entries.forEach((entry, index) => {
                    if (!entry.points)
                        return; // Skip entries with no points
                    const rank = index + 1;
                    // Process tier-based rewards
                    const qualifiedTiers = tiers.filter((tier) => entry.points >= tier.minPoints);
                    // Process rank-based rewards
                    const rankPrize = prizes.find((p) => p.rank === rank);
                    // Prepare tier-based rewards for batch creation
                    qualifiedTiers.forEach((tier) => {
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
                                tier: qualifiedTiers.length > 0
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
                const metadataUpdates = entryUpdates.map((update) => tx.contestEntry.update(update));
                await Promise.all(metadataUpdates);
            }, {
                maxWait: 10000, // 10 seconds
                timeout: 30000, // 30 seconds
            });
        }
        catch (error) {
            console.error("Error distributing rewards:", error);
            throw new Error("Error distributing rewards");
        }
    }
    async claimReward(rewardId, userId) {
        try {
            const reward = await this.prisma.contestReward.findUnique({
                where: { id: rewardId },
                include: {
                    user: true,
                },
            });
            // Validate reward status and eligibility
            const validationErrors = [];
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
        }
        catch (error) {
            console.error("Error claiming reward:", error);
            throw error;
        }
    }
    async getUserRewards(userId) {
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
    calculateExpiryDate(rewardType) {
        // For USDC rewards (immediate prizes) - keep short expiry
        if (rewardType === "USDC") {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 7); // 7-day expiry for USDC rewards
            return expiry;
        }
        // For mint/whitelist rewards - no expiry
        return null; // Null expiry means it won't expire
    }
    async checkTierEligibility(userId, contestId) {
        const entry = await this.prisma.contestEntry.findUnique({
            where: {
                contestId_userId: {
                    contestId,
                    userId,
                },
            },
        });
        if (!entry)
            return { eligible: false };
        const tiers = this.configManager.getContestConfig().tiers || [];
        const currentTier = tiers.length > 0
            ? tiers.filter((tier) => entry.points >= tier.minPoints).pop()
            : undefined;
        const nextTier = tiers.length > 0
            ? tiers.find((tier) => entry.points < tier.minPoints)
            : undefined;
        return {
            eligible: !!currentTier,
            currentTier,
            nextTier,
            pointsNeeded: nextTier ? nextTier.minPoints - entry.points : 0,
        };
    }
    async startNewContest() {
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
            const endTime = new Date(startTime.getTime() +
                ConfigManager_1.configManager.getContestConfig().roundDurationHours * 60 * 60 * 1000);
            await this.prisma.$transaction([
                // End any active contests
                this.prisma.contest.updateMany({
                    where: { status: client_1.ContestStatus.ACTIVE },
                    data: { status: client_1.ContestStatus.COMPLETED },
                }),
                // Create new contest
                this.prisma.contest.create({
                    data: {
                        name: `Contest Round ${startTime.toISOString()}`,
                        startTime,
                        endTime,
                        status: client_1.ContestStatus.ACTIVE,
                        metadata: {
                            currentPhase: "START",
                            createdAt: startTime,
                            qualifiedUsers: [],
                        },
                    },
                }),
            ]);
        }
        finally {
            await this.distributedLock.release(lockKey, lockValue);
        }
    }
    async endCurrentContest() {
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
                where: { status: client_1.ContestStatus.ACTIVE },
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
            await this.prisma.$transaction(async (tx) => {
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
                        status: client_1.ContestStatus.COMPLETED,
                        metadata: {
                            currentPhase: "END",
                            completedAt: new Date(),
                            qualifiedUsers: currentContest.entries
                                .filter((entry) => entry.points >=
                                ConfigManager_1.configManager.getContestConfig().minPointsToQualify)
                                .map((entry) => entry.userId),
                        },
                    },
                });
            });
            // Distribute rewards after ranks are updated
            await this.distributeRewards(currentContest.id);
        }
        finally {
            await this.distributedLock.release(lockKey, lockValue);
        }
    }
    async cleanupOldContests() {
        const oldContests = await this.prisma.contest.findMany({
            where: {
                status: client_1.ContestStatus.COMPLETED,
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
                        ...contest.metadata,
                        archived: true,
                        archiveDate: new Date(),
                    },
                },
            });
        }
    }
    // New method to check rank-based eligibility
    async checkRankEligibility(userId, contestId) {
        const entry = await this.prisma.contestEntry.findUnique({
            where: {
                contestId_userId: {
                    contestId,
                    userId,
                },
            },
        });
        if (!entry)
            return { eligible: false, currentRank: null };
        const prizes = ConfigManager_1.configManager.getContestConfig().prizes;
        const prize = prizes.find((p) => p.rank === entry.rank);
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
    async getCurrentRound() {
        const completedContests = await this.prisma.contest.count({
            where: { status: client_1.ContestStatus.COMPLETED },
        });
        return completedContests + 1;
    }
    async getTimeLeft() {
        const currentContest = await this.prisma.contest.findFirst({
            where: { status: client_1.ContestStatus.ACTIVE },
        });
        if (!currentContest || !currentContest.endTime) {
            return "No active contest";
        }
        const timeLeft = currentContest.endTime.getTime() - Date.now();
        if (timeLeft <= 0)
            return "Contest ending...";
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    async getQualifiedUsersCount() {
        const currentContest = await this.prisma.contest.findFirst({
            where: { status: client_1.ContestStatus.ACTIVE },
            include: {
                entries: true,
            },
        });
        if (!currentContest)
            return 0;
        return currentContest.entries.filter((entry) => entry.points >= ConfigManager_1.configManager.getContestConfig().minPointsToQualify).length;
    }
    async getTopParticipants() {
        const currentContest = await this.prisma.contest.findFirst({
            where: { status: client_1.ContestStatus.ACTIVE },
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
        if (!currentContest)
            return [];
        return currentContest.entries.map((entry) => ({
            username: entry.user.telegramUsername ??
                entry.user.discordUsername ??
                entry.user.twitterUsername ??
                "Unknown",
            points: entry.points ?? 0,
        }));
    }
}
exports.RewardManager = RewardManager;
// Export singleton instance
exports.default = RewardManager.getInstance();
