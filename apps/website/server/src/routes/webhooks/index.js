"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const EngagementTrackerFactory_1 = require("../../core/engagement/EngagementTrackerFactory");
const twitter_1 = require("./twitter");
const utils_1 = require("../../utils");
const errorHandler_1 = require("../../middleware/errorHandler");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Validation schemas
const twitterCrcSchema = zod_1.z.object({
    crc_token: zod_1.z.string().min(1),
});
const twitterWebhookHeadersSchema = zod_1.z.object({
    "x-twitter-webhooks-signature": zod_1.z.string().min(1),
});
const handleTwitterRequest = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const engagementTracker = EngagementTrackerFactory_1.EngagementTrackerFactory.getTracker("TWITTER");
    const correlationId = req.correlationId || "webhook-request";
    // Handle CRC token validation (GET request)
    if (req.method === "GET" && req.query.crc_token) {
        const validation = twitterCrcSchema.safeParse(req.query);
        if (!validation.success) {
            errorHandler_1.StructuredLogger.logWarn("Invalid CRC token format", correlationId, {
                query: req.query,
            });
            return res.status(400).json({ error: "Invalid CRC token format" });
        }
        const crcToken = validation.data.crc_token;
        const hmac = crypto_1.default
            .createHmac("sha256", process.env.TWITTER_API_SECRET)
            .update(crcToken)
            .digest("base64");
        errorHandler_1.StructuredLogger.logInfo("CRC token validated successfully", correlationId);
        return res.status(200).json({ response_token: `sha256=${hmac}` });
    }
    // Validate webhook signature for POST requests
    const headerValidation = twitterWebhookHeadersSchema.safeParse(req.headers);
    if (!headerValidation.success) {
        errorHandler_1.StructuredLogger.logWarn("Missing or invalid webhook signature", correlationId, { headers: req.headers });
        return res.status(401).json({ error: "Missing webhook signature" });
    }
    const signature = headerValidation.data["x-twitter-webhooks-signature"];
    const isValid = await (0, utils_1.verifyTwitterWebhook)(signature, JSON.stringify(req.body));
    if (!isValid) {
        errorHandler_1.StructuredLogger.logWarn("Invalid webhook signature", correlationId, {
            signature,
        });
        return res.status(401).json({ error: "Invalid webhook signature" });
    }
    await (0, twitter_1.handleTwitterWebhook)(prisma, req.body, engagementTracker);
    errorHandler_1.StructuredLogger.logInfo("Twitter webhook processed successfully", correlationId);
    res.sendStatus(200);
});
router.post("/twitter", handleTwitterRequest);
exports.webhookRouter = router;
