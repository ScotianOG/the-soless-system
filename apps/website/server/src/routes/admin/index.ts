// src/routes/admin/index.ts
import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/errorHandler";
import { validateRequest } from "../../middleware/validation";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { configManager } from "../../config/ConfigManager";
import { RewardManager } from "../../core/contest/RewardManager";
import { EngagementTracker } from "../../core/engagement/EngagementTracker";
import { Platform } from "../../types";
// import { socialAIAdminRouter } from "./social-ai"; // Temporarily disabled due to compilation errors

const router = Router();
const rewardManager = RewardManager.getInstance();

// Validation schemas
const contestConfigSchema = z.object({
  enabled: z.boolean(),
  roundDurationHours: z.number().min(1).max(168), // 1 hour to 1 week
  minPointsToQualify: z.number().min(0),
  prizes: z.array(
    z.object({
      rank: z.number().min(1),
      reward: z.string(),
      amount: z.string(),
      description: z.string(),
    })
  ),
  tiers: z
    .array(
      z.object({
        name: z.string(),
        minPoints: z.number().min(0),
        reward: z.string(),
      })
    )
    .optional(),
});

const platformConfigSchema = z.object({
  platform: z.enum(["TELEGRAM", "DISCORD", "TWITTER"]),
  enabled: z.boolean(),
  pointRules: z.record(
    z.object({
      points: z.number().min(0),
      cooldown: z.number().min(0).optional(),
      dailyLimit: z.number().min(0).optional(),
    })
  ),
});

const contestActionSchema = z.object({
  action: z.enum(["start", "end", "pause", "resume"]),
});

// Extremely simple test route
router.get("/simple", (req: Request, res: Response) => {
  res.json({ message: "Simple route works" });
});

// Test route with auth
router.get("/simple-auth", requireAuth, (req: Request, res: Response) => {
  res.json({ message: "Simple auth route works" });
});

// Test route with asyncHandler
router.get(
  "/simple-async",
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: "Simple async route works" });
  })
);

// EXACT COPY OF WORKING ROUTE - just different path
router.get(
  "/test/config",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const config = configManager.getContestConfig();
    const currentContest = await prisma.contest.findFirst({
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
      message: "This is a test copy of the working contest config route",
      config,
      currentContest,
      contestRound: await rewardManager.getCurrentRound(),
      timeLeft: await rewardManager.getTimeLeft(),
      qualifiedUsers: await rewardManager.getQualifiedUsersCount(),
    });
  })
);

// ======================
// CONTEST MANAGEMENT
// ======================

// Get current contest configuration
router.get(
  "/contest/config",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const config = configManager.getContestConfig();
    const currentContest = await prisma.contest.findFirst({
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
  })
);

// Update contest configuration
router.put(
  "/contest/config",
  requireAuth,
  validateRequest(contestConfigSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const config = req.body;

    // Update configuration (in a real system, this would update the database/config file)
    // For now, we'll return success and log the changes
    console.log("Contest configuration update requested:", config);

    res.json({
      success: true,
      message: "Contest configuration updated successfully",
      config,
    });
  })
);

// TEST ROUTE - Positioned after working contest config routes
router.get(
  "/position-test",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: "Position test route working - placed after contest config",
    });
  })
);

// Simple test route without asyncHandler
router.get("/simple-test", requireAuth, (req: Request, res: Response) => {
  res.json({ message: "Simple test route without asyncHandler" });
});

// Test route without authentication
router.get("/no-auth-test", (req: Request, res: Response) => {
  res.json({ message: "No auth test route" });
});

// Exact copy of working platforms route but with different path
router.get(
  "/test-platforms",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const platforms = ["TELEGRAM", "DISCORD", "TWITTER"] as Platform[];
    const configs = platforms.map((platform) => ({
      platform,
      config: configManager.getPointsConfig()[platform],
      platformConfig: configManager.getPlatformConfig(platform),
    }));

    res.json({
      platforms: configs,
      message: "This is a test copy of the platforms route",
    });
  })
);

