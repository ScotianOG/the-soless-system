// src/routes/verifications/index.ts
import { Router, Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../utils/logger";
import { generateVerificationCode } from "./generateCode";
import { verifyCode } from "./verifyCode";
import { getVerificationStatus } from "./getStatus";
import { VerificationService } from "../../services/VerificationService";

const router: Router = Router();
const prisma = new PrismaClient();

// Generate verification code
router.post("/generate", (async (req: Request, res: Response) => {
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
    if (error instanceof Error && error.message.includes("already verified")) {
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
}) as RequestHandler);

// Verify code and link platform account
router.post("/verify", (async (req: Request, res: Response) => {
  try {
    const { code, platform, platformId } = req.body;
    const verificationService = VerificationService.getInstance();
    const result = await verificationService.verifyCode(
      code,
      platform,
      platformId
    );
    res.json({ success: result });
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
}) as RequestHandler);

// Check verification status
router.get("/status/:wallet", (async (req: Request, res: Response) => {
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
}) as RequestHandler);

export const verificationRouter = router;
