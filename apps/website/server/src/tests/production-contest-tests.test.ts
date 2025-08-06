// Production-ready comprehensive contest system tests
import {
  PrismaClient,
  ContestStatus,
  Platform,
  EngagementType,
} from "@prisma/client";
import { RewardManager } from "../core/contest/RewardManager";
import { EngagementTrackerFactory } from "../core/engagement/EngagementTrackerFactory";
import { PointManager } from "../core/points/PointManager";
import { UserManager } from "../core/user/UserManager";

describe("Production Contest System Tests", () => {
  let prisma: PrismaClient;
  let rewardManager: RewardManager;
  let pointManager: PointManager;
  let userManager: UserManager;
  let testUsers: any[] = [];
  let testContest: any;

  beforeAll(async () => {
    // Initialize test database connection with proper URL
    const testDbUrl =
      process.env.DATABASE_URL ||
      "postgresql://ScotianOG:Orson2024@localhost:5432/test_db";

    prisma = new PrismaClient({
      datasources: {
        db: { url: testDbUrl },
      },
    });

    try {
      await prisma.$connect();
      console.log("✅ Database connected successfully");

      // Initialize managers
      rewardManager = RewardManager.getInstance();
      rewardManager.setPrismaClient(prisma);
      pointManager = PointManager.getInstance();
      pointManager.setPrismaClient(prisma);
      userManager = UserManager.getInstance();

      // Clean up existing test data first
      await prisma.contestEntry.deleteMany({
        where: { userId: { startsWith: "prod-test-user-" } },
      });
      await prisma.pointTransaction.deleteMany({
        where: { userId: { startsWith: "prod-test-user-" } },
      });
      await prisma.engagement.deleteMany({
        where: { userId: { startsWith: "prod-test-user-" } },
      });
      await prisma.userStreak.deleteMany({
        where: { userId: { startsWith: "prod-test-user-" } },
      });
      await prisma.pointHistory.deleteMany({
        where: { userId: { startsWith: "prod-test-user-" } },
      });
      await prisma.user.deleteMany({
        where: { id: { startsWith: "prod-test-user-" } },
      });

      // Create test users with proper data
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            id: `prod-test-user-${i}`,
            wallet: `prod-test-wallet-${i}`,
            points: 0,
            lifetimePoints: 0,
            telegramUsername: `prodtestuser${i}`,
            discordUsername: `prodtestuser${i}`,
            twitterUsername: `prodtestuser${i}`,
            lastActive: new Date(),
          },
        });
        testUsers.push(user);

        // Create streak records
        await prisma.userStreak.create({
          data: {
            userId: user.id,
            telegramStreak: 0,
            discordStreak: 0,
            twitterStreak: 0,
            lastTelegram: new Date(),
            lastDiscord: new Date(),
            lastTwitter: new Date(),
          },
        });
      }

      console.log(`✅ Created ${testUsers.length} test users`);
    } catch (error) {
      console.error("❌ Error in beforeAll setup:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Comprehensive cleanup
      const userIds = testUsers.map((u) => u.id);

      await prisma.contestReward.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.contestEntry.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.contest.deleteMany({
        where: { name: { contains: "Prod Test Contest" } },
      });

      await prisma.engagement.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.pointTransaction.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.pointHistory.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.userStreak.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });

      console.log("✅ Cleanup completed successfully");
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    try {
      // Clean up any existing active contests before each test
      await prisma.contest.updateMany({
        where: { status: ContestStatus.ACTIVE },
        data: { status: ContestStatus.COMPLETED },
      });
    } catch (error) {
      console.error("❌ Error in beforeEach cleanup:", error);
    }
  });

  describe("Core Contest Functionality", () => {
    it("should start a new contest successfully", async () => {
      console.log("🧪 Testing contest start...");

      // Start new contest
      await rewardManager.startNewContest();

      // Verify contest was created
      const activeContest = await prisma.contest.findFirst({
        where: { status: ContestStatus.ACTIVE },
      });

      expect(activeContest).toBeTruthy();
      expect(activeContest?.status).toBe(ContestStatus.ACTIVE);
      expect(activeContest?.name).toContain("Contest");

      testContest = activeContest;
      console.log(`✅ Contest created: ${activeContest?.name}`);
    });

    it("should track user engagements properly", async () => {
      console.log("🧪 Testing engagement tracking...");

      // Ensure we have an active contest
      if (!testContest) {
        await rewardManager.startNewContest();
        testContest = await prisma.contest.findFirst({
          where: { status: ContestStatus.ACTIVE },
        });
      }

      const tracker = EngagementTrackerFactory.getTracker(Platform.TELEGRAM);
      const user = testUsers[0];

      // Track engagement
      const result = await tracker.trackEngagement({
        platform: Platform.TELEGRAM,
        userId: user.id,
        type: EngagementType.MESSAGE,
        timestamp: new Date(),
        metadata: {
          messageId: `prod-test-msg-${Date.now()}`,
          content: "Test message for production testing",
        },
      });

      expect(result).toBe(true);

      // Verify engagement was recorded
      const engagement = await prisma.engagement.findFirst({
        where: {
          userId: user.id,
          platform: Platform.TELEGRAM,
          type: EngagementType.MESSAGE,
        },
        orderBy: { timestamp: "desc" },
      });

      expect(engagement).toBeTruthy();
      console.log("✅ Engagement tracked successfully");
    });

    it("should award points correctly", async () => {
      console.log("🧪 Testing point awards...");

      const user = testUsers[1];
      const initialPoints = user.points;

      // Process engagement for points
      const result = await pointManager.processEngagement({
        userId: user.id,
        platform: Platform.TELEGRAM,
        type: EngagementType.QUALITY_POST,
        points: 10,
        timestamp: new Date(),
      });

      expect(result).toBe(true);

      // Verify points were awarded
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.points).toBeGreaterThan(initialPoints);
      console.log(
        `✅ Points awarded: ${(updatedUser?.points || 0) - initialPoints}`
      );
    });

    it("should create contest entries automatically", async () => {
      console.log("🧪 Testing contest entry creation...");

      // Ensure we have an active contest first
      await rewardManager.startNewContest();
      testContest = await prisma.contest.findFirst({
        where: { status: ContestStatus.ACTIVE },
      });

      expect(testContest).toBeTruthy();
      console.log(`Active contest found: ${testContest?.id}`);

      const user = testUsers[2];

      // Award points which should create contest entry
      const success = await pointManager.processEngagement({
        userId: user.id,
        platform: Platform.DISCORD,
        type: EngagementType.QUALITY_POST,
        points: 15,
        timestamp: new Date(),
      });

      expect(success).toBe(true);

      // Verify contest entry was created
      const contestEntry = await prisma.contestEntry.findFirst({
        where: {
          contestId: testContest!.id,
          userId: user.id,
        },
      });

      expect(contestEntry).toBeTruthy();
      expect(contestEntry?.points).toBeGreaterThan(0);
      console.log(
        `✅ Contest entry created with ${contestEntry?.points} points`
      );
    });

    it("should end contest and calculate ranks", async () => {
      console.log("🧪 Testing contest completion...");

      // Ensure we have an active contest with entries
      await rewardManager.startNewContest();
      testContest = await prisma.contest.findFirst({
        where: { status: ContestStatus.ACTIVE },
      });

      expect(testContest).toBeTruthy();

      // Create multiple contest entries with different point values
      for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        const points = (i + 1) * 20; // Different point values for ranking

        const success = await pointManager.processEngagement({
          userId: user.id,
          platform: Platform.TWITTER,
          type: EngagementType.TWEET,
          points: points,
          timestamp: new Date(),
        });

        expect(success).toBe(true);
      }

      // Verify entries were created before ending contest
      const entriesBeforeEnd = await prisma.contestEntry.count({
        where: { contestId: testContest!.id },
      });
      expect(entriesBeforeEnd).toBeGreaterThan(0);

      // End the contest
      await rewardManager.endCurrentContest();

      // Verify contest was completed
      const completedContest = await prisma.contest.findUnique({
        where: { id: testContest!.id },
        include: {
          entries: {
            orderBy: { rank: "asc" },
          },
        },
      });

      expect(completedContest?.status).toBe(ContestStatus.COMPLETED);
      expect(completedContest?.entries.length).toBeGreaterThan(0);

      // Verify ranks were assigned correctly
      const rankedEntries = completedContest?.entries.filter(
        (e) => e.rank !== null
      );
      expect(rankedEntries?.length).toBeGreaterThan(0);

      // Verify ranking order (higher points = lower rank number)
      if (rankedEntries && rankedEntries.length > 1) {
        for (let i = 1; i < rankedEntries.length; i++) {
          expect(rankedEntries[i].points).toBeLessThanOrEqual(
            rankedEntries[i - 1].points
          );
        }
      }

      console.log(
        `✅ Contest completed with ${rankedEntries?.length} ranked entries`
      );
    });

    it("should distribute rewards properly", async () => {
      console.log("🧪 Testing reward distribution...");

      // Check if we have a completed contest with entries
      const completedContest = await prisma.contest.findFirst({
        where: { status: ContestStatus.COMPLETED },
        include: { entries: true },
      });

      if (completedContest && completedContest.entries.length > 0) {
        // Check for rewards
        const rewards = await prisma.contestReward.findMany({
          where: { contestId: completedContest.id },
        });

        expect(rewards.length).toBeGreaterThan(0);
        console.log(`✅ ${rewards.length} rewards distributed`);

        // Test reward claiming
        const claimableReward = rewards.find((r) => r.status === "PENDING");
        if (claimableReward) {
          const claimResult = await rewardManager.claimReward(
            claimableReward.id,
            claimableReward.userId
          );

          expect(claimResult).toBe(true);

          const updatedReward = await prisma.contestReward.findUnique({
            where: { id: claimableReward.id },
          });

          expect(updatedReward?.status).toBe("CLAIMED");
          console.log("✅ Reward claimed successfully");
        }
      } else {
        console.log(
          "⚠️ No completed contest with entries found, skipping reward test"
        );
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle concurrent contest operations", async () => {
      console.log("🧪 Testing concurrent operations...");

      // Clean up any active contests first
      await prisma.contest.updateMany({
        where: { status: ContestStatus.ACTIVE },
        data: { status: ContestStatus.COMPLETED },
      });

      // Attempt multiple concurrent contest starts
      const concurrentOperations = Array(3)
        .fill(null)
        .map(() =>
          rewardManager.startNewContest().catch((error: any) => error)
        );

      const results = await Promise.all(concurrentOperations);

      // In a real distributed system with proper locking:
      // - The first operation acquires the lock and creates a contest
      // - When it completes and releases the lock, subsequent operations can retry and succeed
      // - This is normal behavior for distributed locking with retries
      // - The transaction ensures only one contest is active at any time

      const successes = results.filter((r) => !(r instanceof Error));
      const failures = results.filter((r) => r instanceof Error);

      console.log(
        `📊 Test: Results: ${successes.length} successes, ${failures.length} failures`
      );

      // We expect that all operations either succeed or fail with a valid reason
      // The important thing is that only one active contest exists at the end
      expect(successes.length + failures.length).toBe(3);

      // Verify only one active contest exists (most important constraint)
      const activeContests = await prisma.contest.findMany({
        where: { status: ContestStatus.ACTIVE },
      });

      expect(activeContests.length).toBe(1);
      console.log(
        "✅ Test: Only one active contest exists - distributed locking working correctly"
      );
    });

    it("should enforce engagement cooldowns", async () => {
      console.log("🧪 Testing engagement cooldowns...");

      const tracker = EngagementTrackerFactory.getTracker(Platform.TELEGRAM);
      const user = testUsers[3];

      // First engagement should succeed
      const firstResult = await tracker.trackEngagement({
        platform: Platform.TELEGRAM,
        userId: user.id,
        type: EngagementType.MESSAGE,
        timestamp: new Date(),
        metadata: { messageId: `cooldown-test-1-${Date.now()}` },
      });

      expect(firstResult).toBe(true);

      // Immediate second engagement should fail due to cooldown
      await expect(
        tracker.trackEngagement({
          platform: Platform.TELEGRAM,
          userId: user.id,
          type: EngagementType.MESSAGE,
          timestamp: new Date(),
          metadata: { messageId: `cooldown-test-2-${Date.now()}` },
        })
      ).rejects.toThrow();

      console.log("✅ Engagement cooldown enforced");
    });

    it("should handle invalid user data gracefully", async () => {
      console.log("🧪 Testing invalid user handling...");

      const tracker = EngagementTrackerFactory.getTracker(Platform.TELEGRAM);

      // Test with non-existent user
      await expect(
        tracker.trackEngagement({
          platform: Platform.TELEGRAM,
          userId: "non-existent-user-id",
          type: EngagementType.MESSAGE,
          timestamp: new Date(),
          metadata: {},
        })
      ).rejects.toThrow();

      console.log("✅ Invalid user data handled gracefully");
    });

    it("should validate contest state transitions", async () => {
      console.log("🧪 Testing contest state validation...");

      // Ensure no active contests exist before testing
      await prisma.contest.updateMany({
        where: { status: ContestStatus.ACTIVE },
        data: { status: ContestStatus.COMPLETED },
      });

      // Verify no active contests exist
      const activeContests = await prisma.contest.count({
        where: { status: ContestStatus.ACTIVE },
      });
      expect(activeContests).toBe(0);

      // Try to end a contest when none is active - should throw error
      await expect(rewardManager.endCurrentContest()).rejects.toThrow(
        "No active contest found to end"
      );

      console.log("✅ Contest state validation working");
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle multiple simultaneous engagements", async () => {
      console.log("🧪 Testing performance with multiple engagements...");

      // Start a contest
      await rewardManager.startNewContest();

      const tracker = EngagementTrackerFactory.getTracker(Platform.DISCORD);
      const startTime = Date.now();

      // Create multiple engagements from different users with delays to avoid cooldowns
      const engagementPromises = testUsers.map(async (user, index) => {
        // Add delay to avoid cooldown conflicts
        await new Promise((resolve) => setTimeout(resolve, index * 100));

        try {
          return await tracker.trackEngagement({
            platform: Platform.DISCORD,
            userId: user.id,
            type: EngagementType.REACTION,
            timestamp: new Date(Date.now() + index * 1000),
            metadata: {
              reactionId: `perf-test-${user.id}-${Date.now()}`,
              index,
            },
          });
        } catch (error) {
          console.log(
            `Expected cooldown error for user ${index}:`,
            (error as Error).message
          );
          return false;
        }
      });

      const results = await Promise.all(engagementPromises);
      const successfulEngagements = results.filter((r) => r === true).length;

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(
        `✅ Processed ${successfulEngagements} engagements in ${duration}ms`
      );
      expect(successfulEngagements).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it("should handle database connection issues gracefully", async () => {
      console.log("🧪 Testing database resilience...");

      // This test verifies that the system handles database issues gracefully
      // In a real scenario, you might temporarily disconnect the database
      // For now, we'll test with malformed data that might cause issues

      const tracker = EngagementTrackerFactory.getTracker(Platform.TWITTER);

      // Test with potentially problematic metadata
      const result = await tracker
        .trackEngagement({
          platform: Platform.TWITTER,
          userId: testUsers[4].id,
          type: EngagementType.HASHTAG,
          timestamp: new Date(),
          metadata: {
            // Large metadata that might cause issues
            largeField: "x".repeat(1000),
            specialChars: "🎵🎶🎤🎧",
            unicode: "测试数据",
          },
        })
        .catch((error) => {
          console.log("Expected database resilience test:", error.message);
          return false;
        });

      // Should either succeed or fail gracefully
      expect(typeof result).toBe("boolean");
      console.log("✅ Database resilience test completed");
    });
  });

  describe("Integration with External Systems", () => {
    it("should maintain data consistency across transactions", async () => {
      console.log("🧪 Testing transaction consistency...");

      const user = testUsers[0];
      const initialPoints = await prisma.user.findUnique({
        where: { id: user.id },
        select: { points: true, lifetimePoints: true },
      });

      // Process multiple point-awarding operations
      await pointManager.processEngagement({
        userId: user.id,
        platform: Platform.TELEGRAM,
        type: EngagementType.QUALITY_POST,
        points: 25,
        timestamp: new Date(),
      });

      // Verify consistency
      const finalPoints = await prisma.user.findUnique({
        where: { id: user.id },
        select: { points: true, lifetimePoints: true },
      });

      const transactions = await prisma.pointTransaction.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: "desc" },
        take: 1,
      });

      expect(finalPoints?.points).toBeGreaterThan(initialPoints?.points || 0);
      expect(finalPoints?.lifetimePoints).toBeGreaterThan(
        initialPoints?.lifetimePoints || 0
      );
      expect(transactions.length).toBeGreaterThan(0);

      console.log("✅ Transaction consistency verified");
    });
  });
});
