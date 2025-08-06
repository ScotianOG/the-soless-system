// src/routes/contests/index.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../middleware/auth";
import { errorHandler } from "../../middleware/errorHandler";
import { validateRequest } from "../../middleware/validation";
import { logger } from "../../utils/logger";
import { getCurrentContest } from "./getCurrentContest";
import { getContestEntries } from "./getContestEntries";
import { getContestLeaderboard } from "./getContestLeaderboard";
import { getContestRewards } from "./getContestRewards";
import { claimReward } from "./claimReward";
import { startContest } from "./startContest";
import { endContest } from "./endContest";
import { getAllContests } from "./getAllContests";
import { distributeRewards } from "./distributeRewards";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const walletSchema = z.object({
  wallet: z
    .string()
    .min(32)
    .max(44)
    .regex(/^[A-Za-z0-9]+$/),
});

const contestIdSchema = z.object({
  id: z.string().uuid(),
});

const claimRewardSchema = z.object({
  rewardId: z.string().uuid(),
});

const startContestSchema = z.object({
  name: z.string().min(1).max(100),
  endTime: z.string().datetime(),
  rules: z.object({}).optional(),
});

// Get all contests (admin only)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const contests = await getAllContests(prisma);
    res.json({ contests });
  } catch (error) {
    next(error);
  }
});

// Get current contest status
router.get("/current", async (req, res, next) => {
  try {
    const contest = await getCurrentContest(prisma);
    res.json({ contest });
  } catch (error) {
    next(error);
  }
});

// Get user's contest entries
router.get(
  "/entries/:wallet",
  requireAuth,
  validateRequest(walletSchema),
  async (req, res, next) => {
    try {
      const entries = await getContestEntries(prisma, req.params.wallet);
      res.json({ entries });
    } catch (error) {
      next(error);
    }
  }
);

// Get contest leaderboard
router.get(
  "/:id/leaderboard",
  validateRequest(contestIdSchema),
  async (req, res, next) => {
    try {
      const leaderboard = await getContestLeaderboard(prisma, req.params.id);
      res.json({ leaderboard });
    } catch (error) {
      next(error);
    }
  }
);

// Get contest rewards
router.get(
  "/rewards/:wallet",
  requireAuth,
  validateRequest(walletSchema),
  async (req, res, next) => {
    try {
      const rewards = await getContestRewards(prisma, req.params.wallet);
      res.json({ rewards });
    } catch (error) {
      next(error);
    }
  }
);

// Claim reward
router.post(
  "/rewards/claim",
  requireAuth,
  validateRequest(claimRewardSchema),
  async (req, res, next) => {
    try {
      const { rewardId } = req.body;
      const result = await claimReward(prisma, rewardId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Admin routes
router.post(
  "/start",
  requireAuth,
  validateRequest(startContestSchema),
  async (req, res, next) => {
    try {
      const { name, endTime, rules } = req.body;
      const contest = await startContest(prisma, { name, endTime, rules });
      res.json({ contest });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/end",
  requireAuth,
  validateRequest(contestIdSchema),
  async (req, res, next) => {
    try {
      const contest = await endContest(prisma, req.params.id);
      res.json({ contest });
    } catch (error) {
      next(error);
    }
  }
);

// Distribute rewards for a contest (admin only)
router.post(
  "/:id/distribute-rewards",
  requireAuth,
  validateRequest(contestIdSchema),
  async (req, res, next) => {
    try {
      const result = await distributeRewards(prisma, req.params.id);
      res.json({ result });
    } catch (error) {
      next(error);
    }
  }
);

// Apply error handler middleware
router.use(errorHandler);

export { router as contestRouter };
export default router;
