"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const RewardManager_1 = require("../core/contest/RewardManager");
describe("EndCurrentContest Debug Test", () => {
    let prisma;
    let rewardManager;
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
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("should throw error when no active contest exists", async () => {
        // Ensure no active contests exist
        console.log("Step 1: Cleaning up active contests...");
        await prisma.contest.updateMany({
            where: { status: client_1.ContestStatus.ACTIVE },
            data: { status: client_1.ContestStatus.COMPLETED },
        });
        // Verify no active contests
        console.log("Step 2: Verifying no active contests...");
        const activeContests = await prisma.contest.count({
            where: { status: client_1.ContestStatus.ACTIVE },
        });
        console.log("Active contests count:", activeContests);
        expect(activeContests).toBe(0);
        // Also check if any contests exist at all
        const allContests = await prisma.contest.findMany({
            select: { id: true, status: true, name: true },
        });
        console.log("All contests:", allContests);
        console.log("Step 3: About to call endCurrentContest...");
        try {
            const result = await rewardManager.endCurrentContest();
            console.log("ERROR: endCurrentContest completed without throwing!");
            console.log("Result:", result);
            // Check if any new contests were created
            const contestsAfter = await prisma.contest.findMany({
                select: { id: true, status: true, name: true },
            });
            console.log("Contests after endCurrentContest:", contestsAfter);
            expect(true).toBe(false); // Should never reach here
        }
        catch (error) {
            console.log("SUCCESS: Caught error:", error.message);
            expect(error.message).toContain("No active contest found to end");
        }
    });
});
