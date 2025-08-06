import { PrismaClient, EngagementType, ContestStatus } from "@prisma/client";
import { AuthService } from "../services/AuthService";
import { PointManager } from "../core/points/PointManager";
import { RewardManager } from "../core/contest/RewardManager";
import { User } from "../types";
import { Platform } from "../types";
import nacl from "tweetnacl";
import bs58 from "bs58";

const prisma = new PrismaClient();

// Helper function to generate test data
function generateTestData() {
  // Generate a new key pair
  const keyPair = nacl.sign.keyPair();
  const wallet = bs58.encode(keyPair.publicKey);
  const message = "test-message";
  const messageBytes = new TextEncoder().encode(message);

  // Sign the message
  const signatureBytes = nacl.sign.detached(messageBytes, keyPair.secretKey);
  const signature = bs58.encode(signatureBytes);

  return { wallet, signature, message };
}

// Generate test data
const testData = generateTestData();
const TEST_WALLET = testData.wallet;
const TEST_SIGNATURE = testData.signature;
const TEST_MESSAGE = testData.message;

describe("Production Readiness Tests", () => {
  let pointManager: PointManager;
  let rewardManager: RewardManager;
  let authService: AuthService;
  let testUser: User;

  beforeAll(async () => {
    // Initialize services
    pointManager = PointManager.getInstance();
    rewardManager = RewardManager.getInstance();
    authService = AuthService.getInstance();

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
    const result = await authService.verifyWalletSignature(
      TEST_WALLET,
      TEST_SIGNATURE,
      TEST_MESSAGE
    );
    testUser = result.user!;
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
      const result = await authService.verifyWalletSignature(
        TEST_WALLET,
        TEST_SIGNATURE,
        TEST_MESSAGE
      );
      expect(result.success).toBeTruthy();
      expect(result.user).toBeDefined();
      expect(result.user!.wallet).toBe(TEST_WALLET);
    });

    it("should generate verification code", async () => {
      const result = await authService.generateVerificationCode(
        TEST_WALLET,
        Platform.TELEGRAM
      );
      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(6);
      expect(result.expiresIn).toBeDefined();
      expect(result.expiresIn).toBe("30m");
    });

    it("should handle protected routes with valid token", async () => {
      const authResult = await authService.verifyWalletSignature(
        TEST_WALLET,
        TEST_SIGNATURE,
        TEST_MESSAGE
      );
      expect(authResult.token).toBeDefined();

      // You can now use this token to test protected routes
      const user = await authService.getCurrentUser(authResult.user!.id);
      expect(user).toBeDefined();
    });
  });

  describe("Points and Rewards System", () => {
    it("should track points correctly", async () => {
      const engagement = {
        platform: Platform.TELEGRAM,
        userId: testUser.id,
        type: EngagementType.MESSAGE,
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

      const result = await rewardManager.checkTierEligibility(
        testUser.id,
        contest.id
      );
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
        .map((_, index) =>
          pointManager.processEngagement({
            platform: Platform.TELEGRAM,
            userId: testUser.id,
            type: EngagementType.MESSAGE,
            points: 5,
            metadata: { messageId: `test-${index}` },
            timestamp: new Date(Date.now() + index * 1000), // Add 1 second increment for each operation
          })
        );

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
      const result = await authService.verifyWalletSignature(
        "invalid-wallet",
        "invalid-signature",
        TEST_MESSAGE
      );
      expect(result.success).toBeFalsy();
      expect(result.error).toBeDefined();
    });

    it("should handle invalid verification codes", async () => {
      await expect(
        authService.generateVerificationCode("", "" as Platform)
      ).rejects.toThrow();
    });

    it("should handle invalid point tracking", async () => {
      const result = await pointManager.processEngagement({
        points: 5,
        platform: "INVALID" as unknown as Platform,
        userId: testUser.id,
        type: EngagementType.MESSAGE,
        metadata: {},
        timestamp: new Date(),
      });
      expect(result).toBeFalsy();
    });
  });
});

describe("Integration Tests", () => {
  let authToken: string;
  let pointManager: PointManager;
  let rewardManager: RewardManager;
  let authService: AuthService;
  let testUser: User;
  let testContest: any;

  beforeAll(async () => {
    // Initialize services
    pointManager = PointManager.getInstance();
    rewardManager = RewardManager.getInstance();
    authService = AuthService.getInstance();

    // Create test user
    const result = await authService.verifyWalletSignature(
      TEST_WALLET,
      TEST_SIGNATURE,
      TEST_MESSAGE
    );
    testUser = result.user!;
    authToken = result.token!;

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
      platform: Platform.TELEGRAM,
      userId: testUser.id,
      type: EngagementType.MESSAGE,
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
    const rewardStatus = await rewardManager.checkTierEligibility(
      testUser.id,
      testContest.id
    );
    expect(rewardStatus).toBeDefined();
    expect(rewardStatus.eligible).toBeDefined();
  });

  it("should handle contest lifecycle", async () => {
    // Track multiple engagements
    const engagements = Array(5)
      .fill(null)
      .map(() =>
        pointManager.processEngagement({
          platform: Platform.TELEGRAM,
          userId: testUser.id,
          type: EngagementType.MESSAGE,
          points: 10,
          metadata: { test: true },
          timestamp: new Date(),
        })
      );
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
    expect(completedContest?.status).toBe(ContestStatus.COMPLETED);
    expect(completedContest?.entries[0]?.points).toBeGreaterThan(0);
  });
});
