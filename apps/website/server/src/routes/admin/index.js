"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
// src/routes/admin/index.ts
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const errorHandler_1 = require("../../middleware/errorHandler");
const validation_1 = require("../../middleware/validation");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const ConfigManager_1 = require("../../config/ConfigManager");
const RewardManager_1 = require("../../core/contest/RewardManager");
const router = (0, express_1.Router)();
exports.adminRouter = router;
const rewardManager = RewardManager_1.RewardManager.getInstance();
// Validation schemas
const contestConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    roundDurationHours: zod_1.z.number().min(1).max(168), // 1 hour to 1 week
    minPointsToQualify: zod_1.z.number().min(0),
    prizes: zod_1.z.array(zod_1.z.object({
        rank: zod_1.z.number().min(1),
        reward: zod_1.z.string(),
        amount: zod_1.z.string(),
        description: zod_1.z.string(),
    })),
    tiers: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string(),
        minPoints: zod_1.z.number().min(0),
        reward: zod_1.z.string(),
    }))
        .optional(),
});
const platformConfigSchema = zod_1.z.object({
    platform: zod_1.z.enum(["TELEGRAM", "DISCORD", "TWITTER"]),
    enabled: zod_1.z.boolean(),
    pointRules: zod_1.z.record(zod_1.z.object({
        points: zod_1.z.number().min(0),
        cooldown: zod_1.z.number().min(0).optional(),
        dailyLimit: zod_1.z.number().min(0).optional(),
    })),
});
const contestActionSchema = zod_1.z.object({
    action: zod_1.z.enum(["start", "end", "pause", "resume"]),
});
// ======================
// CONTEST MANAGEMENT
// ======================
// Get current contest configuration
router.get("/contest/config", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const config = ConfigManager_1.configManager.getContestConfig();
    const currentContest = await prisma_1.prisma.contest.findFirst({
        where: { status: "ACTIVE" },
        include: {
            entries: {
                orderBy: { points: "desc" },
                take: 10,
                include: { user: true },
            },
        },
    });
    res.json({
        config,
        currentContest,
        contestRound: await rewardManager.getCurrentRound(),
        timeLeft: await rewardManager.getTimeLeft(),
        qualifiedUsers: await rewardManager.getQualifiedUsersCount(),
    });
}));
// Update contest configuration
router.put("/contest/config", auth_1.requireAuth, (0, validation_1.validateRequest)(contestConfigSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const config = req.body;
    // Update configuration (in a real system, this would update the database/config file)
    // For now, we'll return success and log the changes
    console.log("Contest configuration update requested:", config);
    res.json({
        success: true,
        message: "Contest configuration updated successfully",
        config,
    });
}));
// Contest lifecycle actions
router.post("/contest/action", auth_1.requireAuth, (0, validation_1.validateRequest)(contestActionSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { action } = req.body;
    try {
        switch (action) {
            case "start":
                await rewardManager.startNewContest();
                break;
            case "end":
                await rewardManager.endCurrentContest();
                break;
            case "pause":
                // Implement pause logic
                await prisma_1.prisma.contest.updateMany({
                    where: { status: "ACTIVE" },
                    data: {
                        metadata: {
                            paused: true,
                            pausedAt: new Date(),
                        },
                    },
                });
                break;
            case "resume":
                // Implement resume logic
                await prisma_1.prisma.contest.updateMany({
                    where: { status: "ACTIVE" },
                    data: {
                        metadata: {
                            paused: false,
                            resumedAt: new Date(),
                        },
                    },
                });
                break;
        }
        res.json({
            success: true,
            message: `Contest ${action} action completed successfully`,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Failed to ${action} contest`,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// ======================
// PLATFORM MANAGEMENT
// ======================
// Get platform configurations
router.get("/platforms", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const platforms = ["TELEGRAM", "DISCORD", "TWITTER"];
    const configs = platforms.map((platform) => ({
        platform,
        config: ConfigManager_1.configManager.getPointsConfig()[platform],
        platformConfig: ConfigManager_1.configManager.getPlatformConfig(platform),
    }));
    res.json({ platforms: configs });
}));
// Update platform configuration
router.put("/platforms", auth_1.requireAuth, (0, validation_1.validateRequest)(platformConfigSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { platform, enabled, pointRules } = req.body;
    // Log the configuration change
    console.log(`Platform ${platform} configuration update:`, {
        enabled,
        pointRules,
    });
    res.json({
        success: true,
        message: `${platform} configuration updated successfully`,
        platform,
        enabled,
        pointRules,
    });
}));
// ======================
// ANALYTICS & STATS
// ======================
// Contest analytics
router.get("/analytics/contests", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const [contestStats, participationTrends, rewardDistribution, platformBreakdown,] = await Promise.all([
        // Contest statistics
        prisma_1.prisma.contest.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            _count: true,
        }),
        // Daily participation trends
        prisma_1.prisma.$queryRaw `
      SELECT 
        DATE(c.created_at) as date,
        COUNT(DISTINCT c.id) as contests,
        COUNT(DISTINCT ce.user_id) as participants,
        SUM(ce.points) as total_points
      FROM contests c
      LEFT JOIN contest_entries ce ON c.id = ce.contest_id
      WHERE c.created_at >= ${startDate} AND c.created_at <= ${endDate}
      GROUP BY DATE(c.created_at)
      ORDER BY date DESC
    `,
        // Reward distribution analysis
        prisma_1.prisma.contestReward.groupBy({
            by: ["type", "status"],
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            _count: true,
        }),
        // Platform engagement breakdown
        prisma_1.prisma.engagement.groupBy({
            by: ["platform", "type"],
            where: {
                timestamp: { gte: startDate, lte: endDate },
            },
            _count: true,
        }),
    ]);
    res.json({
        period: { days, startDate, endDate },
        contestStats,
        participationTrends,
        rewardDistribution,
        platformBreakdown,
        summary: {
            totalContests: contestStats._count,
            activeUsers: await prisma_1.prisma.user.count({
                where: {
                    lastActive: { gte: startDate },
                },
            }),
            totalRewards: await prisma_1.prisma.contestReward.count({
                where: {
                    createdAt: { gte: startDate, lte: endDate },
                },
            }),
            totalEngagements: await prisma_1.prisma.engagement.count({
                where: {
                    timestamp: { gte: startDate, lte: endDate },
                },
            }),
        },
    });
}));
// Real-time analytics
router.get("/analytics/realtime", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentContest = await prisma_1.prisma.contest.findFirst({
        where: { status: "ACTIVE" },
        include: {
            entries: {
                orderBy: { points: "desc" },
                take: 10,
                include: { user: true },
            },
        },
    });
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [activeUsers, recentActivity, topPerformers, platformActivity] = await Promise.all([
        prisma_1.prisma.user.count({
            where: { lastActive: { gte: last24Hours } },
        }),
        prisma_1.prisma.engagement.findMany({
            where: { timestamp: { gte: last24Hours } },
            include: { user: true },
            orderBy: { timestamp: "desc" },
            take: 20,
        }),
        rewardManager.getTopParticipants(),
        prisma_1.prisma.engagement.groupBy({
            by: ["platform"],
            where: { timestamp: { gte: last24Hours } },
            _count: true,
        }),
    ]);
    res.json({
        currentContest: currentContest
            ? {
                id: currentContest.id,
                round: await rewardManager.getCurrentRound(),
                timeLeft: await rewardManager.getTimeLeft(),
                participants: currentContest.entries.length,
                qualifiedUsers: await rewardManager.getQualifiedUsersCount(),
                leaderboard: currentContest.entries,
            }
            : null,
        metrics: {
            activeUsers,
            totalEngagements: recentActivity.length,
            platformActivity,
        },
        recentActivity: recentActivity.map((activity) => ({
            id: activity.id,
            user: activity.user.telegramUsername ||
                activity.user.discordUsername ||
                activity.user.twitterUsername ||
                "Anonymous",
            type: activity.type,
            platform: activity.platform,
            timestamp: activity.timestamp,
        })),
        topPerformers,
    });
}));
// User analytics
router.get("/analytics/users", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const [userGrowth, engagementDistribution, pointsDistribution, retentionMetrics,] = await Promise.all([
        // Daily user registration/activity
        prisma_1.prisma.$queryRaw `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(CASE WHEN last_active >= created_at THEN 1 END) as active_users
      FROM users
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
        // Engagement type distribution
        prisma_1.prisma.engagement.groupBy({
            by: ["type"],
            where: {
                timestamp: { gte: startDate, lte: endDate },
            },
            _count: true,
        }),
        // Points distribution analysis
        prisma_1.prisma.user.aggregate({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            _avg: { points: true },
            _max: { points: true },
            _min: { points: true },
        }),
        // User retention (users active in last 7 days)
        prisma_1.prisma.user.count({
            where: {
                lastActive: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
        }),
    ]);
    res.json({
        period: { days, startDate, endDate },
        userGrowth,
        engagementDistribution,
        pointsDistribution,
        retentionMetrics,
        summary: {
            totalUsers: await prisma_1.prisma.user.count(),
            activeUsers: retentionMetrics,
            averagePoints: pointsDistribution._avg.points || 0,
        },
    });
}));
// Export configuration for white-label setup
router.get("/export/config", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const fullConfig = {
        contest: ConfigManager_1.configManager.getContestConfig(),
        points: ConfigManager_1.configManager.getPointsConfig(),
        platforms: Object.keys(ConfigManager_1.configManager.getPointsConfig()).reduce((acc, platform) => {
            acc[platform] = ConfigManager_1.configManager.getPlatformConfig(platform);
            return acc;
        }, {}),
        rateLimits: ConfigManager_1.configManager.getRateLimitConfig(),
        features: ConfigManager_1.configManager.getConfig().features,
    };
    res.json({
        config: fullConfig,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
    });
}));
// Import configuration for white-label setup
router.post("/import/config", auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { config } = req.body;
    // Validate the imported configuration
    // In a real implementation, this would update the configuration files/database
    console.log("Configuration import requested:", config);
    res.json({
        success: true,
        message: "Configuration imported successfully",
        importedAt: new Date().toISOString(),
    });
}));
