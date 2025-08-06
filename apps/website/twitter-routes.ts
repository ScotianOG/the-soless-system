// src/routes/twitter/index.ts
import { Router, Request, Response } from "express";
import { asyncHandler } from "../../middleware/errorHandler";

const router = Router();

// Twitter feed endpoint - simple placeholder for now
router.get(
  "/feed",
  asyncHandler(async (req: Request, res: Response) => {
    // Return a simple feed response to prevent 404 errors
    res.json({
      success: true,
      feed: [],
      message: "Twitter feed endpoint - placeholder implementation",
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  })
);

// Twitter status endpoint
router.get(
  "/status",
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      enabled: false,
      message: "Twitter integration temporarily disabled",
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
    });
  })
);

export const twitterRouter = router;
