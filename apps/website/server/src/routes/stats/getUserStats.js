"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = getUserStats;
const getPlatformStats_1 = require("./getPlatformStats");
const getGlobalRank_1 = require("./getGlobalRank");
async function getRecentActivity(prisma, userId) {
    // First get the engagements
    const activities = await prisma.engagement.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 10,
    });
    // Then get the point transactions within a small time window of each engagement
    const pointTransactions = activities.length > 0
        ? await prisma.pointTransaction.findMany({
            where: {
                userId,
                platform: {
                    in: activities.map(a => a.platform)
                },
                timestamp: {
                    gte: activities[activities.length - 1].timestamp,
                    lte: activities[0].timestamp
                }
            }
        })
        : [];
    // Create a map of platform+timestamp to points for quick lookup
    const getPointKey = (platform, timestamp) => `${platform}-${timestamp.getTime()}`;
    const pointsByActivity = new Map(pointTransactions.map(pt => [
        getPointKey(pt.platform, pt.timestamp),
        pt.amount
    ]));
    return activities.map((activity) => ({
        timestamp: activity.timestamp,
        type: activity.type,
        platform: activity.platform,
        points: pointsByActivity.get(getPointKey(activity.platform, activity.timestamp)) || 0,
        metadata: activity.metadata ? activity.metadata : {},
    }));
}
async function getUserStats(prisma, wallet) {
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
    const [telegramStats, discordStats, twitterStats, recentActivity] = await Promise.all([
        (0, getPlatformStats_1.getPlatformStats)(prisma, "TELEGRAM", user.id),
        (0, getPlatformStats_1.getPlatformStats)(prisma, "DISCORD", user.id),
        (0, getPlatformStats_1.getPlatformStats)(prisma, "TWITTER", user.id),
        getRecentActivity(prisma, user.id),
    ]);
    const totalPoints = telegramStats.points + discordStats.points + twitterStats.points;
    return {
        points: totalPoints,
        totalPoints,
        rank: await (0, getGlobalRank_1.getGlobalRank)(prisma, user.id),
        platformStats: {
            TELEGRAM: telegramStats,
            DISCORD: discordStats,
            TWITTER: twitterStats,
        },
        recentActivity,
    };
}
