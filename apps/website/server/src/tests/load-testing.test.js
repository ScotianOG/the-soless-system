"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Load testing for engagement contest system
const client_1 = require("@prisma/client");
const EngagementTrackerFactory_1 = require("../core/engagement/EngagementTrackerFactory");
const PointManager_1 = require("../core/points/PointManager");
const RewardManager_1 = require("../core/contest/RewardManager");
describe("Load Testing - Contest System", () => {
    let prisma;
    let testUsers = [];
    const NUM_USERS = 20;
    const ENGAGEMENTS_PER_USER = 5;
    beforeAll(async () => {
        const testDbUrl = process.env.DATABASE_URL ||
            "postgresql://ScotianOG:Orson2024@localhost:5432/test_db";
        prisma = new client_1.PrismaClient({
            datasources: {
                db: { url: testDbUrl },
            },
        });
        await prisma.$connect();
        // Create test users for load testing
        for (let i = 0; i < NUM_USERS; i++) {
            const user = await prisma.user.create({
                data: {
                    id: `load-test-user-${i}`,
                    wallet: `load-test-wallet-${i}`,
                    points: 0,
                    lifetimePoints: 0,
                    telegramUsername: `loadtestuser${i}`,
                    discordUsername: `loadtestuser${i}`,
                    twitterUsername: `loadtestuser${i}`,
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
        console.log(`✅ Created ${NUM_USERS} test users for load testing`);
    });
    afterAll(async () => {
        try {
            const userIds = testUsers.map((u) => u.id);
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
            await prisma.userStreak.deleteMany({
                where: { userId: { in: userIds } },
            });
            await prisma.user.deleteMany({
                where: { id: { in: userIds } },
            });
            console.log("✅ Load test cleanup completed");
        }
        catch (error) {
            console.error("❌ Error during load test cleanup:", error);
        }
        finally {
            await prisma.$disconnect();
        }
    });
    it("should handle high volume of concurrent engagements", async () => {
        console.log("🚀 Starting load test with concurrent engagements...");
        const startTime = Date.now();
        const platforms = [client_1.Platform.TELEGRAM, client_1.Platform.DISCORD, client_1.Platform.TWITTER];
        const engagementTypes = [
            client_1.EngagementType.MESSAGE,
            client_1.EngagementType.REACTION,
            client_1.EngagementType.DAILY_ACTIVE,
            client_1.EngagementType.QUALITY_POST,
            client_1.EngagementType.CONVERSATION,
        ];
        // Create engagement promises with staggered timing to avoid cooldowns
        const engagementPromises = [];
        for (let userIndex = 0; userIndex < testUsers.length; userIndex++) {
            const user = testUsers[userIndex];
            for (let engagementIndex = 0; engagementIndex < ENGAGEMENTS_PER_USER; engagementIndex++) {
                const platform = platforms[engagementIndex % platforms.length];
                const type = engagementTypes[engagementIndex % engagementTypes.length];
                const tracker = EngagementTrackerFactory_1.EngagementTrackerFactory.getTracker(platform);
                // Stagger the engagements to avoid cooldown conflicts
                const delay = userIndex * 50 + engagementIndex * 200;
                const promise = new Promise(async (resolve) => {
                    setTimeout(async () => {
                        try {
                            const result = await tracker.trackEngagement({
                                platform,
                                userId: user.id,
                                type,
                                timestamp: new Date(Date.now() + delay),
                                metadata: {
                                    loadTestId: `${userIndex}-${engagementIndex}`,
                                    platform: platform,
                                    type: type,
                                },
                            });
                            resolve({ success: true, result });
                        }
                        catch (error) {
                            // Expected for cooldowns and rate limits
                            resolve({
                                success: false,
                                error: error.message,
                                expected: error.message.includes("cooldown") ||
                                    error.message.includes("rate limit"),
                            });
                        }
                    }, delay);
                });
                engagementPromises.push(promise);
            }
        }
        // Wait for all engagements to complete
        const results = await Promise.all(engagementPromises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Analyze results
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;
        const expectedFailures = results.filter((r) => !r.success && r.expected).length;
        const unexpectedFailures = failed - expectedFailures;
        console.log(`📊 Load Test Results:`);
        console.log(`   Total engagements attempted: ${results.length}`);
        console.log(`   Successful: ${successful}`);
        console.log(`   Expected failures (cooldowns/rate limits): ${expectedFailures}`);
        console.log(`   Unexpected failures: ${unexpectedFailures}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Average time per engagement: ${(duration / results.length).toFixed(2)}ms`);
        // Performance assertions
        expect(successful).toBeGreaterThan(0);
        expect(unexpectedFailures).toBe(0);
        expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
        // Verify database consistency
        const totalEngagements = await prisma.engagement.count({
            where: { userId: { in: testUsers.map((u) => u.id) } },
        });
        expect(totalEngagements).toBe(successful);
        console.log(`✅ Database consistency verified: ${totalEngagements} engagements recorded`);
    }, 60000); // 60 second timeout
    it("should maintain performance under sustained load", async () => {
        console.log("🚀 Testing sustained load performance...");
        const pointManager = PointManager_1.PointManager.getInstance();
        pointManager.setPrismaClient(prisma);
        const batches = 5;
        const usersPerBatch = 4;
        const batchResults = [];
        for (let batch = 0; batch < batches; batch++) {
            const batchStart = Date.now();
            const batchUsers = testUsers.slice(batch * usersPerBatch, (batch + 1) * usersPerBatch);
            const batchPromises = batchUsers.map(async (user, index) => {
                try {
                    return await pointManager.processEngagement({
                        userId: user.id,
                        platform: client_1.Platform.TELEGRAM,
                        type: client_1.EngagementType.DAILY_ACTIVE,
                        points: 10,
                        timestamp: new Date(),
                    });
                }
                catch (error) {
                    console.log(`Batch ${batch}, User ${index} error:`, error.message);
                    return false;
                }
            });
            const batchResultArray = await Promise.all(batchPromises);
            const batchDuration = Date.now() - batchStart;
            const successfulInBatch = batchResultArray.filter((r) => r === true).length;
            batchResults.push(batchDuration);
            console.log(`   Batch ${batch + 1}: ${successfulInBatch}/${batchUsers.length} successful in ${batchDuration}ms`);
            // Small delay between batches
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const avgBatchTime = batchResults.reduce((a, b) => a + b, 0) / batchResults.length;
        console.log(`📊 Average batch processing time: ${avgBatchTime.toFixed(2)}ms`);
        // Performance should remain consistent across batches
        const maxBatchTime = Math.max(...batchResults);
        const minBatchTime = Math.min(...batchResults);
        const variance = maxBatchTime - minBatchTime;
        console.log(`📊 Performance variance: ${variance}ms (max: ${maxBatchTime}ms, min: ${minBatchTime}ms)`);
        expect(avgBatchTime).toBeLessThan(5000); // Average batch should complete in under 5 seconds
        expect(variance).toBeLessThan(10000); // Variance shouldn't exceed 10 seconds
        console.log("✅ Sustained load performance test completed");
    }, 60000);
    it("should handle contest lifecycle under load", async () => {
        console.log("🚀 Testing contest lifecycle under load...");
        const rewardManager = RewardManager_1.RewardManager.getInstance();
        rewardManager.setPrismaClient(prisma);
        // Start contest
        const contestStart = Date.now();
        await rewardManager.startNewContest();
        const contestStartTime = Date.now() - contestStart;
        // Simulate rapid user activity
        const activityPromises = testUsers.slice(0, 10).map(async (user, index) => {
            const delay = index * 100; // Stagger to avoid conflicts
            await new Promise((resolve) => setTimeout(resolve, delay));
            try {
                const pointManager = PointManager_1.PointManager.getInstance();
                pointManager.setPrismaClient(prisma);
                return await pointManager.processEngagement({
                    userId: user.id,
                    platform: client_1.Platform.DISCORD,
                    type: client_1.EngagementType.QUALITY_POST,
                    points: 20 + index * 5, // Different point values for ranking
                    timestamp: new Date(),
                });
            }
            catch (error) {
                console.log(`User ${index} activity error:`, error.message);
                return false;
            }
        });
        const activityResults = await Promise.all(activityPromises);
        const successfulActivities = activityResults.filter((r) => r === true).length;
        // End contest
        const contestEndStart = Date.now();
        await rewardManager.endCurrentContest();
        const contestEndTime = Date.now() - contestEndStart;
        console.log(`📊 Contest Lifecycle Performance:`);
        console.log(`   Contest start time: ${contestStartTime}ms`);
        console.log(`   User activities: ${successfulActivities}/${testUsers.slice(0, 10).length} successful`);
        console.log(`   Contest end time: ${contestEndTime}ms`);
        // Verify contest was completed properly
        const completedContest = await prisma.contest.findFirst({
            where: { status: "COMPLETED" },
            include: { entries: true },
            orderBy: { createdAt: "desc" },
        });
        expect(completedContest).toBeTruthy();
        expect(completedContest?.entries.length).toBeGreaterThan(0);
        expect(contestStartTime).toBeLessThan(5000);
        expect(contestEndTime).toBeLessThan(10000);
        console.log("✅ Contest lifecycle performance test completed");
    }, 60000);
    it("should handle memory usage efficiently", async () => {
        console.log("🚀 Testing memory efficiency...");
        const initialMemory = process.memoryUsage();
        // Create a large number of engagement operations
        const operations = [];
        for (let i = 0; i < 100; i++) {
            const user = testUsers[i % testUsers.length];
            const tracker = EngagementTrackerFactory_1.EngagementTrackerFactory.getTracker(client_1.Platform.TWITTER);
            operations.push(async () => {
                try {
                    await tracker.trackEngagement({
                        platform: client_1.Platform.TWITTER,
                        userId: user.id,
                        type: client_1.EngagementType.HASHTAG,
                        timestamp: new Date(Date.now() + i * 100),
                        metadata: { batchId: i, memoryTest: true },
                    });
                    return true;
                }
                catch (error) {
                    return false;
                }
            });
        }
        // Execute operations in smaller batches to control memory usage
        const batchSize = 10;
        let successCount = 0;
        for (let i = 0; i < operations.length; i += batchSize) {
            const batch = operations.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((op) => op()));
            successCount += batchResults.filter((r) => r === true).length;
            // Allow garbage collection between batches
            if (global.gc) {
                global.gc();
            }
        }
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        console.log(`📊 Memory Usage Analysis:`);
        console.log(`   Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Successful operations: ${successCount}/${operations.length}`);
        // Memory increase should be reasonable (less than 50MB for this test)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        expect(successCount).toBeGreaterThan(0);
        console.log("✅ Memory efficiency test completed");
    }, 90000);
});
