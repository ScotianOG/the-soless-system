"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betaRouter = void 0;
// src/routes/beta/index.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schema for beta tester signup
const BetaTesterSignupSchema = zod_1.z.object({
    solanaAddress: zod_1.z
        .string()
        .min(32)
        .max(44)
        .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format"),
    sonicAddress: zod_1.z.string().min(1, "Sonic address is required"),
    telegramUsername: zod_1.z
        .string()
        .min(1, "Telegram username is required")
        .regex(/^@.+/, "Telegram username must start with @"),
    twitterHandle: zod_1.z
        .string()
        .min(1, "Twitter handle is required")
        .regex(/^@.+/, "Twitter handle must start with @"),
    submittedAt: zod_1.z.string().optional(),
});
// Submit beta tester signup
router.post("/signup", async (req, res) => {
    try {
        logger_1.logger.info("Beta tester signup request received:", {
            body: req.body,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        });
        // Validate request body
        const validationResult = BetaTesterSignupSchema.safeParse(req.body);
        if (!validationResult.success) {
            logger_1.logger.warn("Invalid beta signup request:", validationResult.error.errors);
            res.status(400).json({
                success: false,
                error: "Validation failed",
                details: validationResult.error.errors,
            });
            return;
        }
        const { solanaAddress, sonicAddress, telegramUsername, twitterHandle } = validationResult.data;
        // Check for duplicate submissions (by Solana address or social handles)
        const existingSubmission = await prisma.betaTesterSignup.findFirst({
            where: {
                OR: [{ solanaAddress }, { telegramUsername }, { twitterHandle }],
            },
        });
        if (existingSubmission) {
            logger_1.logger.warn("Duplicate beta signup attempt:", {
                solanaAddress,
                telegramUsername,
                twitterHandle,
            });
            res.status(409).json({
                success: false,
                error: "A submission with this Solana address, Telegram username, or Twitter handle already exists",
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
        logger_1.logger.info("Beta tester signup created successfully:", {
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
    }
    catch (error) {
        logger_1.logger.error("Error processing beta tester signup:", error);
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
router.get("/signups", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
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
    }
    catch (error) {
        logger_1.logger.error("Error fetching beta tester signups:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch beta tester signups",
        });
    }
});
// Get beta tester signup statistics
router.get("/stats", async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error("Error fetching beta tester stats:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch beta tester statistics",
        });
    }
});
exports.betaRouter = router;
