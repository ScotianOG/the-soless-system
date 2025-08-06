#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

async function checkCurrentData() {
  console.log("🔍 Checking Current Database State");
  console.log("==================================\n");

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

    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Total users: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          wallet: true,
          points: true,
          lifetimePoints: true,
          twitterUsername: true,
          telegramUsername: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      console.log("\n📋 Recent users:");
      users.forEach((user) => {
        console.log(`   Wallet: ${user.wallet}`);
        console.log(
          `   Points: ${user.points} (Contest) | ${
            user.lifetimePoints || 0
          } (Lifetime)`
        );
        console.log(`   Twitter: ${user.twitterUsername || "Not verified"}`);
        console.log(`   Telegram: ${user.telegramUsername || "Not verified"}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log("   ---");
      });
    }

    // Check contests
    const contestCount = await prisma.contest.count();
    console.log(`\n🏆 Total contests: ${contestCount}`);

    if (contestCount > 0) {
      const activeContests = await prisma.contest.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      console.log(`\n🎯 Active contests: ${activeContests.length}`);
      activeContests.forEach((contest) => {
        console.log(`   ${contest.name} (${contest.status})`);
        console.log(`   Start: ${contest.startTime.toLocaleString()}`);
        console.log(`   End: ${contest.endTime.toLocaleString()}`);
      });
    }

    // Check engagements
    const engagementCount = await prisma.engagement.count();
    console.log(`\n📊 Total engagements: ${engagementCount}`);

    // Check point transactions
    const pointTransactionCount = await prisma.pointTransaction.count();
    console.log(`💰 Total point transactions: ${pointTransactionCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error checking data:", error.message);
  }
}

if (require.main === module) {
  checkCurrentData();
}
