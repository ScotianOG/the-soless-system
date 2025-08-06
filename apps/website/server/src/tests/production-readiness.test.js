"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const AuthService_1 = require("../services/AuthService");
const PointManager_1 = require("../core/points/PointManager");
const RewardManager_1 = require("../core/contest/RewardManager");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const prisma = new client_1.PrismaClient();
// Helper function to generate test data
function generateTestData() {
    // Generate a new key pair
    const keyPair = tweetnacl_1.default.sign.keyPair();
    const wallet = bs58_1.default.encode(keyPair.publicKey);
    const message = "test-message";
    const messageBytes = new TextEncoder().encode(message);
    // Sign the message
    const signatureBytes = tweetnacl_1.default.sign.detached(messageBytes, keyPair.secretKey);
    const signature = bs58_1.default.encode(signatureBytes);
    return { wallet, signature, message };
}
// Generate test data
const testData = generateTestData();
const TEST_WALLET = testData.wallet;
const TEST_SIGNATURE = testData.signature;
const TEST_MESSAGE = testData.message;
describe("Production Readiness Tests", () => {
    let pointManager;
    let rewardManager;
    let authService;
    let testUser;
    beforeAll(async () => {
        // Initialize services
        pointManager = PointManager_1.PointManager.getInstance();
        rewardManager = RewardManager_1.RewardManager.getInstance();
        authService = AuthService_1.AuthService.getInstance();
        // Clean up test data in correct order to handle foreign key constraints
        await prisma.engagement.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.pointTransaction.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.verificationCode.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.contestEntry.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.contestQualification.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.contestReward.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.user.deleteMany({
            where: { wallet: TEST_WALLET },
        });
        // Create test user
        const result = await authService.verifyWalletSignature(TEST_WALLET, TEST_SIGNATURE, TEST_MESSAGE);
        testUser = result.user;
    });
    afterAll(async () => {
        // Clean up in correct order
        await prisma.engagement.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.pointTransaction.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.verificationCode.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.contestEntry.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.contestQualification.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.contestReward.deleteMany({
            where: { userId: testUser?.id },
        });
        await prisma.user.deleteMany({
            where: { wallet: TEST_WALLET },
        });
        await prisma.$disconnect();
    });
    describe("Authentication Flow", () => {
        it("should verify wallet connection", async () => {
            const result = await authService.verifyWalletSignature(TEST_WALLET, TEST_SIGNATURE, TEST_MESSAGE);
            expect(result.success).toBeTruthy();
            expect(result.user).toBeDefined();
            expect(result.user.wallet).toBe(TEST_WALLET);
        });
        it("should generate verification code", async () => {
            const result = await authService.generateVerificationCode(TEST_WALLET, types_1.Platform.TELEGRAM);
            expect(result.code).toBeDefined();
            expect(result.code).toHaveLength(6);
            expect(result.expiresIn).toBeDefined();
            expect(result.expiresIn).toBe("30m");
        });
        it("should handle protected routes with valid token", async () => {
            const authResult = await authService.verifyWalletSignature(TEST_WALLET, TEST_SIGNATURE, TEST_MESSAGE);
            expect(authResult.token).toBeDefined();
            // You can now use this token to test protected routes
            const user = await authService.getCurrentUser(authResult.user.id);
            expect(user).toBeDefined();
        });
    });
    describe("Points and Rewards System", () => {
        it("should track points correctly", async () => {
            const engagement = {
                platform: types_1.Platform.TELEGRAM,
                userId: testUser.id,
                type: client_1.EngagementType.MESSAGE,
                metadata: { content: "test message" },
                timestamp: new Date(),
            };
            const result = await pointManager.processEngagement({
                ...engagement,
                points: 5,
            });
            expect(result).toBeTruthy();
            // Verify points were awarded
            const user = await prisma.user.findUnique({
                where: { id: testUser.id },
                include: { pointTransactions: true },
            });
            expect(user?.points).toBeGreaterThan(0);
            expect(user?.pointTransactions.length).toBeGreaterThan(0);
        });
        it("should handle rewards distribution", async () => {
            // Create test contest
            const contest = await prisma.contest.create({
                data: {
                    name: "Test Contest",
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    status: "ACTIVE",
                },
            });
            const result = await rewardManager.checkTierEligibility(testUser.id, contest.id);
            expect(result).toBeDefined();
            expect(result.eligible).toBeDefined();
            // Clean up
            await prisma.contest.delete({
                where: { id: contest.id },
            });
        });
    });
    describe("Database Operations", () => {
        it("should handle concurrent operations", async () => {
            // Reset user points before test
            await prisma.user.update({
                where: { id: testUser.id },
                data: { points: 0 },
            });
            // Create operations with different timestamps to avoid duplicate detection
            const operations = Array(5)
                .fill(null)
                .map((_, index) => pointManager.processEngagement({
                platform: types_1.Platform.TELEGRAM,
                userId: testUser.id,
                type: client_1.EngagementType.MESSAGE,
                points: 5,
                metadata: { messageId: `test-${index}` },
                timestamp: new Date(Date.now() + index * 1000), // Add 1 second increment for each operation
            }));
            // Execute operations concurrently
            const results = await Promise.all(operations);
            // Log results for debugging
            console.log("Operation results:", results);
            // Verify all operations succeeded
            expect(results.every((r) => r)).toBeTruthy();
            // Verify all transactions were recorded
            const transactions = await prisma.pointTransaction.findMany({
                where: { userId: testUser.id },
                orderBy: { timestamp: "asc" },
            });
            // Log transactions for debugging
            console.log("Recorded transactions:", transactions.length);
            expect(transactions.length).toBeGreaterThanOrEqual(5);
            // Verify user points were updated correctly
            const user = await prisma.user.findUnique({
                where: { id: testUser.id },
            });
            expect(user?.points).toBe(25); // 5 operations * 5 points each
        });
    });
    describe("Error Handling", () => {
        it("should handle invalid wallet signatures", async () => {
            const result = await authService.verifyWalletSignature("invalid-wallet", "invalid-signature", TEST_MESSAGE);
            expect(result.success).toBeFalsy();
            expect(result.error).toBeDefined();
        });
        it("should handle invalid verification codes", async () => {
            await expect(authService.generateVerificationCode("", "")).rejects.toThrow();
        });
        it("should handle invalid point tracking", async () => {
            const result = await pointManager.processEngagement({
                points: 5,
                platform: "INVALID",
                userId: testUser.id,
                type: client_1.EngagementType.MESSAGE,
                metadata: {},
                timestamp: new Date(),
            });
            expect(result).toBeFalsy();
        });
    });
});
describe("Integration Tests", () => {
    let authToken;
    let pointManager;
    let rewardManager;
    let authService;
    let testUser;
    let testContest;
    beforeAll(async () => {
        // Initialize services
        pointManager = PointManager_1.PointManager.getInstance();
        rewardManager = RewardManager_1.RewardManager.getInstance();
        authService = AuthService_1.AuthService.getInstance();
        // Create test user
        const result = await authService.verifyWalletSignature(TEST_WALLET, TEST_SIGNATURE, TEST_MESSAGE);
        testUser = result.user;
        authToken = result.token;
        // Start a new contest
        await rewardManager.startNewContest();
        testContest = await prisma.contest.findFirst({
            where: { status: "ACTIVE" },
        });
    });
    afterAll(async () => {
        // Clean up test data
        await prisma.$transaction([
            prisma.engagement.deleteMany({
                where: { userId: testUser.id },
            }),
            prisma.pointTransaction.deleteMany({
                where: { userId: testUser.id },
            }),
            prisma.verificationCode.deleteMany({
                where: { userId: testUser.id },
            }),
            prisma.contestEntry.deleteMany({
                where: { userId: testUser.id },
            }),
            prisma.contestQualification.deleteMany({
                where: { userId: testUser.id },
            }),
            prisma.contestReward.deleteMany({
                where: { userId: testUser.id },
            }),
            prisma.contest.deleteMany({
                where: { id: testContest?.id },
            }),
            prisma.user.deleteMany({
                where: { id: testUser.id },
            }),
        ]);
        await prisma.$disconnect();
    });
    it("should handle complete user flow", async () => {
        // 1. Auth - verify user exists
        const user = await authService.getCurrentUser(testUser.id);
        expect(user).toBeDefined();
        expect(user.wallet).toBe(TEST_WALLET);
        // 2. Points
        const pointResult = await pointManager.processEngagement({
            platform: types_1.Platform.TELEGRAM,
            userId: testUser.id,
            type: client_1.EngagementType.MESSAGE,
            points: 5,
            metadata: { test: true },
            timestamp: new Date(),
        });
        expect(pointResult).toBeTruthy();
        // Verify points were recorded
        const updatedUser = await prisma.user.findUnique({
            where: { id: testUser.id },
            include: { pointTransactions: true },
        });
        expect(updatedUser?.points).toBeGreaterThan(0);
        // 3. Rewards
        const rewardStatus = await rewardManager.checkTierEligibility(testUser.id, testContest.id);
        expect(rewardStatus).toBeDefined();
        expect(rewardStatus.eligible).toBeDefined();
    });
    it("should handle contest lifecycle", async () => {
        // Track multiple engagements
        const engagements = Array(5)
            .fill(null)
            .map(() => pointManager.processEngagement({
            platform: types_1.Platform.TELEGRAM,
            userId: testUser.id,
            type: client_1.EngagementType.MESSAGE,
            points: 10,
            metadata: { test: true },
            timestamp: new Date(),
        }));
        await Promise.all(engagements);
        // End contest
        await rewardManager.endCurrentContest();
        // Verify contest completion
        const completedContest = await prisma.contest.findUnique({
            where: { id: testContest.id },
            include: {
                entries: {
                    where: { userId: testUser.id },
                },
            },
        });
        expect(completedContest?.status).toBe(client_1.ContestStatus.COMPLETED);
        expect(completedContest?.entries[0]?.points).toBeGreaterThan(0);
    });
});
