import { RewardManager } from "../core/contest/RewardManager";
import { PrismaClient } from "@prisma/client";

describe("RewardManager Simple Test", () => {
  let prisma: PrismaClient;
  let rewardManager: RewardManager;

  beforeAll(async () => {
    const testDbUrl =
      process.env.DATABASE_URL ||
      "postgresql://ScotianOG:Orson2024@localhost:5432/test_db";

    prisma = new PrismaClient({
      datasources: {
        db: { url: testDbUrl },
      },
    });

    await prisma.$connect();
    console.log("Test: Database connected successfully");

    rewardManager = RewardManager.getInstance();
    rewardManager.setPrismaClient(prisma);
    console.log("Test: RewardManager initialized");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should call startNewContest method", async () => {
    console.log("Test: About to call startNewContest");
    try {
      await rewardManager.startNewContest();
      console.log("Test: startNewContest completed successfully");
    } catch (error: any) {
      console.log("Test: startNewContest failed with error:", error.message);
    }
  });
});
