"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../../lib/prisma");
const ConfigManager_1 = require("../../config/ConfigManager");
const errorHandler_1 = require("../../middleware/errorHandler");
const validation_1 = require("../../middleware/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Validation schemas
const recentActivityQuerySchema = zod_1.z.object({
    limit: zod_1.z
        .string()
        .transform(Number)
        .pipe(zod_1.z.number().int().min(1).max(100))
        .optional()
        .default("10"),
    offset: zod_1.z
        .string()
        .transform(Number)
        .pipe(zod_1.z.number().int().min(0))
        .optional()
        .default("0"),
});
router.get("/recent", (0, validation_1.validateRequest)(recentActivityQuerySchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit, offset } = req.query;
    // Fetch recent activity from engagement table
    const recentActivity = await prisma_1.prisma.engagement.findMany({
        take: limit,
        skip: offset,
        orderBy: { timestamp: "desc" },
        include: {
            user: {
                select: {
                    telegramUsername: true,
                    discordUsername: true,
                    twitterUsername: true,
                },
            },
        },
    });
    // Transform to the format expected by the frontend
    const formattedActivity = recentActivity.map((activity) => ({
        id: activity.id,
        userId: activity.userId,
        username: activity.user.telegramUsername ||
            activity.user.discordUsername ||
            activity.user.twitterUsername ||
            "Anonymous",
        action: activity.type,
        platform: activity.platform,
        points: getPointsForActivity(activity.type, activity.platform),
        timestamp: formatTimeAgo(activity.timestamp),
    }));
    res.json(formattedActivity);
}));
function formatTimeAgo(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    if (diffMinutes < 1)
        return "just now";
    if (diffMinutes < 60)
        return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24)
        return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}
function getPointsForActivity(type, platform) {
    const platformConfig = ConfigManager_1.configManager.getPlatformConfig(platform);
    if (!platformConfig)
        return 1;
    const actionConfig = platformConfig[type];
    return actionConfig?.points || 1;
}
exports.activityRouter = router;
