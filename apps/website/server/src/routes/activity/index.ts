import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { configManager } from "../../config/ConfigManager";
import { Platform } from "@prisma/client";
import { EngagementType } from "../../core/types/engagement";
import { asyncHandler } from "../../middleware/errorHandler";
import { validateRequest } from "../../middleware/validation";
import { CommonSchemas } from "../../middleware/validation";
import { z } from "zod";

const router = Router();

// Validation schemas
const recentActivityQuerySchema = z.object({
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? Number(val) : val))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(10),
  offset: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? Number(val) : val))
    .pipe(z.number().int().min(0))
    .optional()
    .default(0),
});

router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    // Parse query parameters with defaults
    const limitParam = req.query.limit as string;
    const offsetParam = req.query.offset as string;

    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 100)
      : 10;
    const offset = offsetParam
      ? Math.max(parseInt(offsetParam, 10) || 0, 0)
      : 0;

    // Fetch recent activity from pointTransaction table (where real activity is tracked)
    const recentActivity = await prisma.pointTransaction.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: {
            telegramUsername: true,
            discordUsername: true,
            twitterUsername: true,
            wallet: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.pointTransaction.count();

    // Transform to the format expected by the frontend
    const formattedActivity = recentActivity.map((activity) => ({
      id: activity.id,
      userId: activity.userId,
      username:
        activity.user.telegramUsername ||
        activity.user.discordUsername ||
        activity.user.twitterUsername ||
        activity.user.wallet?.substring(0, 8) + "..." ||
        "Anonymous",
      action: activity.reason, // Use reason instead of type
      platform: activity.platform,
      points: activity.amount, // Use actual points awarded
      timestamp: formatTimeAgo(activity.timestamp),
    }));

    // Return structured response with metadata
    res.json({
      activities: formattedActivity,
      total: totalCount,
      limit: limit,
      offset: offset,
    });
  })
);

function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMinutes = Math.floor(
    (now.getTime() - activityTime.getTime()) / (1000 * 60)
  );

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getPointsForActivity(
  type: EngagementType,
  platform: Platform
): number {
  const platformConfig = configManager.getPlatformConfig(platform);
  if (!platformConfig) return 1;

  const actionConfig = platformConfig[type];
  return actionConfig?.points || 1;
}

export const activityRouter = router;
