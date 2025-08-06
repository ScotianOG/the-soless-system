"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
// src/worker.ts
const prisma_1 = require("./lib/prisma");
const PointManager_1 = require("./core/points/PointManager");
const RewardManager_1 = require("./core/contest/RewardManager");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
const envPath = path_1.default.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });
console.log("Starting worker service...");
console.log("Environment loaded from:", envPath);
console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
let workerInstance = null;
async function shutdown() {
    console.log("Shutting down worker service...");
    if (workerInstance) {
        try {
            await workerInstance.stop();
            console.log("Worker service cleaned up");
        }
        catch (error) {
            console.error("Error during cleanup:", error);
        }
    }
    process.exit(0);
}
// Handle shutdown signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    shutdown().catch(console.error);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    shutdown().catch(console.error);
});
class Worker {
    constructor() {
        this.running = false;
        this.pointManager = PointManager_1.PointManager.getInstance();
        this.rewardManager = RewardManager_1.RewardManager.getInstance();
    }
    async start() {
        try {
            this.running = true;
            console.log("Worker started");
            console.log("Connecting to database...");
            await prisma_1.prisma.$connect();
            console.log("Database connected successfully");
            while (this.running) {
                await Promise.all([
                    this.processContests(),
                    this.processRewards(),
                    this.cleanupExpiredData(),
                ]);
                // Wait before next iteration
                await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 minute
            }
        }
        catch (error) {
            console.error("Error in worker loop:", error);
            throw error;
        }
    }
    async stop() {
        try {
            this.running = false;
            console.log("Disconnecting from database...");
            await prisma_1.prisma.$disconnect();
            console.log("Worker stopped");
        }
        catch (error) {
            console.error("Error stopping worker:", error);
            throw error;
        }
    }
    async processContests() {
        try {
            const activeContests = await prisma_1.prisma.contest.findMany({
                where: {
                    status: "ACTIVE",
                    endTime: {
                        lte: new Date(),
                    },
                },
            });
            for (const contest of activeContests) {
                await this.rewardManager.distributeRewards(contest.id);
            }
        }
        catch (error) {
            console.error("Error processing contests:", error);
        }
    }
    async processRewards() {
        try {
            // Process expired rewards
            await prisma_1.prisma.contestReward.updateMany({
                where: {
                    status: "PENDING",
                    expiresAt: {
                        lte: new Date(),
                    },
                },
                data: {
                    status: "EXPIRED",
                },
            });
        }
        catch (error) {
            console.error("Error processing rewards:", error);
        }
    }
    async cleanupExpiredData() {
        const now = new Date();
        try {
            // Clean up expired verification codes
            await prisma_1.prisma.verificationCode.deleteMany({
                where: {
                    OR: [{ expiresAt: { lte: now } }, { isUsed: true }],
                },
            });
            // Archive old engagement data
            if (process.env.ENABLE_ARCHIVING === "true") {
                const archiveDate = new Date();
                archiveDate.setDate(archiveDate.getDate() - 30);
                await prisma_1.prisma.engagement.deleteMany({
                    where: {
                        timestamp: {
                            lte: archiveDate,
                        },
                    },
                });
            }
        }
        catch (error) {
            console.error("Error cleaning up data:", error);
        }
    }
}
exports.Worker = Worker;
// Start worker if run directly
if (require.main === module) {
    workerInstance = new Worker();
    process.on("SIGTERM", () => shutdown());
    process.on("SIGINT", () => shutdown());
    workerInstance.start().catch((error) => {
        console.error("Fatal worker error:", error);
        process.exit(1);
    });
}
