// src/index.ts
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
// Use __dirname to get the current file's directory, then go up to the server root
const envPath = path.resolve(__dirname, "..", ".env.local");
dotenv.config({ path: envPath });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { contestRouter } from "./routes/contests";
import { inviteRouter } from "./routes/invites";
import { statsRouter } from "./routes/stats";
import { verificationRouter } from "./routes/verifications";
import { webhookRouter } from "./routes/webhooks";
import { errorHandler } from "./middleware/errorHandler";
import { correlationIdMiddleware } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { rateLimiter } from "./middleware/rateLimiter";
import { authService } from "./services/AuthService";
import { logger } from "./utils/logger";
import { registrationRouter } from "./routes/registration";
import { activityRouter } from "./routes/activity";
import { betaRouter } from "./routes/beta";
// import { adminRouter } from "./routes/admin";
import { minimalAdminRouter } from "./routes/admin/minimal-test";
import { chatbotRouter } from "./routes/chatbot";

const prisma = new PrismaClient();
const app = express();

// Initialize auth service cleanup
authService.startCleanup();

// Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend dev server
      "http://localhost:3000", // Alternative frontend port
      "https://soless.xyz", // Production domain
      "https://www.soless.xyz", // Production www domain
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Configure Helmet with CORS-friendly settings
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Correlation ID middleware (must be first)
app.use(correlationIdMiddleware);

app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Setup routes
app.use("/auth", authRouter);
app.use("/contests", contestRouter);
app.use("/invites", inviteRouter);
app.use("/stats", statsRouter);
app.use("/verifications", verificationRouter);
app.use("/webhooks", webhookRouter);
app.use("/users", usersRouter);
app.use("/registration", registrationRouter);
app.use("/activity", activityRouter);
app.use("/beta", betaRouter);
// app.use("/admin", adminRouter);
app.use("/admin-minimal", minimalAdminRouter);
app.use("/chat", chatbotRouter);

// Convenience redirects for common endpoints
app.get("/leaderboard", (req, res) => {
  res.redirect("/stats/leaderboard");
});

// Error handling
app.use(errorHandler);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
  });
});

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("Shutting down gracefully...");

  try {
    // Close server first
    await new Promise((resolve) => {
      server.close(resolve);
    });
    logger.info("Server closed");

    // Then disconnect from database
    await prisma.$disconnect();
    logger.info("Database disconnected");

    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
