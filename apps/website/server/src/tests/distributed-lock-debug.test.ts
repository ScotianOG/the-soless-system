import { PrismaClient, ContestStatus } from "@prisma/client";
import { RewardManager } from "../core/contest/RewardManager";
import { DistributedLock } from "../core/utils/DistributedLock";

describe("DistributedLock and RewardManager Debug", () => {
  let prisma: PrismaClient;
  let rewardManager: RewardManager;
  let distributedLock: DistributedLock;

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
    rewardManager = RewardManager.getInstance();
    rewardManager.setPrismaClient(prisma);

    // Create a standalone distributed lock for testing
    distributedLock = new DistributedLock();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should test distributed lock acquire and release", async () => {
    const lockKey = "test:lock:key";

    console.log("Testing lock acquisition...");
    const lockValue = await distributedLock.acquire(lockKey, { ttl: 10000 });

    console.log("Lock value:", lockValue);
    expect(lockValue).not.toBeNull();

    if (lockValue) {
      console.log("Testing lock release...");
      await distributedLock.release(lockKey, lockValue);
      console.log("Lock released successfully");
    }
  });

  it("should test RewardManager endCurrentContest with error catching", async () => {
    // Ensure no active contests exist
    await prisma.contest.updateMany({
      where: { status: ContestStatus.ACTIVE },
      data: { status: ContestStatus.COMPLETED },
    });

    // Verify no active contests
    const activeContests = await prisma.contest.count({
      where: { status: ContestStatus.ACTIVE },
    });
    console.log("Active contests count:", activeContests);
    expect(activeContests).toBe(0);

    console.log("Calling endCurrentContest...");

    // Use a more detailed error handling approach
    let errorOccurred = false;
    let actualError: Error | null = null;

    try {
      await rewardManager.endCurrentContest();
      console.log("endCurrentContest completed without throwing");
    } catch (error) {
      errorOccurred = true;
      actualError = error as Error;
      console.log("Caught error:", error);
      console.log("Error message:", (error as Error).message);
      console.log("Error stack:", (error as Error).stack);
    }

    console.log("Error occurred:", errorOccurred);
    console.log("Actual error:", actualError);

    expect(errorOccurred).toBe(true);
    expect(actualError?.message).toContain("No active contest found to end");
  });
});
