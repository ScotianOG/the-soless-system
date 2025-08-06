// Global test setup for Jest
// This file runs before each test file

const { PrismaClient } = require("@prisma/client");

// Global test utilities
global.testUtils = {
  // Helper to clean up test data
  async cleanupTestData(prisma, userIds = []) {
    if (userIds.length === 0) return;

    try {
      // Clean up in correct order to handle foreign key constraints
      await prisma.$transaction([
        prisma.engagement.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.pointTransaction.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.verificationCode.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.contestEntry.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.contestQualification.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.contestReward.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.userStreak.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.telegramAccount.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.discordAccount.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.twitterAccount.deleteMany({
          where: { userId: { in: userIds } },
        }),
        prisma.user.deleteMany({
          where: { id: { in: userIds } },
        }),
      ]);
    } catch (error) {
      console.error("Error during test cleanup:", error);
      // Don't throw - allow tests to continue
    }
  },

  // Helper to clean up test contests
  async cleanupTestContests(prisma, contestIds = []) {
    if (contestIds.length === 0) return;

    try {
      await prisma.$transaction([
        prisma.contestReward.deleteMany({
          where: { contestId: { in: contestIds } },
        }),
        prisma.contestEntry.deleteMany({
          where: { contestId: { in: contestIds } },
        }),
        prisma.contestQualification.deleteMany({
          where: { contestId: { in: contestIds } },
        }),
        prisma.contest.deleteMany({
          where: { id: { in: contestIds } },
        }),
      ]);
    } catch (error) {
      console.error("Error during contest cleanup:", error);
      // Don't throw - allow tests to continue
    }
  },

  // Helper to wait for async operations to complete
  async waitForAsyncOperations(ms = 1000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Helper to generate unique test IDs
  generateTestId(prefix = "test") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Helper to create test user data
  createTestUserData(overrides = {}) {
    const id = this.generateTestId("user");
    return {
      id,
      wallet: `test-wallet-${id}`,
      points: 0,
      lifetimePoints: 0,
      telegramUsername: `testuser_${id}`,
      discordUsername: `testuser_${id}`,
      twitterUsername: `testuser_${id}`,
      lastActive: new Date(),
      ...overrides,
    };
  },
};

// Set up proper error handling for unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process in tests, just log the error
});

// Increase timeout for async operations
jest.setTimeout(60000);

// Mock console.log to reduce noise in test output (but keep errors)
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log if it's a test-related message or error
  if (
    args.some(
      (arg) =>
        typeof arg === "string" &&
        (arg.includes("Test") || arg.includes("ERROR") || arg.includes("FAIL"))
    )
  ) {
    originalConsoleLog(...args);
  }
};

// Ensure garbage collection runs more frequently during tests
if (global.gc) {
  setInterval(() => {
    global.gc();
  }, 5000);
}

console.log("✅ Global test setup completed");
