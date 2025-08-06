// Fixed src/routes/verifications/index.ts
import { Router, Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../utils/logger";
import { generateVerificationCode } from "./generateCode";
import { verifyCode } from "./verifyCode";
import { getVerificationStatus } from "./getStatus";
import { asyncHandler } from "../../middleware/errorHandler";

const router: Router = Router();
const prisma = new PrismaClient();

// Generate verification code
router.post(
  "/generate",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Log incoming request for debugging
      logger.debug("Generate code request:", {
        body: req.body,
        headers: {
          origin: req.headers.origin,
          "x-wallet-address": req.headers["x-wallet-address"],
        },
      });

      // Validate request body
      const { wallet, platform } = req.body;
      if (!wallet || !platform) {
        logger.warn("Invalid request body:", req.body);
        return res.status(400).json({
          error: "Missing required fields",
          details: {
            wallet: !wallet ? "Wallet address is required" : null,
            platform: !platform ? "Platform is required" : null,
          },
        });
      }

      const result = await generateVerificationCode(prisma, req.body);
      logger.info("Generated verification code for wallet:", wallet);
      res.json(result);
    } catch (error: unknown) {
      logger.error("Error generating verification code:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
        headers: {
          origin: req.headers.origin,
          "x-wallet-address": req.headers["x-wallet-address"],
        },
      });

      // Handle specific errors
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({
          error: "User not found",
          details:
            "Please ensure you are registered before requesting a verification code",
        });
      }

      // Handle already verified error
      if (
        error instanceof Error &&
        error.message.includes("already verified")
      ) {
        return res.status(400).json({
          error: "Already verified",
          details: error.message,
        });
      }

      res.status(500).json({
        error: "Failed to generate code",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  })
);

// Verify code and link platform account
router.post(
  "/verify",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await verifyCode(prisma, req.body);
      res.json(result);
    } catch (error: unknown) {
      logger.error("Error verifying code:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body,
      });
      res.status(500).json({
        error: "Verification failed",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  })
);

// General verification status endpoint
router.get(
  "/status",
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      enabled: true,
      supportedPlatforms: ["TELEGRAM", "DISCORD", "TWITTER"],
      message: "Verification system is operational",
      correlationId: req.correlationId,
    });
  })
);

// Check verification status for specific wallet
router.get(
  "/status/:wallet",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const status = await getVerificationStatus(prisma, req.params.wallet);
      res.json(status);
    } catch (error: unknown) {
      logger.error("Error checking verification status:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        wallet: req.params.wallet,
      });
      res.status(500).json({
        error: "Failed to check verification status",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  })
);

export const verificationRouter = router;