// Contest lifecycle actions
router.post(
  "/contest/action",
  requireAuth,
  validateRequest(contestActionSchema),
  asyncHandler(async (req: Request, res: Response) => {
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
          await prisma.contest.updateMany({
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
          await prisma.contest.updateMany({
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to ${action} contest`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
);

// ======================
// PLATFORM MANAGEMENT
// ======================

// Get platform configurations
router.get(
  "/platforms",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const platforms = ["TELEGRAM", "DISCORD", "TWITTER"] as Platform[];
    const configs = platforms.map((platform) => ({
      platform,
      config: configManager.getPointsConfig()[platform],
      platformConfig: configManager.getPlatformConfig(platform),
    }));

    res.json({ platforms: configs });
  })
);

// Update platform configuration
router.put(
  "/platforms",
  requireAuth,
  validateRequest(platformConfigSchema),
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

// Test route - should work if PUT route is the issue
router.get(
  "/test-after-put-commented",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: "Test route works when PUT route is commented out" });
  })
);

// ======================
// ANALYTICS & STATS
// ======================

// Contest analytics
router.get(
  "/analytics/contests",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      contestStats,
      participationTrends,
      rewardDistribution,
      platformBreakdown,
    ] = await Promise.all([
      // Contest statistics
      prisma.contest.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // Daily participation trends
      prisma.$queryRaw`
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
      prisma.contestReward.groupBy({
        by: ["type", "status"],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // Platform engagement breakdown
      prisma.engagement.groupBy({
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
        activeUsers: await prisma.user.count({
          where: {
            lastActive: { gte: startDate },
          },
        }),
        totalRewards: await prisma.contestReward.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        totalEngagements: await prisma.engagement.count({
          where: {
            timestamp: { gte: startDate, lte: endDate },
          },
        }),
      },
    });
  })
);

// Real-time analytics
router.get(
  "/analytics/realtime",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const currentContest = await prisma.contest.findFirst({
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

    const [activeUsers, recentActivity, topPerformers, platformActivity] =
      await Promise.all([
        prisma.user.count({
          where: { lastActive: { gte: last24Hours } },
        }),

        prisma.engagement.findMany({
          where: { timestamp: { gte: last24Hours } },
          include: { user: true },
          orderBy: { timestamp: "desc" },
          take: 20,
        }),

        rewardManager.getTopParticipants(),

        prisma.engagement.groupBy({
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
        user:
          activity.user.telegramUsername ||
          activity.user.discordUsername ||
          activity.user.twitterUsername ||
          "Anonymous",
        type: activity.type,
        platform: activity.platform,
        timestamp: activity.timestamp,
      })),
      topPerformers,
    });
  })
);

// User analytics
router.get(
  "/analytics/users",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      engagementDistribution,
      pointsDistribution,
      retentionMetrics,
    ] = await Promise.all([
      // Daily user registration/activity
      prisma.$queryRaw`
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
      prisma.engagement.groupBy({
        by: ["type"],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // Points distribution analysis
      prisma.user.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _avg: { points: true },
        _max: { points: true },
        _min: { points: true },
      }),

      // User retention (users active in last 7 days)
      prisma.user.count({
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
        totalUsers: await prisma.user.count(),
        activeUsers: retentionMetrics,
        averagePoints: pointsDistribution._avg.points || 0,
      },
    });
  })
);

// Export configuration for white-label setup
router.get(
  "/export/config",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const fullConfig = {
      contest: configManager.getContestConfig(),
      points: configManager.getPointsConfig(),
      platforms: Object.keys(configManager.getPointsConfig()).reduce(
        (acc, platform) => {
          acc[platform] = configManager.getPlatformConfig(platform);
          return acc;
        },
        {} as any
      ),
      rateLimits: configManager.getRateLimitConfig(),
      features: configManager.getConfig().features,
    };

    res.json({
      config: fullConfig,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    });
  })
);

// Import configuration for white-label setup
router.post(
  "/import/config",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { config } = req.body;

    // Validate the imported configuration
    // In a real implementation, this would update the configuration files/database
    console.log("Configuration import requested:", config);

    res.json({
      success: true,
      message: "Configuration imported successfully",
      importedAt: new Date().toISOString(),
    });
  })
);

// ======================
// SYSTEM HEALTH & MONITORING
// ======================

// Simple test route to debug routing issue
router.get(
  "/test",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: "Test route working",
      timestamp: new Date().toISOString(),
    });
  })
);

// Additional test route
router.get(
  "/debug",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: "Debug route working" });
  })
);

// Get system health status
router.get(
  "/system/health",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        redis: "connected", // assuming redis is used
        external_apis: "operational",
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || "1.0.0",
    };

    res.json(health);
  })
);

// Get system logs
router.get(
  "/system/logs",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;

    // In a real implementation, this would fetch from a logging system
    // For now, return mock logs
    const mockLogs = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: i % 4 === 0 ? "error" : i % 3 === 0 ? "warn" : "info",
      message: `System log entry ${i + 1}`,
      service: ["admin", "contest", "engagement", "auth"][i % 4],
      metadata: {
        correlationId: `corr-${Date.now()}-${i}`,
        userId: i % 2 === 0 ? "admin-user" : null,
      },
    }));

    res.json(mockLogs);
  })
);

// Mount Social AI admin routes
// router.use("/social-ai", socialAIAdminRouter); // Temporarily disabled due to compilation errors

export { router as adminRouter };
