"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env.local
const envPath = path_1.default.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const client_1 = require("@prisma/client");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const contests_1 = require("./routes/contests");
const invites_1 = require("./routes/invites");
const stats_1 = require("./routes/stats");
const verifications_1 = require("./routes/verifications");
const webhooks_1 = require("./routes/webhooks");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const AuthService_1 = require("./services/AuthService");
const logger_1 = require("./utils/logger");
const registration_1 = require("./routes/registration");
const activity_1 = require("./routes/activity");
const beta_1 = require("./routes/beta");
const chatbot_1 = require("./routes/chatbot");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
// Initialize auth service cleanup
AuthService_1.authService.startCleanup();
// Configure Helmet with CORS-friendly settings
app.use(
  (0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(express_1.default.json());
app.use(requestLogger_1.requestLogger);
app.use(rateLimiter_1.rateLimiter);
// Setup routes
app.use("/auth", auth_1.authRouter);
app.use("/contests", contests_1.contestRouter);
app.use("/invites", invites_1.inviteRouter);
app.use("/stats", stats_1.statsRouter);
app.use("/verifications", verifications_1.verificationRouter);
app.use("/webhooks", webhooks_1.webhookRouter);
app.use("/users", users_1.usersRouter);
app.use("/registration", registration_1.registrationRouter);
app.use("/activity", activity_1.activityRouter);
app.use("/beta", beta_1.betaRouter);
app.use("/api/chat", chatbot_1.chatbotRouter);
// Error handling
app.use(errorHandler_1.errorHandler);
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
const PORT = Number(process.env.PORT) || 3001;
const server = app.listen(PORT, "0.0.0.0", () => {
  logger_1.logger.info(`Server running on port ${PORT}`);
});
// Handle graceful shutdown
let isShuttingDown = false;
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger_1.logger.info("Shutting down gracefully...");
  try {
    // Close server first
    await new Promise((resolve) => {
      server.close(resolve);
    });
    logger_1.logger.info("Server closed");
    // Then disconnect from database
    await prisma.$disconnect();
    logger_1.logger.info("Database disconnected");
    process.exit(0);
  } catch (error) {
    logger_1.logger.error("Error during shutdown:", error);
    process.exit(1);
  }
}
// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
