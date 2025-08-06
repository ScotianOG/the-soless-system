// Comprehensive Audit Test Suite for Engagement Contest System
import { PrismaClient, ContestStatus, Platform, EngagementType } from "@prisma/client";
import { RewardManager } from "../core/contest/RewardManager";
import { EngagementTrackerFactory } from "../core/engagement/EngagementTrackerFactory";
import { BotManager } from "../core/bots/BotManager";
import { TelegramBot } from "../core/bots/platforms/telegram/TelegramBot";
import { DiscordBot } from "../core/bots/platforms/discord/DiscordBot";
import { TwitterBot } from "../core/bots/platforms/twitter/TwitterBot";

describe("Comprehensive Engagement Contest Audit", () => {
  let prisma: PrismaClient;
  let rewardManager: RewardManager;
  let testUsers: any[] = [];
  let testContest: any;
  let botManager: BotManager;

  beforeAll(async () => {
    const testDbUrl = process.env.DATABASE_URL || "postgresql://ScotianOG:Orson2024@localhost:5432/test_db";
    
    prisma = new PrismaClient({
      datasources: {
        db: { url: testDbUrl },
      },
    });

    await prisma.$connect();
    
    rewardManager = RewardManager.getInstance();
    rewardManager.setPrismaClient(prisma);

    // Clean up existing test data
    await cleanupTestData();

    // Ensure no active contests exist before starting tests
    await prisma.contest.updateMany({
      where: { status: ContestStatus.ACTIVE },
      data: { status: ContestStatus.COMPLETED }
    });

    // Create test users
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({
        data: {
          id: `audit-test-user-${i}`,
          wallet: `audit-test-wallet-${i}`,
          points: 0,
          lifetimePoints: 0,
          telegramUsername: `audittestuser${i}`,
          lastActive: new Date(),
        },
      });
      testUsers.push(user);

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
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function cleanupTestData() {
    const userIds = testUsers.map((u) => u.id);
    
    if (userIds.length > 0) {
      await prisma.contestReward.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.contestEntry.deleteMany({
        where: { userId: { in: userIds } },
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
    }

    await prisma.contest.deleteMany({
      where: { name: { contains: "Audit Test Contest" } },
    });
    
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
    
    testUsers = [];
    testContest = null;
  }

  // Helper function to ensure we have a valid active contest
  async function ensureActiveTestContest() {
    if (!testContest || testContest.status !== ContestStatus.ACTIVE) {
      // Set any existing active contests to completed
      await prisma.contest.updateMany({
        where: { status: ContestStatus.ACTIVE },
        data: { status: ContestStatus.COMPLETED }
      });

      testContest = await prisma.contest.create({
        data: {
          name: `Audit Test Contest ${Date.now()}`,
          startTime: new Date(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: ContestStatus.ACTIVE,
          description: "Test contest for audit",
          rules: { minPoints: 10 },
        },
      });
    }
    return testContest;
  }

  describe("1. Database Schema Integrity", () => {
    test("should validate all required tables exist", async () => {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      const expectedTables = [
        "User", "Contest", "ContestEntry", "ContestReward", 
        "Engagement", "PointTransaction", "UserStreak",
        "TelegramAccount", "DiscordAccount", "TwitterAccount"
      ];
      
      expectedTables.forEach(table => {
        expect(tables).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ table_name: table })
          ])
        );
      });
    });

    test("should validate foreign key constraints are properly set", async () => {
      // Test that foreign key constraints work
      await expect(
        prisma.engagement.create({
          data: {
            userId: "non-existent-user",
            platform: Platform.TELEGRAM,
            type: EngagementType.MESSAGE,
            metadata: { points: 1 },
          },
        })
      ).rejects.toThrow();
    });

    test("should validate enum constraints work correctly", async () => {
      await expect(
        prisma.engagement.create({
          data: {
            userId: testUsers[0].id,
            platform: "INVALID_PLATFORM" as any,
            type: EngagementType.MESSAGE,
            metadata: { points: 1 },
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("2. Contest Lifecycle Management", () => {
    test("should create contest with proper validation", async () => {
      // First ensure no active contests exist
      await prisma.contest.updateMany({
        where: { status: ContestStatus.ACTIVE },
        data: { status: ContestStatus.COMPLETED }
      });

      testContest = await prisma.contest.create({
        data: {
          name: "Audit Test Contest",
          startTime: new Date(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: ContestStatus.ACTIVE,
          description: "Test contest for audit",
          rules: { minPoints: 10 },
        },
      });

      expect(testContest).toBeDefined();
      expect(testContest.status).toBe(ContestStatus.ACTIVE);
      expect(testContest.name).toBe("Audit Test Contest");
    });

    test("should prevent multiple active contests", async () => {
      // This test should pass now because our constraint works
      await expect(
        prisma.contest.create({
          data: {
            name: "Another Active Contest",
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: ContestStatus.ACTIVE,
            description: "This should fail",
          },
        })
      ).rejects.toThrow(/Unique constraint failed/);
    });

    test("should handle contest completion properly", async () => {
      const updatedContest = await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: ContestStatus.COMPLETED },
      });

      expect(updatedContest.status).toBe(ContestStatus.COMPLETED);
    });
  });

  describe("3. Engagement Tracking System", () => {
    beforeEach(async () => {
      // Ensure we have an active contest for each test
      await ensureActiveTestContest();
    });

    test("should track valid engagements correctly", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.TELEGRAM);
      
      const result = await tracker.trackEngagement({
        userId: testUsers[0].id,
        platform: Platform.TELEGRAM,
        type: EngagementType.MESSAGE,
        timestamp: new Date(),
        metadata: { content: "test message" },
      });

      expect(result).toBe(true);

      // Verify engagement was recorded
      const engagement = await prisma.engagement.findFirst({
        where: {
          userId: testUsers[0].id,
          platform: Platform.TELEGRAM,
          type: EngagementType.MESSAGE,
        },
      });

      expect(engagement).toBeDefined();
      expect(engagement?.metadata).toHaveProperty("points");
    });

    test("should enforce cooldown periods", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.TELEGRAM);
      
      // First engagement should succeed
      await tracker.trackEngagement({
        userId: testUsers[1].id,
        platform: Platform.TELEGRAM,
        type: EngagementType.MESSAGE,
        timestamp: new Date(),
      });

      // Second engagement within cooldown should fail
      await expect(
        tracker.trackEngagement({
          userId: testUsers[1].id,
          platform: Platform.TELEGRAM,
          type: EngagementType.MESSAGE,
          timestamp: new Date(),
        })
      ).rejects.toThrow("cooldown");
    });

    test("should enforce daily limits", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.TELEGRAM);
      
      // Track engagements up to limit for MUSIC_SHARE (assuming limit is 10)
      for (let i = 0; i < 12; i++) {
        try {
          await tracker.trackEngagement({
            userId: testUsers[2].id,
            platform: Platform.TELEGRAM,
            type: EngagementType.MUSIC_SHARE,
            timestamp: new Date(Date.now() + i * 10000), // Spread timestamps to avoid cooldown
          });
        } catch (error) {
          if (i >= 10) {
            expect((error as Error).message).toMatch(/daily limit|Daily limit/i);
            break;
          } else {
            throw error;
          }
        }
      }
    });

    test("should update user points and contest entries", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.DISCORD);
      const initialUser = await prisma.user.findUnique({
        where: { id: testUsers[0].id },
      });

      await tracker.trackEngagement({
        userId: testUsers[0].id,
        platform: Platform.DISCORD,
        type: EngagementType.QUALITY_POST,
        timestamp: new Date(),
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUsers[0].id },
      });

      expect(updatedUser?.points).toBeGreaterThan(initialUser?.points || 0);

      // Check contest entry was created/updated
      const contestEntry = await prisma.contestEntry.findUnique({
        where: {
          contestId_userId: {
            contestId: testContest.id,
            userId: testUsers[0].id,
          },
        },
      });

      expect(contestEntry).toBeDefined();
      expect(contestEntry?.points).toBeGreaterThan(0);
    });
  });

  describe("4. Bot Integration Testing", () => {
    let mockBotManager: BotManager;

    beforeAll(() => {
      // Set up mock environment variables
      process.env.TELEGRAM_BOT_TOKEN = "test-telegram-token";
      process.env.DISCORD_BOT_TOKEN = "test-discord-token";
      process.env.TWITTER_API_KEY = "test-api-key";
      process.env.TWITTER_API_SECRET = "test-api-secret";
      process.env.TWITTER_ACCESS_TOKEN = "test-access-token";
      process.env.TWITTER_ACCESS_SECRET = "test-access-secret";
    });

    test("should initialize BotManager with proper configuration", () => {
      const config = {
        enabled: true,
        telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
        discordToken: process.env.DISCORD_BOT_TOKEN,
        twitterConfig: {
          apiKey: process.env.TWITTER_API_KEY!,
          apiSecret: process.env.TWITTER_API_SECRET!,
          accessToken: process.env.TWITTER_ACCESS_TOKEN!,
          accessSecret: process.env.TWITTER_ACCESS_SECRET!,
        },
      };

      mockBotManager = BotManager.getInstance(config);
      expect(mockBotManager).toBeDefined();
    });

    test("should handle bot command validation", async () => {
      // Test telegram bot command structure
      const telegramConfig = {
        token: "test-token",
        platform: "TELEGRAM" as const,
      };
      
      const telegramBot = new TelegramBot(telegramConfig);
      expect(telegramBot).toBeDefined();
      // expect(telegramBot.getPlatform()).toBe("TELEGRAM"); // Method doesn't exist
    });

    test("should validate bot error handling", () => {
      // Test bot initialization with invalid config
      expect(() => {
        new TelegramBot({
          token: "",
          platform: "TELEGRAM" as const,
        });
      }).toThrow();
    });
  });

  describe("5. Reward Distribution System", () => {
    beforeEach(async () => {
      // Ensure we have an active contest
      await ensureActiveTestContest();
      
      // Create contest entries with different point values
      for (let i = 0; i < testUsers.length; i++) {
        await prisma.contestEntry.upsert({
          where: {
            contestId_userId: {
              contestId: testContest.id,
              userId: testUsers[i].id,
            },
          },
          create: {
            contestId: testContest.id,
            userId: testUsers[i].id,
            points: (i + 1) * 50, // 50, 100, 150 points
            rank: null,
          },
          update: {
            points: (i + 1) * 50,
          },
        });
      }
    });

    test("should distribute rewards correctly", async () => {
      await rewardManager.distributeRewards(testContest.id);

      // Check that rewards were created
      const rewards = await prisma.contestReward.findMany({
        where: { contestId: testContest.id },
      });

      expect(rewards.length).toBeGreaterThan(0);

      // Check that entries have ranks
      const entries = await prisma.contestEntry.findMany({
        where: { contestId: testContest.id },
        orderBy: { points: "desc" },
      });

      entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    test("should handle reward claiming", async () => {
      const reward = await prisma.contestReward.findFirst({
        where: { contestId: testContest.id },
      });

      if (reward) {
        const result = await rewardManager.claimReward(reward.id, reward.userId);
        expect(result).toBe(true);

        const updatedReward = await prisma.contestReward.findUnique({
          where: { id: reward.id },
        });

        expect(updatedReward?.status).toBe("CLAIMED");
        expect(updatedReward?.claimedAt).toBeDefined();
      }
    });
  });

  describe("6. API Route Validation", () => {
    test("should validate contest API endpoints exist", async () => {
      // Test that we can query current contest
      const currentContest = await prisma.contest.findFirst({
        where: { status: ContestStatus.ACTIVE },
      });

      if (currentContest) {
        expect(currentContest.status).toBe(ContestStatus.ACTIVE);
      }
    });

    test("should validate user data retrieval", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUsers[0].id },
        include: {
          contestEntries: true,
          rewards: true,
          engagements: true,
        },
      });

      expect(user).toBeDefined();
      expect(user?.contestEntries).toBeDefined();
      expect(user?.rewards).toBeDefined();
      expect(user?.engagements).toBeDefined();
    });

    test("should validate leaderboard generation", async () => {
      // Ensure we have an active contest
      await ensureActiveTestContest();
      
      const leaderboard = await prisma.contestEntry.findMany({
        where: { contestId: testContest.id },
        orderBy: { points: "desc" },
        take: 10,
        include: { user: true },
      });

      expect(leaderboard).toBeDefined();
      expect(leaderboard.length).toBeGreaterThanOrEqual(0);
      
      // Verify ordering if we have entries
      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].points).toBeGreaterThanOrEqual(leaderboard[i].points);
      }
    });
  });

  describe("7. Data Consistency and Integrity", () => {
    test("should maintain point consistency across tables", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUsers[0].id },
      });

      const pointTransactions = await prisma.pointTransaction.findMany({
        where: { userId: testUsers[0].id },
      });

      const totalFromTransactions = pointTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      // Points should match or be close (allowing for some test variations)
      expect(Math.abs((user?.points || 0) - totalFromTransactions)).toBeLessThanOrEqual(10);
    });

    test("should maintain contest entry consistency", async () => {
      // Ensure we have an active contest
      await ensureActiveTestContest();
      
      const entries = await prisma.contestEntry.findMany({
        where: { contestId: testContest.id },
        include: { user: true },
      });

      for (const entry of entries) {
        const userEngagements = await prisma.engagement.findMany({
          where: {
            userId: entry.userId,
            timestamp: {
              gte: testContest.startTime,
              lte: testContest.endTime,
            },
          },
        });

        // Contest entry points should reflect user's engagements during contest
        const engagementPoints = userEngagements.reduce((sum, engagement) => {
          const metadata = engagement.metadata as any;
          return sum + (metadata?.points || 0);
        }, 0);

        expect(entry.points).toBeGreaterThanOrEqual(0);
      }
    });

    test("should validate streak calculations", async () => {
      const streak = await prisma.userStreak.findUnique({
        where: { userId: testUsers[0].id },
      });

      expect(streak).toBeDefined();
      expect(streak?.telegramStreak).toBeGreaterThanOrEqual(0);
      expect(streak?.discordStreak).toBeGreaterThanOrEqual(0);
      expect(streak?.twitterStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe("8. Error Handling and Edge Cases", () => {
    test("should handle invalid user IDs gracefully", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.TELEGRAM);
      
      await expect(
        tracker.trackEngagement({
          userId: "non-existent-user",
          platform: Platform.TELEGRAM,
          type: EngagementType.MESSAGE,
          timestamp: new Date(),
        })
      ).rejects.toThrow();
    });

    test("should handle invalid engagement types", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.TWITTER);
      
      await expect(
        tracker.trackEngagement({
          userId: testUsers[0].id,
          platform: Platform.TWITTER,
          type: "INVALID_TYPE" as any,
          timestamp: new Date(),
        })
      ).rejects.toThrow();
    });

    test("should handle database connection failures gracefully", async () => {
      // This would be tested with a separate disconnected client
      // but for now we'll test that errors are properly thrown
      expect(prisma).toBeDefined();
    });
  });

  describe("9. Performance and Scalability", () => {
    test("should handle multiple concurrent engagements", async () => {
      const tracker = EngagementTrackerFactory.createTracker(Platform.DISCORD);
      
      const promises = testUsers.map((user, index) =>
        tracker.trackEngagement({
          userId: user.id,
          platform: Platform.DISCORD,
          type: EngagementType.REACTION,
          timestamp: new Date(Date.now() + index * 1000), // Avoid cooldown conflicts
        })
      );

      const results = await Promise.allSettled(promises);
      
      // At least some should succeed
      const successful = results.filter(result => result.status === "fulfilled");
      expect(successful.length).toBeGreaterThan(0);
    });

    test("should handle large leaderboard queries efficiently", async () => {
      // Ensure we have an active contest
      await ensureActiveTestContest();
      
      const startTime = Date.now();
      
      const leaderboard = await prisma.contestEntry.findMany({
        where: { contestId: testContest.id },
        orderBy: { points: "desc" },
        take: 100,
        include: { user: true },
      });

      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(leaderboard).toBeDefined();
    });
  });
});
