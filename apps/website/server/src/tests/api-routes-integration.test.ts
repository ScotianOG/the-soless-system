// API Routes Integration Tests for Engagement Contest System
import request from "supertest";
import express from "express";
import { PrismaClient, ContestStatus } from "@prisma/client";
import { contestRouter } from "../routes/contests";
import { requireAuth } from "../middleware/auth";

// Mock auth middleware for testing
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: "test-user-1", wallet: "test-wallet-1" };
  next();
};

describe("Contest API Routes Integration Tests", () => {
  let app: express.Application;
  let prisma: PrismaClient;
  let testUsers: any[] = [];
  let testContest: any;

  beforeAll(async () => {
    const testDbUrl = process.env.DATABASE_URL || "postgresql://ScotianOG:Orson2024@localhost:5432/test_db";
    
    prisma = new PrismaClient({
      datasources: {
        db: { url: testDbUrl },
      },
    });

    await prisma.$connect();

    // Set up Express app with routes
    app = express();
    app.use(express.json());
    
    // Replace auth middleware with mock for testing
    jest.doMock("../middleware/auth", () => ({
      requireAuth: mockAuth,
    }));
    
    app.use("/api/contests", contestRouter);

    // Clean up and create test data
    await cleanupTestData();
    await createTestData();
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
      where: { name: { contains: "API Test Contest" } },
    });
    
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  }

  async function createTestData() {
    // Create test users
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({
        data: {
          id: `api-test-user-${i}`,
          wallet: `api-test-wallet-${i}`,
          points: (i + 1) * 25,
          lifetimePoints: (i + 1) * 25,
          telegramUsername: `apitestuser${i}`,
          lastActive: new Date(),
        },
      });
      testUsers.push(user);
    }

    // Create test contest
    testContest = await prisma.contest.create({
      data: {
        name: "API Test Contest",
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ends tomorrow
        status: ContestStatus.ACTIVE,
        description: "Test contest for API testing",
        rules: { minPoints: 10 },
      },
    });

    // Create contest entries
    for (let i = 0; i < testUsers.length; i++) {
      await prisma.contestEntry.create({
        data: {
          contestId: testContest.id,
          userId: testUsers[i].id,
          points: (i + 1) * 30,
          rank: i + 1,
        },
      });
    }

    // Create some rewards
    await prisma.contestReward.create({
      data: {
        contestId: testContest.id,
        userId: testUsers[0].id,
        type: "USDC",
        status: "PENDING",
        amount: "100",
        description: "First place reward",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  describe("GET /api/contests/current", () => {
    test("should return current active contest", async () => {
      const response = await request(app)
        .get("/api/contests/current")
        .expect(200);

      expect(response.body).toHaveProperty("contest");
      expect(response.body.contest).toHaveProperty("id");
      expect(response.body.contest.status).toBe("ACTIVE");
      expect(response.body.contest.name).toBe("API Test Contest");
    });

    test("should handle no active contest gracefully", async () => {
      // End the current contest
      await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: ContestStatus.COMPLETED },
      });

      const response = await request(app)
        .get("/api/contests/current")
        .expect(200);

      expect(response.body.contest).toBeNull();

      // Restore active contest for other tests
      await prisma.contest.update({
        where: { id: testContest.id },
        data: { status: ContestStatus.ACTIVE },
      });
    });
  });

  describe("GET /api/contests/entries/:wallet", () => {
    test("should return user contest entries", async () => {
      const wallet = testUsers[0].wallet;
      const response = await request(app)
        .get(`/api/contests/entries/${wallet}`)
        .expect(200);

      expect(response.body).toHaveProperty("entries");
      expect(Array.isArray(response.body.entries)).toBe(true);
      expect(response.body.entries.length).toBeGreaterThan(0);
      expect(response.body.entries[0]).toHaveProperty("points");
      expect(response.body.entries[0]).toHaveProperty("rank");
    });

    test("should validate wallet parameter format", async () => {
      const response = await request(app)
        .get("/api/contests/entries/invalid-wallet")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should return empty array for user with no entries", async () => {
      const response = await request(app)
        .get("/api/contests/entries/nonexistent-wallet-address123456")
        .expect(200);

      expect(response.body).toHaveProperty("entries");
      expect(response.body.entries).toEqual([]);
    });
  });

  describe("GET /api/contests/:id/leaderboard", () => {
    test("should return contest leaderboard", async () => {
      const response = await request(app)
        .get(`/api/contests/${testContest.id}/leaderboard`)
        .expect(200);

      expect(response.body).toHaveProperty("leaderboard");
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
      expect(response.body.leaderboard.length).toBeGreaterThan(0);
      
      // Check ordering (highest points first)
      const leaderboard = response.body.leaderboard;
      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].points).toBeGreaterThanOrEqual(leaderboard[i].points);
      }
    });

    test("should validate UUID format for contest ID", async () => {
      const response = await request(app)
        .get("/api/contests/invalid-uuid/leaderboard")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should handle non-existent contest", async () => {
      const fakeUuid = "12345678-1234-1234-1234-123456789012";
      const response = await request(app)
        .get(`/api/contests/${fakeUuid}/leaderboard`)
        .expect(200);

      expect(response.body).toHaveProperty("leaderboard");
      expect(response.body.leaderboard).toEqual([]);
    });
  });

  describe("GET /api/contests/rewards/:wallet", () => {
    test("should return user rewards", async () => {
      const wallet = testUsers[0].wallet;
      const response = await request(app)
        .get(`/api/contests/rewards/${wallet}`)
        .expect(200);

      expect(response.body).toHaveProperty("rewards");
      expect(Array.isArray(response.body.rewards)).toBe(true);
      expect(response.body.rewards.length).toBeGreaterThan(0);
      expect(response.body.rewards[0]).toHaveProperty("type");
      expect(response.body.rewards[0]).toHaveProperty("status");
      expect(response.body.rewards[0]).toHaveProperty("amount");
    });

    test("should validate wallet parameter", async () => {
      const response = await request(app)
        .get("/api/contests/rewards/bad-wallet")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/contests/rewards/claim", () => {
    test("should claim a pending reward", async () => {
      const reward = await prisma.contestReward.findFirst({
        where: { 
          userId: testUsers[0].id,
          status: "PENDING"
        },
      });

      expect(reward).toBeDefined();

      const response = await request(app)
        .post("/api/contests/rewards/claim")
        .send({ rewardId: reward!.id })
        .expect(200);

      expect(response.body).toHaveProperty("success");
      
      // Verify reward was claimed
      const updatedReward = await prisma.contestReward.findUnique({
        where: { id: reward!.id },
      });
      
      expect(updatedReward?.status).toBe("CLAIMED");
      expect(updatedReward?.claimedAt).toBeDefined();
    });

    test("should validate reward ID format", async () => {
      const response = await request(app)
        .post("/api/contests/rewards/claim")
        .send({ rewardId: "invalid-uuid" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should handle non-existent reward", async () => {
      const fakeUuid = "12345678-1234-1234-1234-123456789012";
      const response = await request(app)
        .post("/api/contests/rewards/claim")
        .send({ rewardId: fakeUuid })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    test("should prevent claiming already claimed reward", async () => {
      // Find a claimed reward
      const claimedReward = await prisma.contestReward.findFirst({
        where: { 
          userId: testUsers[0].id,
          status: "CLAIMED"
        },
      });

      if (claimedReward) {
        const response = await request(app)
          .post("/api/contests/rewards/claim")
          .send({ rewardId: claimedReward.id })
          .expect(400);

        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toContain("already claimed");
      }
    });
  });

  describe("Admin Routes", () => {
    describe("POST /api/contests/start", () => {
      test("should create new contest with valid data", async () => {
        // First, end current contest
        await prisma.contest.update({
          where: { id: testContest.id },
          data: { status: ContestStatus.COMPLETED },
        });

        const newContestData = {
          name: "New API Test Contest",
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          rules: { minPoints: 20 },
        };

        const response = await request(app)
          .post("/api/contests/start")
          .send(newContestData)
          .expect(200);

        expect(response.body).toHaveProperty("contest");
        expect(response.body.contest.name).toBe(newContestData.name);
        expect(response.body.contest.status).toBe("ACTIVE");

        // Clean up
        await prisma.contest.delete({
          where: { id: response.body.contest.id },
        });
      });

      test("should validate required fields", async () => {
        const response = await request(app)
          .post("/api/contests/start")
          .send({ name: "Invalid Contest" }) // Missing endTime
          .expect(400);

        expect(response.body).toHaveProperty("error");
      });

      test("should validate endTime format", async () => {
        const response = await request(app)
          .post("/api/contests/start")
          .send({
            name: "Invalid Contest",
            endTime: "not-a-date",
          })
          .expect(400);

        expect(response.body).toHaveProperty("error");
      });
    });

    describe("POST /api/contests/:id/end", () => {
      test("should end active contest", async () => {
        // Create a contest to end
        const contestToEnd = await prisma.contest.create({
          data: {
            name: "Contest To End",
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: ContestStatus.ACTIVE,
          },
        });

        const response = await request(app)
          .post(`/api/contests/${contestToEnd.id}/end`)
          .expect(200);

        expect(response.body).toHaveProperty("contest");
        expect(response.body.contest.status).toBe("COMPLETED");

        // Clean up
        await prisma.contest.delete({
          where: { id: contestToEnd.id },
        });
      });

      test("should validate contest ID format", async () => {
        const response = await request(app)
          .post("/api/contests/invalid-uuid/end")
          .expect(400);

        expect(response.body).toHaveProperty("error");
      });
    });

    describe("POST /api/contests/:id/distribute-rewards", () => {
      test("should distribute rewards for completed contest", async () => {
        const response = await request(app)
          .post(`/api/contests/${testContest.id}/distribute-rewards`)
          .expect(200);

        expect(response.body).toHaveProperty("result");
        
        // Verify rewards were created
        const rewards = await prisma.contestReward.findMany({
          where: { contestId: testContest.id },
        });
        
        expect(rewards.length).toBeGreaterThan(0);
      });

      test("should validate contest ID format", async () => {
        const response = await request(app)
          .post("/api/contests/invalid-uuid/distribute-rewards")
          .expect(400);

        expect(response.body).toHaveProperty("error");
      });
    });
  });

  describe("GET /api/contests (Admin)", () => {
    test("should return all contests for admin", async () => {
      const response = await request(app)
        .get("/api/contests")
        .expect(200);

      expect(response.body).toHaveProperty("contests");
      expect(Array.isArray(response.body.contests)).toBe(true);
      expect(response.body.contests.length).toBeGreaterThan(0);
      expect(response.body.contests[0]).toHaveProperty("id");
      expect(response.body.contests[0]).toHaveProperty("name");
      expect(response.body.contests[0]).toHaveProperty("status");
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      // Mock a database error by using an invalid query
      jest.spyOn(prisma.contest, "findFirst").mockRejectedValueOnce(new Error("Database connection failed"));

      const response = await request(app)
        .get("/api/contests/current")
        .expect(500);

      expect(response.body).toHaveProperty("error");

      // Restore the mock
      jest.restoreAllMocks();
    });

    test("should validate request body for POST requests", async () => {
      const response = await request(app)
        .post("/api/contests/rewards/claim")
        .send({}) // Empty body
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/api/contests/rewards/claim")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400);
    });
  });

  describe("Rate Limiting and Security", () => {
    test("should accept valid wallet addresses", async () => {
      const validWallet = "1234567890123456789012345678901234567890123"; // 43 chars, alphanumeric
      const response = await request(app)
        .get(`/api/contests/entries/${validWallet}`)
        .expect(200);

      expect(response.body).toHaveProperty("entries");
    });

    test("should reject wallet addresses that are too short", async () => {
      const shortWallet = "12345"; // Too short
      const response = await request(app)
        .get(`/api/contests/entries/${shortWallet}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    test("should reject wallet addresses with invalid characters", async () => {
      const invalidWallet = "1234567890123456789012345678901234567890@#$"; // Invalid chars
      const response = await request(app)
        .get(`/api/contests/entries/${invalidWallet}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
