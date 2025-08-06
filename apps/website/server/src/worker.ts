// src/worker.ts
import { prisma } from "./lib/prisma";
import { PointManager } from "./core/points/PointManager";
import { RewardManager } from "./core/contest/RewardManager";
import { configManager } from "./config/ConfigManager";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

console.log("Starting worker service...");
console.log("Environment loaded from:", envPath);
console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");

let workerInstance: Worker | null = null;

async function shutdown() {
  console.log("Shutting down worker service...");
  if (workerInstance) {
    try {
      await workerInstance.stop();
      console.log("Worker service cleaned up");
    } catch (error) {
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
  private pointManager: PointManager;
  private rewardManager: RewardManager;
  private running: boolean = false;

  constructor() {
    this.pointManager = PointManager.getInstance();
    this.rewardManager = RewardManager.getInstance();
  }

  async start() {
    try {
      this.running = true;
      console.log("Worker started");
      console.log("Connecting to database...");
      await prisma.$connect();
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
    } catch (error) {
      console.error("Error in worker loop:", error);
      throw error;
    }
  }

  async stop() {
    try {
      this.running = false;
      console.log("Disconnecting from database...");
      await prisma.$disconnect();
      console.log("Worker stopped");
    } catch (error) {
      console.error("Error stopping worker:", error);
      throw error;
    }
  }

  private async processContests() {
    try {
      const activeContests = await prisma.contest.findMany({
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
    } catch (error) {
      console.error("Error processing contests:", error);
    }
  }

  private async processRewards() {
    try {
      // Process expired rewards
      await prisma.contestReward.updateMany({
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
    } catch (error) {
      console.error("Error processing rewards:", error);
    }
  }

  private async cleanupExpiredData() {
    const now = new Date();

    try {
      // Clean up expired verification codes
      await prisma.verificationCode.deleteMany({
        where: {
          OR: [{ expiresAt: { lte: now } }, { isUsed: true }],
        },
      });

      // Archive old engagement data
      if (process.env.ENABLE_ARCHIVING === "true") {
        const archiveDate = new Date();
        archiveDate.setDate(archiveDate.getDate() - 30);

        await prisma.engagement.deleteMany({
          where: {
            timestamp: {
              lte: archiveDate,
            },
          },
        });
      }
    } catch (error) {
      console.error("Error cleaning up data:", error);
    }
  }
}

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

export { Worker };
