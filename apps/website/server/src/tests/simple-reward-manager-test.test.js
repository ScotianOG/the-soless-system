"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RewardManager_1 = require("../core/contest/RewardManager");
const client_1 = require("@prisma/client");
describe("RewardManager Simple Test", () => {
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
        console.log("Test: Database connected successfully");
        rewardManager = RewardManager_1.RewardManager.getInstance();
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
        }
        catch (error) {
            console.log("Test: startNewContest failed with error:", error.message);
        }
    });
});
