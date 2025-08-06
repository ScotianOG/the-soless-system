// Social AI Admin API Routes
// Integrates with existing admin infrastructure for controlling the Social AI system

import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/errorHandler";
import { validateRequest } from "../../middleware/validation";
import { z } from "zod";
import { SocialAIManager } from "../../core/social-ai/SocialAIManager";
import { prisma } from "../../lib/prisma";

const router = Router();

// Validation schemas
const socialAIConfigSchema = z.object({
  enabled: z.boolean(),
  postingSchedule: z.object({
    enabled: z.boolean(),
    intervals: z.object({
      min: z.number().min(30), // 30 minutes minimum
      max: z.number().max(1440), // 24 hours maximum
    }),
    activeHours: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23),
    }),
  }),
  engagement: z.object({
    enabled: z.boolean(),
    maxRepliesPerHour: z.number().min(0).max(50),
    keywords: z.array(z.string()),
    sentiment: z.object({
      minScore: z.number().min(-1).max(1),
      maxScore: z.number().min(-1).max(1),
    }),
  }),
  platforms: z.object({
    twitter: z.object({
      enabled: z.boolean(),
      maxTweetsPerDay: z.number().min(0).max(100),
      maxRepliesPerDay: z.number().min(0).max(200),
    }),
    // Future platforms
    discord: z
      .object({
        enabled: z.boolean(),
      })
      .optional(),
    telegram: z
      .object({
        enabled: z.boolean(),
      })
      .optional(),
  }),
});

const contentTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  category: z.string(),
  template: z.string().min(1),
  variables: z.array(z.string()),
  tags: z.array(z.string()),
  enabled: z.boolean(),
});

// GET /admin/social-ai/status
router.get(
  "/status",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const manager = SocialAIManager.getInstance();
    const status = await manager.getSystemStatus();

    res.json({
      success: true,
      data: status,
    });
  })
);

// GET /admin/social-ai/config
router.get(
  "/config",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const config = await prisma.socialAIConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: config || {
        enabled: false,
        postingSchedule: {
          enabled: false,
          intervals: { min: 120, max: 360 },
          activeHours: { start: 9, end: 17 },
        },
        engagement: {
          enabled: false,
          maxRepliesPerHour: 10,
          keywords: ["SOLess", "DeFi", "Solana"],
          sentiment: { minScore: 0.2, maxScore: 1.0 },
        },
        platforms: {
          twitter: {
            enabled: false,
            maxTweetsPerDay: 20,
            maxRepliesPerDay: 50,
          },
        },
      },
    });
  })
);

// PUT /admin/social-ai/config
router.put(
  "/config",
  requireAuth,
  validateRequest(socialAIConfigSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const config = req.body;

    // Save config to database
    const savedConfig = await prisma.socialAIConfig.create({
      data: {
        ...config,
        updatedBy: req.user?.id || "admin",
      },
    });

    // Apply config to running system
    const manager = SocialAIManager.getInstance();
    await manager.updateConfig(config);

    res.json({
      success: true,
      data: savedConfig,
    });
  })
);

// POST /admin/social-ai/control/:action
router.post(
  "/control/:action",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { action } = req.params;
    const manager = SocialAIManager.getInstance();

    let result;
    switch (action) {
      case "start":
        result = await manager.start();
        break;
      case "stop":
        result = await manager.stop();
        break;
      case "pause":
        result = await manager.pause();
        break;
      case "resume":
        result = await manager.resume();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid action: ${action}`,
        });
    }

    // Log admin action
    await prisma.socialAIActivity.create({
      data: {
        type: "ADMIN_ACTION",
        action: action.toUpperCase(),
        metadata: {
          adminId: req.user?.id || "admin",
          timestamp: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /admin/social-ai/analytics
router.get(
  "/analytics",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { timeframe = "24h" } = req.query;

    const timeframes = {
      "1h": new Date(Date.now() - 60 * 60 * 1000),
      "24h": new Date(Date.now() - 24 * 60 * 60 * 1000),
      "7d": new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      "30d": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    const since =
      timeframes[timeframe as keyof typeof timeframes] || timeframes["24h"];

    // Get analytics from database
    const [posts, replies, mentions, errors] = await Promise.all([
      prisma.socialAIActivity.count({
        where: {
          type: "POST_CREATED",
          createdAt: { gte: since },
        },
      }),
      prisma.socialAIActivity.count({
        where: {
          type: "REPLY_SENT",
          createdAt: { gte: since },
        },
      }),
      prisma.socialAIActivity.count({
        where: {
          type: "MENTION_DETECTED",
          createdAt: { gte: since },
        },
      }),
      prisma.socialAIActivity.count({
        where: {
          type: "ERROR",
          createdAt: { gte: since },
        },
      }),
    ]);

    // Get trending topics
    const trendingTopics = await prisma.socialAITrendingTopic.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: {
        score: "desc",
      },
      take: 10,
    });

    // Get recent activity
    const recentActivity = await prisma.socialAIActivity.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        summary: {
          postsCreated: posts,
          repliesSent: replies,
          mentionsDetected: mentions,
          errors: errors,
        },
        trendingTopics,
        recentActivity,
      },
    });
  })
);

// GET /admin/social-ai/templates
router.get(
  "/templates",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const templates = await prisma.socialAIContentTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: templates,
    });
  })
);

// POST /admin/social-ai/templates
router.post(
  "/templates",
  requireAuth,
  validateRequest(contentTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const template = await prisma.socialAIContentTemplate.create({
      data: {
        ...req.body,
        createdBy: req.user?.id || "admin",
      },
    });

    res.json({
      success: true,
      data: template,
    });
  })
);

// PUT /admin/social-ai/templates/:id
router.put(
  "/templates/:id",
  requireAuth,
  validateRequest(contentTemplateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const template = await prisma.socialAIContentTemplate.update({
      where: { id },
      data: {
        ...req.body,
        updatedBy: req.user?.id || "admin",
      },
    });

    res.json({
      success: true,
      data: template,
    });
  })
);

// DELETE /admin/social-ai/templates/:id
router.delete(
  "/templates/:id",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.socialAIContentTemplate.delete({
      where: { id },
    });

    res.json({
      success: true,
    });
  })
);

// POST /admin/social-ai/test-post
router.post(
  "/test-post",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { content, platform = "twitter" } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required",
      });
    }

    const manager = SocialAIManager.getInstance();
    const result = await manager.createTestPost(content, platform);

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /admin/social-ai/queue
router.get(
  "/queue",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const queue = await prisma.socialAIContentQueue.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        scheduledFor: "asc",
      },
      take: 50,
    });

    res.json({
      success: true,
      data: queue,
    });
  })
);

// DELETE /admin/social-ai/queue/:id
router.delete(
  "/queue/:id",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.socialAIContentQueue.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledBy: req.user?.id || "admin",
      },
    });

    res.json({
      success: true,
    });
  })
);

export { router as socialAIAdminRouter };
