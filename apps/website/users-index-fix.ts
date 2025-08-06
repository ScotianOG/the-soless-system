// Fixed src/routes/users/index.ts
import { Router, Request, Response, RequestHandler } from "express";
import { getUser } from "./getUser";
import { updateStreak } from "./updateStreak";
import { validateRequest } from "../../middleware/validation";
import { CommonSchemas } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/errorHandler";
import { authenticateUser } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const router = Router();

// Validation schemas
const getUserParamsSchema = z.object({
  walletAddress: CommonSchemas.walletAddress,
});

const getUserBodySchema = z.object({
  wallet: CommonSchemas.walletAddress,
});

const updateStreakSchema = z.object({
  wallet: CommonSchemas.walletAddress,
  platform: z.enum(["TELEGRAM", "DISCORD", "TWITTER"]),
});

// Get user profile by wallet address (GET method)
router.get(
  "/:walletAddress",
  validateRequest(getUserParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    return getUser(req, res);
  })
);

// Get user profile by wallet address (POST method)
router.post(
  "/get",
  validateRequest(getUserBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { wallet } = req.body;
    req.params.walletAddress = wallet;
    return getUser(req, res);
  })
);

// Update user streak (POST method)
router.post(
  "/streaks/update",
  validateRequest(updateStreakSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { wallet, platform } = req.body;
      const streakData = await updateStreak(prisma, { wallet, platform });

      res.json({
        success: true,
        currentStreak:
          streakData[
            `${platform.toLowerCase()}Streak` as keyof typeof streakData
          ],
        lastUpdated: new Date().toISOString(),
        correlationId: req.correlationId,
      });
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          error: "User not found",
          correlationId: req.correlationId,
        });
      }
      throw error;
    }
  })
);

// Protected user profile endpoint (requires authentication)
router.get(
  "/profile",
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: "User profile endpoint",
      user: req.user,
      correlationId: req.correlationId,
    });
  })
);

// Export as named export to match other routers
export const usersRouter = router;
