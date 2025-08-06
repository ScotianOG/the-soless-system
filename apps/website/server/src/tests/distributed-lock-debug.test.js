"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const RewardManager_1 = require("../core/contest/RewardManager");
const DistributedLock_1 = require("../core/utils/DistributedLock");
describe("DistributedLock and RewardManager Debug", () => {
    let prisma;
    let rewardManager;
    let distributedLock;
    beforeAll(async () => {
        const testDbUrl = process.env.DATABASE_URL ||
            "postgresql://ScotianOG:Orson2024@localhost:5432/test_db";
        prisma = new client_1.PrismaClient({
            datasources: {
                db: { url: testDbUrl },
            },
        });
        await prisma.$connect();
        rewardManager = RewardManager_1.RewardManager.getInstance();
        rewardManager.setPrismaClient(prisma);
        // Create a standalone distributed lock for testing
        distributedLock = new DistributedLock_1.DistributedLock();
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
            where: { status: client_1.ContestStatus.ACTIVE },
            data: { status: client_1.ContestStatus.COMPLETED },
        });
        // Verify no active contests
        const activeContests = await prisma.contest.count({
            where: { status: client_1.ContestStatus.ACTIVE },
        });
        console.log("Active contests count:", activeContests);
        expect(activeContests).toBe(0);
        console.log("Calling endCurrentContest...");
        // Use a more detailed error handling approach
        let errorOccurred = false;
        let actualError = null;
        try {
            await rewardManager.endCurrentContest();
            console.log("endCurrentContest completed without throwing");
        }
        catch (error) {
            errorOccurred = true;
            actualError = error;
            console.log("Caught error:", error);
            console.log("Error message:", error.message);
            console.log("Error stack:", error.stack);
        }
        console.log("Error occurred:", errorOccurred);
        console.log("Actual error:", actualError);
        expect(errorOccurred).toBe(true);
        expect(actualError?.message).toContain("No active contest found to end");
    });
});
