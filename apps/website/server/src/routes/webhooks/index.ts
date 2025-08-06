import { Router, Request, Response, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { logger } from "../../utils/logger";
import { EngagementTrackerFactory } from "../../core/engagement/EngagementTrackerFactory";
import { handleTwitterWebhook } from "./twitter";
import { verifyTwitterWebhook } from "../../utils";
import { asyncHandler, StructuredLogger } from "../../middleware/errorHandler";
import { validateRequest } from "../../middleware/validation";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const twitterCrcSchema = z.object({
  crc_token: z.string().min(1),
});

const twitterWebhookHeadersSchema = z.object({
  "x-twitter-webhooks-signature": z.string().min(1),
});

const handleTwitterRequest: RequestHandler = asyncHandler(async (req, res) => {
  const engagementTracker = EngagementTrackerFactory.getTracker("TWITTER");
  const correlationId = req.correlationId || "webhook-request";

  // Handle CRC token validation (GET request)
  if (req.method === "GET" && req.query.crc_token) {
    const validation = twitterCrcSchema.safeParse(req.query);
    if (!validation.success) {
      StructuredLogger.logWarn("Invalid CRC token format", correlationId, {
        query: req.query,
      });
      return res.status(400).json({ error: "Invalid CRC token format" });
    }

    const crcToken = validation.data.crc_token;
    const hmac = crypto
      .createHmac("sha256", process.env.TWITTER_API_SECRET!)
      .update(crcToken)
      .digest("base64");

    StructuredLogger.logInfo("CRC token validated successfully", correlationId);
    return res.status(200).json({ response_token: `sha256=${hmac}` });
  }

  // Validate webhook signature for POST requests
  const headerValidation = twitterWebhookHeadersSchema.safeParse(req.headers);
  if (!headerValidation.success) {
    StructuredLogger.logWarn(
      "Missing or invalid webhook signature",
      correlationId,
      { headers: req.headers }
    );
    return res.status(401).json({ error: "Missing webhook signature" });
  }

  const signature = headerValidation.data["x-twitter-webhooks-signature"];
  const isValid = await verifyTwitterWebhook(
    signature,
    JSON.stringify(req.body)
  );

  if (!isValid) {
    StructuredLogger.logWarn("Invalid webhook signature", correlationId, {
      signature,
    });
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  await handleTwitterWebhook(prisma, req.body, engagementTracker);
  StructuredLogger.logInfo(
    "Twitter webhook processed successfully",
    correlationId
  );
  res.sendStatus(200);
});

router.post("/twitter", handleTwitterRequest);

export const webhookRouter = router;
