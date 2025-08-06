"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointManager = void 0;
const prisma_1 = require("../../lib/prisma");
const client_1 = require("@prisma/client");
class PointManager {
    constructor() {
        this.prismaClient = prisma_1.prisma;
    }
    static getInstance() {
        if (!PointManager.instance) {
            PointManager.instance = new PointManager();
        }
        return PointManager.instance;
    }
    // For testing purposes
    setPrismaClient(client) {
        this.prismaClient = client;
    }
    async processEngagement(event) {
        try {
            const { userId, platform, points, metadata, timestamp } = event;
            // Validate inputs
            if (!userId || !platform || points <= 0 || !timestamp) {
                return false;
            }
            // Validate platform
            if (!Object.values(client_1.Platform).includes(platform)) {
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
                        where: { status: client_1.ContestStatus.ACTIVE },
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
                }
                catch (error) {
                    // If engagement creation fails due to unique constraint, return false
                    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                        error.code === "P2002") {
                        return false;
                    }
                    throw error;
                }
            });
        }
        catch (error) {
            console.error("Error processing engagement:", error instanceof Error ? error.message : String(error));
            return false;
        }
    }
    async getUserContestStats(userId) {
        const userContests = await this.prismaClient.contestEntry.findMany({
            where: { userId },
            include: { contest: true },
            orderBy: { contest: { endTime: "desc" } },
        });
        const totalContests = userContests.length;
        const totalPoints = userContests.reduce((sum, entry) => sum + entry.points, 0);
        const bestRank = userContests.length > 0
            ? Math.min(...userContests.map((entry) => entry.rank ?? Number.MAX_VALUE))
            : 0;
        const contestHistory = userContests.map((entry) => ({
            contestId: entry.contest.id,
            rank: entry.rank,
            points: entry.points,
        }));
        return {
            totalContests,
            totalPoints,
            bestRank,
            contestHistory,
        };
    }
    async getLeaderboard({ platform, limit, }) {
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
exports.PointManager = PointManager;
