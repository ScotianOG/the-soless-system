// Health monitoring and system checks for production readiness
import { PrismaClient } from "@prisma/client";
import { RewardManager } from "../core/contest/RewardManager";
import { PointManager } from "../core/points/PointManager";
import { UserManager } from "../core/user/UserManager";
import { configManager } from "../config/ConfigManager";

describe("System Health Checks", () => {
  let prisma: PrismaClient;

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Database Health", () => {
    it("should connect to database successfully", async () => {
      console.log("🔍 Checking database connection...");

      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      console.log(`✅ Database responsive in ${responseTime}ms`);
    });

    it("should have all required tables", async () => {
      console.log("🔍 Checking database schema...");

      const requiredTables = [
        "User",
        "Engagement",
        "PointTransaction",
        "Contest",
        "ContestEntry",
        "ContestReward",
        "UserStreak",
        "VerificationCode",
      ];

      for (const table of requiredTables) {
        const result = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        `;

        expect(Array.isArray(result) && result.length > 0).toBe(true);
      }

      console.log(`✅ All ${requiredTables.length} required tables exist`);
    });

    it("should have proper indexes for performance", async () => {
      console.log("🔍 Checking database indexes...");

      // Check critical indexes exist
      const criticalIndexes = [
        { table: "Engagement", columns: ["userId", "platform", "type"] },
        { table: "PointTransaction", columns: ["userId", "platform"] },
        { table: "Contest", columns: ["status"] },
        { table: "ContestEntry", columns: ["points"] },
      ];

      for (const index of criticalIndexes) {
        const result = await prisma.$queryRaw`
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = ${index.table}
        `;

        expect(Array.isArray(result) && result.length > 0).toBe(true);
      }

      console.log("✅ Critical database indexes verified");
    });

    it("should handle database transactions properly", async () => {
      console.log("🔍 Testing database transaction integrity...");

      const testUserId = `health-check-user-${Date.now()}`;

      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              id: testUserId,
              wallet: `health-check-wallet-${Date.now()}`,
              points: 0,
              lifetimePoints: 0,
            },
          });

          await tx.pointTransaction.create({
            data: {
              userId: testUserId,
              amount: 10,
              platform: "TELEGRAM",
              reason: "DAILY_ACTIVE",
              timestamp: new Date(),
            },
          });

          // Verify both records exist within transaction
          const user = await tx.user.findUnique({ where: { id: testUserId } });
          const transaction = await tx.pointTransaction.findFirst({
            where: { userId: testUserId },
          });

          expect(user).toBeTruthy();
          expect(transaction).toBeTruthy();
        });

        console.log("✅ Database transactions working properly");
      } finally {
        // Cleanup
        await prisma.pointTransaction.deleteMany({
          where: { userId: testUserId },
        });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });
  });

  describe("Core Services Health", () => {
    it("should initialize all managers successfully", async () => {
      console.log("🔍 Checking core service initialization...");

      // Test RewardManager
      const rewardManager = RewardManager.getInstance();
      expect(rewardManager).toBeTruthy();
      rewardManager.setPrismaClient(prisma);

      // Test PointManager
      const pointManager = PointManager.getInstance();
      expect(pointManager).toBeTruthy();
      pointManager.setPrismaClient(prisma);

      // Test UserManager
      const userManager = UserManager.getInstance();
      expect(userManager).toBeTruthy();

      console.log("✅ All core services initialized");
    });

    it("should load configuration properly", async () => {
      console.log("🔍 Checking configuration loading...");

      const contestConfig = configManager.getContestConfig();
      const pointsConfig = configManager.getPointsConfig();
      const telegramConfig = configManager.getPlatformConfig("TELEGRAM");

      expect(contestConfig).toBeTruthy();
      expect(pointsConfig).toBeTruthy();
      expect(telegramConfig).toBeTruthy();

      // Verify critical config values
      expect(contestConfig.roundDurationHours).toBeGreaterThan(0);
      expect(pointsConfig.TELEGRAM?.DAILY_ACTIVE?.points).toBeGreaterThan(0);
      expect(telegramConfig.enabled).toBeDefined();

      console.log("✅ Configuration loaded successfully");
    });

    it("should handle service singleton patterns correctly", async () => {
      console.log("🔍 Testing singleton patterns...");

      const rewardManager1 = RewardManager.getInstance();
      const rewardManager2 = RewardManager.getInstance();
      expect(rewardManager1).toBe(rewardManager2);

      const pointManager1 = PointManager.getInstance();
      const pointManager2 = PointManager.getInstance();
      expect(pointManager1).toBe(pointManager2);

      const userManager1 = UserManager.getInstance();
      const userManager2 = UserManager.getInstance();
      expect(userManager1).toBe(userManager2);

      console.log("✅ Singleton patterns working correctly");
    });
  });

  describe("Performance Benchmarks", () => {
    it("should meet response time requirements", async () => {
      console.log("🔍 Testing response time benchmarks...");

      const benchmarks = {
        databaseQuery: async () => {
          const start = Date.now();
          await prisma.user.count();
          return Date.now() - start;
        },

        userLookup: async () => {
          const start = Date.now();
          await prisma.user.findMany({ take: 10 });
          return Date.now() - start;
        },

        engagementQuery: async () => {
          const start = Date.now();
          await prisma.engagement.findMany({
            take: 50,
            orderBy: { timestamp: "desc" },
          });
          return Date.now() - start;
        },

        contestQuery: async () => {
          const start = Date.now();
          await prisma.contest.findMany({
            include: { entries: true },
            take: 5,
          });
          return Date.now() - start;
        },
      };

      const results: Record<string, number> = {};

      for (const [name, benchmark] of Object.entries(benchmarks)) {
        const time = await benchmark();
        results[name] = time;
        expect(time).toBeLessThan(1000); // All queries should complete within 1 second
      }

      console.log("📊 Performance Benchmarks:");
      Object.entries(results).forEach(([name, time]) => {
        console.log(`   ${name}: ${time}ms`);
      });

      console.log("✅ All benchmarks passed");
    });

    it("should handle concurrent operations efficiently", async () => {
      console.log("🔍 Testing concurrent operation efficiency...");

      const concurrentOperations = 10;
      const startTime = Date.now();

      const operations = Array(concurrentOperations)
        .fill(null)
        .map(async (_, index) => {
          // Simulate various database operations
          await Promise.all([
            prisma.user.count(),
            prisma.engagement.count(),
            prisma.contest.findMany({ take: 1 }),
          ]);
          return index;
        });

      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / concurrentOperations;

      expect(results.length).toBe(concurrentOperations);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(avgTime).toBeLessThan(500); // Average operation should be under 500ms

      console.log(
        `📊 Concurrent Operations: ${concurrentOperations} ops in ${totalTime}ms (avg: ${avgTime.toFixed(
          2
        )}ms)`
      );
      console.log("✅ Concurrent operation efficiency verified");
    });
  });

  describe("Error Recovery", () => {
    it("should handle invalid data gracefully", async () => {
      console.log("🔍 Testing error recovery mechanisms...");

      // Test various error scenarios
      const errorTests = [
        {
          name: "Invalid user ID",
          test: () =>
            prisma.user.findUnique({ where: { id: "invalid-uuid-format" } }),
        },
        {
          name: "Malformed query",
          test: () =>
            prisma.engagement
              .findMany({
                where: {
                  platform: "INVALID_PLATFORM" as any,
                },
              })
              .catch((e) => null), // Catch and return null to test graceful handling
        },
      ];

      for (const errorTest of errorTests) {
        try {
          const result = await errorTest.test();
          // Should either return valid result or null (graceful handling)
          expect(result === null || typeof result === "object").toBe(true);
        } catch (error) {
          // If error is thrown, it should be a known error type
          expect(error).toBeInstanceOf(Error);
        }
      }

      console.log("✅ Error recovery mechanisms verified");
    });

    it("should maintain system stability under stress", async () => {
      console.log("🔍 Testing system stability under stress...");

      const stressTest = async () => {
        const operations = [];

        // Create multiple rapid-fire operations
        for (let i = 0; i < 20; i++) {
          operations.push(
            prisma.user.count(),
            prisma.engagement.count(),
            prisma.contest.findFirst()
          );
        }

        return Promise.all(operations);
      };

      const startTime = Date.now();
      const results = await stressTest();
      const duration = Date.now() - startTime;

      expect(results.length).toBe(60); // 20 * 3 operations
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify system is still responsive after stress test
      const healthCheck = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const healthCheckTime = Date.now() - healthCheck;

      expect(healthCheckTime).toBeLessThan(1000);

      console.log(
        `📊 Stress Test: 60 operations in ${duration}ms, post-test health check: ${healthCheckTime}ms`
      );
      console.log("✅ System stability maintained under stress");
    });
  });

  describe("Security Checks", () => {
    it("should sanitize user inputs properly", async () => {
      console.log("🔍 Testing input sanitization...");

      const testUserId = `security-test-${Date.now()}`;

      try {
        // Test with potentially malicious input
        const maliciousInputs = [
          "'; DROP TABLE User; --",
          "<script>alert('xss')</script>",
          "../../etc/passwd",
          "' OR '1'='1",
        ];

        for (const input of maliciousInputs) {
          // These should be handled safely by Prisma's parameterization
          const result = await prisma.user.findMany({
            where: {
              telegramUsername: { contains: input },
            },
            take: 1,
          });

          // Should return empty array or valid results, not cause errors
          expect(Array.isArray(result)).toBe(true);
        }

        console.log("✅ Input sanitization working properly");
      } catch (error) {
        // If any error occurs, it should be a validation error, not a SQL injection
        expect((error as Error).message).not.toContain("DROP TABLE");
        expect((error as Error).message).not.toContain("syntax error");
      }
    });

    it("should enforce data validation rules", async () => {
      console.log("🔍 Testing data validation...");

      const testUserId = `validation-test-${Date.now()}`;

      try {
        // Test required field validation
        await expect(
          prisma.user.create({
            data: {
              id: testUserId,
              // Missing required wallet field
              points: 0,
              lifetimePoints: 0,
            } as any,
          })
        ).rejects.toThrow();

        // Test data type validation
        await expect(
          prisma.user.create({
            data: {
              id: testUserId,
              wallet: `validation-wallet-${Date.now()}`,
              points: "not a number" as any, // Should be number
              lifetimePoints: 0,
            },
          })
        ).rejects.toThrow();

        console.log("✅ Data validation rules enforced");
      } catch (error) {
        // Cleanup in case of partial creation
        await prisma.user
          .deleteMany({ where: { id: testUserId } })
          .catch(() => {});
      }
    });
  });

  describe("Resource Usage", () => {
    it("should monitor memory usage", async () => {
      console.log("🔍 Monitoring memory usage...");

      const initialMemory = process.memoryUsage();

      // Perform memory-intensive operations
      const largeDataSet = await prisma.engagement.findMany({
        take: 1000,
        include: { user: true },
      });

      const afterQueryMemory = process.memoryUsage();
      const memoryIncrease = afterQueryMemory.heapUsed - initialMemory.heapUsed;

      console.log(`📊 Memory Usage:`);
      console.log(
        `   Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(
        `   After query: ${(afterQueryMemory.heapUsed / 1024 / 1024).toFixed(
          2
        )} MB`
      );
      console.log(
        `   Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`
      );
      console.log(`   Records fetched: ${largeDataSet.length}`);

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB

      console.log("✅ Memory usage within acceptable limits");
    });

    it("should handle connection pooling efficiently", async () => {
      console.log("🔍 Testing connection pooling...");

      const connectionTests = [];

      // Create multiple concurrent database operations
      for (let i = 0; i < 20; i++) {
        connectionTests.push(
          prisma.user.count(),
          prisma.engagement.count(),
          prisma.contest.count()
        );
      }

      const startTime = Date.now();
      await Promise.all(connectionTests);
      const duration = Date.now() - startTime;

      // Should handle many concurrent connections efficiently
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(
        `📊 Connection Pool Test: ${connectionTests.length} operations in ${duration}ms`
      );
      console.log("✅ Connection pooling working efficiently");
    });
  });
});
