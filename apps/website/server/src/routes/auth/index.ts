import { Router, Request, Response } from "express";
import { authenticateUser } from "../../middleware/auth";
import { twitterAuthRouter } from "./twitter";
import { discordAuthRouter } from "./discord";
import adminAuthRouter from "./admin";
import { asyncHandler } from "../../middleware/errorHandler";

const router = Router();

// Verify wallet authentication
router.post(
  "/verify",
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: "Authenticated successfully",
      correlationId: req.correlationId,
    });
  })
);

// Mount platform-specific auth routes
router.use("/twitter", twitterAuthRouter);
router.use("/discord", discordAuthRouter);

// Mount admin auth routes
router.use("/", adminAuthRouter);

export const authRouter = router;
