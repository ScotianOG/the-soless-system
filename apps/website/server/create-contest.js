#!/usr/bin/env node

/**
 * Create a new 72-hour contest with dual point system
 */

const { PrismaClient } = require("@prisma/client");

async function createNewContest() {
  console.log("🏆 Creating New 72-Hour Contest");
  console.log("==============================\n");

  const dbUrl =
    "postgresql://soless_admin:SolessAdmin2025!@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless-db";

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    await prisma.$connect();
    console.log("✅ Connected to database\n");

    // End any active contests first
    const activeContests = await prisma.contest.findMany({
      where: { status: "ACTIVE" },
    });

    if (activeContests.length > 0) {
      console.log("🔄 Ending previous active contests...");
      await prisma.contest.updateMany({
        where: { status: "ACTIVE" },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
        },
      });
      console.log(`   ✅ Ended ${activeContests.length} previous contests\n`);
    }

    // Reset all users' contest points to 0 (keep lifetime points)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log(`🔄 Resetting contest points for ${userCount} users...`);
      await prisma.user.updateMany({
        data: {
          points: 0, // Reset contest points to 0
          // lifetimePoints stays the same
        },
      });
      console.log(
        "   ✅ All contest points reset to 0 (lifetime points preserved)\n"
      );
    }

    // Create new 72-hour contest
    const now = new Date();
    const endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now

    const newContest = await prisma.contest.create({
      data: {
        name: `72-Hour Contest - ${now.toDateString()}`,
        description:
          "Compete for points over 72 hours! Contest points reset each period, but lifetime points accumulate forever.",
        startTime: now,
        endTime: endTime,
        status: "ACTIVE",
        rules: {
          maxParticipants: 1000,
          entryFee: 0,
          requirements: {
            minFollowers: 0,
            requireTwitter: true,
            requireTelegram: true,
            requireDiscord: false,
          },
        },
      },
    });

    console.log("🎉 NEW CONTEST CREATED!");
    console.log(`   Contest ID: ${newContest.id}`);
    console.log(`   Name: ${newContest.name}`);
    console.log(`   Start: ${newContest.startTime.toLocaleString()}`);
    console.log(`   End: ${newContest.endTime.toLocaleString()}`);
    console.log(`   Duration: 72 hours`);
    console.log("");

    console.log("📋 Contest System Ready:");
    console.log("   • Users register once, auto-participate in all contests");
    console.log("   • Contest points reset every 72 hours");
    console.log("   • Lifetime points accumulate forever");
    console.log("   • New leaderboard competition every 72 hours");
    console.log("");

    console.log("🚀 Ready for testing!");
    console.log("   1. Users can now register and verify socials");
    console.log("   2. They earn contest points for engagement");
    console.log("   3. Leaderboard shows current 72-hour competition");
    console.log(
      "   4. In 72 hours, contest points reset but lifetime points remain"
    );

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Failed to create contest:", error.message);
  }
}

if (require.main === module) {
  createNewContest();
}
