// src/routes/beta/index.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../utils/logger";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schema for beta tester signup
const BetaTesterSignupSchema = z.object({
  solanaAddress: z
    .string()
    .min(32)
    .max(44)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format"),
  sonicAddress: z.string().min(1, "Sonic address is required"),
  telegramUsername: z
    .string()
    .min(1, "Telegram username is required")
    .regex(/^@.+/, "Telegram username must start with @"),
  twitterHandle: z
    .string()
    .min(1, "Twitter handle is required")
    .regex(/^@.+/, "Twitter handle must start with @"),
  submittedAt: z.string().optional(),
});

// Submit beta tester signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info("Beta tester signup request received:", {
      body: req.body,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Validate request body
    const validationResult = BetaTesterSignupSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn(
        "Invalid beta signup request:",
        validationResult.error.errors
      );
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors,
      });
      return;
    }

    const { solanaAddress, sonicAddress, telegramUsername, twitterHandle } =
      validationResult.data;

    // Check for duplicate submissions (by Solana address or social handles)
    const existingSubmission = await prisma.betaTesterSignup.findFirst({
      where: {
        OR: [{ solanaAddress }, { telegramUsername }, { twitterHandle }],
      },
    });

    if (existingSubmission) {
      logger.warn("Duplicate beta signup attempt:", {
        solanaAddress,
        telegramUsername,
        twitterHandle,
      });
      res.status(409).json({
        success: false,
        error:
          "A submission with this Solana address, Telegram username, or Twitter handle already exists",
      });
      return;
    }

    // Create the beta tester signup record
    const betaTesterSignup = await prisma.betaTesterSignup.create({
      data: {
        solanaAddress,
        sonicAddress,
        telegramUsername,
        twitterHandle,
        metadata: {
          submittedAt: new Date().toISOString(),
          userAgent: req.headers["user-agent"],
          ip: req.ip,
        },
      },
    });

    logger.info("Beta tester signup created successfully:", {
      id: betaTesterSignup.id,
      solanaAddress,
      telegramUsername,
      twitterHandle,
    });

    res.status(201).json({
      success: true,
      message: "Beta tester signup submitted successfully",
      id: betaTesterSignup.id,
    });
  } catch (error) {
    logger.error("Error processing beta tester signup:", error);

    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      res.status(409).json({
        success: false,
        error: "A submission with this information already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Internal server error occurred while processing your submission",
    });
  }
});

// Get beta tester signups (admin endpoint)
router.get("/signups", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const [signups, totalCount] = await Promise.all([
      prisma.betaTesterSignup.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.betaTesterSignup.count(),
    ]);

    res.json({
      success: true,
      data: {
        signups,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching beta tester signups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch beta tester signups",
    });
  }
});

// Get beta tester signup statistics
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    const totalSignups = await prisma.betaTesterSignup.count();

    const signupsToday = await prisma.betaTesterSignup.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const signupsThisWeek = await prisma.betaTesterSignup.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    res.json({
      success: true,
      data: {
        totalSignups,
        signupsToday,
        signupsThisWeek,
      },
    });
  } catch (error) {
    logger.error("Error fetching beta tester stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch beta tester statistics",
    });
  }
});

export const betaRouter = router;
