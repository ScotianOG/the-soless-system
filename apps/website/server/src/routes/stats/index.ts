// src/routes/stats/index.ts
import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, optionalAuth } from "../../middleware/auth";
import { logger } from "../../utils/logger";
import { getUserStats } from "./getUserStats";
import { getGlobalRank } from "./getGlobalRank";
import { getLeaderboard } from "./getLeaderboard";
import { Platform, TimeFrame } from "./types";
import { getGlobalStats } from "./getGlobalStats";
import { getTimeSeriesStats } from "./getTimeSeriesStats";
import { getActionBreakdown } from "./getActionBreakdown";

interface WalletRequest extends Request {
  params: {
    wallet: string;
  };
}

interface LeaderboardRequest extends Request {
  query: {
    platform?: string;
    limit?: string;
    timeframe?: string;
  };
}

interface PlatformLeaderboardRequest extends Request {
  params: {
    platform: string;
  };
  query: {
    limit?: string;
    timeframe?: string;
  };
}

type TimeframeType = "all" | "daily" | "weekly" | "monthly";

const VALID_TIMEFRAMES: TimeframeType[] = ["all", "daily", "weekly", "monthly"];
const VALID_PLATFORMS: Platform[] = ["TELEGRAM", "DISCORD", "TWITTER"];

const router = Router();
const prisma = new PrismaClient();

// IMPORTANT: Specific routes must come BEFORE the catch-all /:wallet route

// Get global stats for admin dashboard
router.get(
  "/global",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await getGlobalStats(prisma);
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching global stats:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Get time series stats for analytics dashboard
router.get(
  "/timeseries",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const timeframe = (req.query.timeframe as TimeFrame) || "WEEK";
      const stats = await getTimeSeriesStats(prisma, timeframe);
      res.json({ data: stats });
    } catch (error) {
      logger.error("Error fetching time series stats:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Get action breakdown for analytics dashboard
router.get(
  "/actions",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseInt((req.query.days as string) || "7", 10);
      const actions = await getActionBreakdown(prisma, days);
      res.json({ actions });
    } catch (error) {
      logger.error("Error fetching action breakdown:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Get leaderboard
router.get(
  "/leaderboard",
  async (req: LeaderboardRequest, res: Response): Promise<void> => {
    try {
      const { platform, limit = "100", timeframe = "all" } = req.query;

      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        res.status(400).json({ error: "Invalid limit value" });
        return;
      }

      if (platform) {
        const upperPlatform = platform.toUpperCase() as Platform;
        if (!VALID_PLATFORMS.includes(upperPlatform)) {
          res.status(400).json({ error: "Invalid platform" });
          return;
        }
      }

      if (!VALID_TIMEFRAMES.includes(timeframe as TimeframeType)) {
        res.status(400).json({ error: "Invalid timeframe" });
        return;
      }

      const leaderboard = await getLeaderboard(prisma, {
        platform: platform ? (platform.toUpperCase() as Platform) : undefined,
        limit: parsedLimit,
        timeframe: timeframe as TimeframeType,
      });

      res.json({ leaderboard });
    } catch (error) {
      logger.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  }
);

// Get platform-specific leaderboard
router.get(
  "/leaderboard/:platform",
  async (req: PlatformLeaderboardRequest, res: Response): Promise<void> => {
    try {
      const { limit = "100", timeframe = "all" } = req.query;

      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        res.status(400).json({ error: "Invalid limit value" });
        return;
      }

      const platform = req.params.platform.toUpperCase() as Platform;
      if (!VALID_PLATFORMS.includes(platform)) {
        res.status(400).json({ error: "Invalid platform" });
        return;
      }

      if (!VALID_TIMEFRAMES.includes(timeframe as TimeframeType)) {
        res.status(400).json({ error: "Invalid timeframe" });
        return;
      }

      const leaderboard = await getLeaderboard(prisma, {
        platform,
        limit: parsedLimit,
        timeframe: timeframe as TimeframeType,
      });

      res.json({ leaderboard });
    } catch (error) {
      logger.error("Error fetching platform leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  }
);

// Get user's stats - use optionalAuth to allow new users (MUST BE LAST!)
router.get(
  "/:wallet",
  optionalAuth as RequestHandler,
  async (req: WalletRequest, res: Response): Promise<void> => {
    try {
      const stats = await getUserStats(prisma, req.params.wallet);
      res.json(stats);
    } catch (error) {
      // For new users, return empty stats with correct structure
      if (error instanceof Error && error.message.includes("not found")) {
        res.json({
          points: 0,
          totalPoints: 0,
          rank: 0,
          platforms: {
            telegram: { points: 0, interactions: 0, engagements: 0 },
            discord: { points: 0, interactions: 0, engagements: 0 },
            twitter: { points: 0, interactions: 0, engagements: 0 },
          },
          platformStats: {
            TELEGRAM: { points: 0, interactions: 0, engagements: 0 },
            DISCORD: { points: 0, interactions: 0, engagements: 0 },
            TWITTER: { points: 0, interactions: 0, engagements: 0 },
          },
          recentActivity: [],
        });
        return;
      }

      logger.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  }
);

// Get global rank - use optionalAuth to allow new users
router.get(
  "/:wallet/rank",
  optionalAuth as RequestHandler,
  async (req: WalletRequest, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { wallet: req.params.wallet },
      });

      // For new users, return null rank
      if (!user) {
        res.json({ rank: null });
        return;
      }

      const rank = await getGlobalRank(prisma, user.id);
      res.json({ rank });
    } catch (error) {
      logger.error("Error fetching global rank:", error);
      res.status(500).json({ error: "Failed to fetch rank" });
    }
  }
);

export const statsRouter = router;
