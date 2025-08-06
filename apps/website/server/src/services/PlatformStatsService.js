"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformStatsService = exports.PlatformStatsService = void 0;
const client_1 = require("@prisma/client");
const types_1 = require("../types");
class PlatformStatsService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!PlatformStatsService.instance) {
            PlatformStatsService.instance = new PlatformStatsService();
        }
        return PlatformStatsService.instance;
    }
    async getPlatformStats(platform, userId) {
        const [points, engagements] = await Promise.all([
            this.prisma.pointTransaction.aggregate({
                where: {
                    userId,
                    platform
                },
                _sum: {
                    amount: true
                }
            }),
            this.prisma.engagement.count({
                where: {
                    userId,
                    platform,
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        return {
            points: points._sum.amount || 0,
            engagements,
        };
    }
    async getGlobalRank(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });
        if (!user)
            return 0;
        const higherRanked = await this.prisma.user.count({
            where: {
                points: {
                    gt: user.points
                }
            }
        });
        return higherRanked + 1;
    }
    async getMultiPlatformStats(userId) {
        const [telegramStats, discordStats, twitterStats, recentActivity] = await Promise.all([
            this.getPlatformStats(types_1.Platform.TELEGRAM, userId),
            this.getPlatformStats(types_1.Platform.DISCORD, userId),
            this.getPlatformStats(types_1.Platform.TWITTER, userId),
            this.getRecentActivity(userId)
        ]);
        const totalPoints = telegramStats.points + discordStats.points + twitterStats.points;
        return {
            points: totalPoints,
            totalPoints,
            rank: await this.getGlobalRank(userId),
            platformStats: {
                [types_1.Platform.TELEGRAM]: telegramStats,
                [types_1.Platform.DISCORD]: discordStats,
                [types_1.Platform.TWITTER]: twitterStats
            },
            recentActivity
        };
    }
    async getRecentActivity(userId) {
        // Get recent engagements
        const activities = await this.prisma.engagement.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: 10,
            select: {
                timestamp: true,
                type: true,
                platform: true,
                metadata: true
            }
        });
        // Get corresponding point transactions for the same time period
        const points = await this.prisma.pointTransaction.findMany({
            where: {
                userId,
                timestamp: {
                    gte: activities[activities.length - 1]?.timestamp || new Date()
                }
            },
            select: {
                amount: true,
                platform: true,
                timestamp: true
            }
        });
        // Map points to activities based on timestamp and platform
        return activities.map(activity => {
            const matchingPoint = points.find(p => p.platform === activity.platform &&
                Math.abs(p.timestamp.getTime() - activity.timestamp.getTime()) < 1000);
            return {
                timestamp: activity.timestamp,
                type: activity.type,
                platform: activity.platform,
                points: matchingPoint?.amount || 0,
                metadata: typeof activity.metadata === 'object' ? activity.metadata : {}
            };
        });
    }
}
exports.PlatformStatsService = PlatformStatsService;
exports.platformStatsService = PlatformStatsService.getInstance();
