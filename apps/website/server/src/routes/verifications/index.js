"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationRouter = void 0;
// src/routes/verifications/index.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const generateCode_1 = require("./generateCode");
const verifyCode_1 = require("./verifyCode");
const getStatus_1 = require("./getStatus");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Generate verification code
router.post("/generate", (async (req, res) => {
    try {
        // Log incoming request for debugging
        logger_1.logger.debug("Generate code request:", {
            body: req.body,
            headers: {
                origin: req.headers.origin,
                'x-wallet-address': req.headers['x-wallet-address']
            }
        });
        // Validate request body
        const { wallet, platform } = req.body;
        if (!wallet || !platform) {
            logger_1.logger.warn("Invalid request body:", req.body);
            return res.status(400).json({
                error: "Missing required fields",
                details: {
                    wallet: !wallet ? "Wallet address is required" : null,
                    platform: !platform ? "Platform is required" : null
                }
            });
        }
        const result = await (0, generateCode_1.generateVerificationCode)(prisma, req.body);
        logger_1.logger.info("Generated verification code for wallet:", wallet);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Error generating verification code:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body,
            headers: {
                origin: req.headers.origin,
                'x-wallet-address': req.headers['x-wallet-address']
            }
        });
        // Handle specific errors
        if (error instanceof Error && error.message === "User not found") {
            return res.status(404).json({
                error: "User not found",
                details: "Please ensure you are registered before requesting a verification code"
            });
        }
        res.status(500).json({
            error: "Failed to generate code",
            details: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
}));
// Verify code and link platform account
router.post("/verify", (async (req, res) => {
    try {
        const result = await (0, verifyCode_1.verifyCode)(prisma, req.body);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Error verifying code:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body
        });
        res.status(500).json({
            error: "Verification failed",
            details: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
}));
// Check verification status
router.get("/status/:wallet", (async (req, res) => {
    try {
        const status = await (0, getStatus_1.getVerificationStatus)(prisma, req.params.wallet);
        res.json(status);
    }
    catch (error) {
        logger_1.logger.error("Error checking verification status:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            wallet: req.params.wallet
        });
        res.status(500).json({
            error: "Failed to check verification status",
            details: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
}));
exports.verificationRouter = router;
