import { PrismaClient, ContestStatus } from "@prisma/client";
import { RewardManager } from "../core/contest/RewardManager";

describe("Debug endCurrentContest", () => {
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

    // Initialize RewardManager as singleton like in production tests
    rewardManager = RewardManager.getInstance();
    rewardManager.setPrismaClient(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any active contests
    await prisma.contest.updateMany({
      where: { status: ContestStatus.ACTIVE },
      data: { status: ContestStatus.COMPLETED },
    });
  });

  it("should debug endCurrentContest behavior", async () => {
    console.log("=== DEBUGGING endCurrentContest ===");

    // 1. Verify no active contests exist
    const activeCount = await prisma.contest.count({
      where: { status: ContestStatus.ACTIVE },
    });
    console.log("Active contests count:", activeCount);
    expect(activeCount).toBe(0);

    // 2. Try to call endCurrentContest and see what happens
    console.log("Calling endCurrentContest()...");

    try {
      const result = await rewardManager.endCurrentContest();
      console.log("endCurrentContest() completed successfully!");
      console.log("Result:", result);

      // This should NOT happen - we expect an error
      throw new Error(
        "Expected endCurrentContest to throw an error, but it completed successfully"
      );
    } catch (error: any) {
      console.log("endCurrentContest() threw an error (expected):");
      console.log("Error message:", error.message);
      console.log("Error type:", error.constructor.name);

      // This is what we expect
      expect(error.message).toContain("No active contest found to end");
    }
  });
});
