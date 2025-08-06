"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
// src/routes/stats/index.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const logger_1 = require("../../utils/logger");
const getUserStats_1 = require("./getUserStats");
const getGlobalRank_1 = require("./getGlobalRank");
const getLeaderboard_1 = require("./getLeaderboard");
const getGlobalStats_1 = require("./getGlobalStats");
const getTimeSeriesStats_1 = require("./getTimeSeriesStats");
const getActionBreakdown_1 = require("./getActionBreakdown");
const VALID_TIMEFRAMES = ["all", "daily", "weekly", "monthly"];
const VALID_PLATFORMS = ["TELEGRAM", "DISCORD", "TWITTER"];
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get user's stats - use optionalAuth to allow new users
router.get("/:wallet", auth_1.optionalAuth, async (req, res) => {
    try {
        const stats = await (0, getUserStats_1.getUserStats)(prisma, req.params.wallet);
        res.json(stats);
    }
    catch (error) {
        // For new users, return empty stats
        if (error instanceof Error && error.message.includes("not found")) {
            res.json({
                points: 0,
                lifetimePoints: 0,
                rank: null,
                platforms: {
                    telegram: false,
                    discord: false,
                    twitter: false,
                },
            });
            return;
        }
        logger_1.logger.error("Error fetching user stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
// Get global rank - use optionalAuth to allow new users
router.get("/:wallet/rank", auth_1.optionalAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { wallet: req.params.wallet },
        });
        // For new users, return null rank
        if (!user) {
            res.json({ rank: null });
            return;
        }
        const rank = await (0, getGlobalRank_1.getGlobalRank)(prisma, user.id);
        res.json({ rank });
    }
    catch (error) {
        logger_1.logger.error("Error fetching global rank:", error);
        res.status(500).json({ error: "Failed to fetch rank" });
    }
});
// Get leaderboard
router.get("/leaderboard", async (req, res) => {
    try {
        const { platform, limit = "100", timeframe = "all" } = req.query;
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            res.status(400).json({ error: "Invalid limit value" });
            return;
        }
        if (platform) {
            const upperPlatform = platform.toUpperCase();
            if (!VALID_PLATFORMS.includes(upperPlatform)) {
                res.status(400).json({ error: "Invalid platform" });
                return;
            }
        }
        if (!VALID_TIMEFRAMES.includes(timeframe)) {
            res.status(400).json({ error: "Invalid timeframe" });
            return;
        }
        const leaderboard = await (0, getLeaderboard_1.getLeaderboard)(prisma, {
            platform: platform ? platform.toUpperCase() : undefined,
            limit: parsedLimit,
            timeframe: timeframe,
        });
        res.json({ leaderboard });
    }
    catch (error) {
        logger_1.logger.error("Error fetching leaderboard:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});
// Get platform-specific leaderboard
router.get("/leaderboard/:platform", async (req, res) => {
    try {
        const { limit = "100", timeframe = "all" } = req.query;
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            res.status(400).json({ error: "Invalid limit value" });
            return;
        }
        const platform = req.params.platform.toUpperCase();
        if (!VALID_PLATFORMS.includes(platform)) {
            res.status(400).json({ error: "Invalid platform" });
            return;
        }
        if (!VALID_TIMEFRAMES.includes(timeframe)) {
            res.status(400).json({ error: "Invalid timeframe" });
            return;
        }
        const leaderboard = await (0, getLeaderboard_1.getLeaderboard)(prisma, {
            platform,
            limit: parsedLimit,
            timeframe: timeframe,
        });
        res.json({ leaderboard });
    }
    catch (error) {
        logger_1.logger.error("Error fetching platform leaderboard:", error);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});
// Get global stats for admin dashboard
router.get("/global", auth_1.requireAuth, async (req, res) => {
    try {
        const stats = await (0, getGlobalStats_1.getGlobalStats)(prisma);
        res.json(stats);
    }
    catch (error) {
        logger_1.logger.error("Error fetching global stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Get time series stats for analytics dashboard
router.get("/timeseries", auth_1.requireAuth, async (req, res) => {
    try {
        const timeframe = req.query.timeframe || "WEEK";
        const stats = await (0, getTimeSeriesStats_1.getTimeSeriesStats)(prisma, timeframe);
        res.json({ data: stats });
    }
    catch (error) {
        logger_1.logger.error("Error fetching time series stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Get action breakdown for analytics dashboard
router.get("/actions", auth_1.requireAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days || "7", 10);
        const actions = await (0, getActionBreakdown_1.getActionBreakdown)(prisma, days);
        res.json({ actions });
    }
    catch (error) {
        logger_1.logger.error("Error fetching action breakdown:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.statsRouter = router;
