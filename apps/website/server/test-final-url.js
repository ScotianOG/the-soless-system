#!/usr/bin/env node

/**
 * Test the CORRECT DATABASE_URL
 */

const { PrismaClient } = require("@prisma/client");

async function testCorrectURL() {
  console.log("🎯 Testing CORRECT DATABASE_URL");
  console.log("===============================\n");

  // The correct URL from your .env.local
  const correctUrl =
    "postgresql://soless_admin:SolessAdmin2025!@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless";

  console.log("📋 Using URL:");
  console.log(
    "   postgresql://soless_admin:***@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless"
  );
  console.log("");

  try {
    console.log("🔌 Connecting to RDS with correct URL...");

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: correctUrl,
        },
      },
    });

    await prisma.$connect();
    console.log("✅ CONNECTION SUCCESSFUL!\n");

    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `;

    console.log("🏢 Database Information:");
    console.log(`   Database: ${dbInfo[0].database_name}`);
    console.log(`   User: ${dbInfo[0].current_user}`);
    console.log(`   PostgreSQL: ${dbInfo[0].postgres_version.split(" ")[0]}`);

    // Check for data - THIS IS WHERE WE'LL FIND YOUR MISSING USERS!
    console.log("\n📊 Checking for your data...");

    const userCount = await prisma.user.count();
    const contestCount = await prisma.contest.count();
    const engagementCount = await prisma.engagement.count();
    const pointTransactionCount = await prisma.pointTransaction.count();

    console.log(`   Users: ${userCount}`);
    console.log(`   Contests: ${contestCount}`);
    console.log(`   Engagements: ${engagementCount}`);
    console.log(`   Point Transactions: ${pointTransactionCount}`);

    if (userCount > 0) {
      console.log("\n👥 ALL USERS FOUND:");
      const users = await prisma.user.findMany({
        select: {
          username: true,
          totalPoints: true,
          telegramUserId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      users.forEach((user, index) => {
        const createDate = user.createdAt.toDateString();
        const telegramInfo = user.telegramUserId
          ? ` (Telegram: ${user.telegramUserId})`
          : "";
        console.log(
          `   ${index + 1}. ${user.username}: ${
            user.totalPoints
          } points${telegramInfo} - ${createDate}`
        );
      });

      // Look for your specific users
      const scotianOG = users.find(
        (u) =>
          u.username.toLowerCase().includes("scotiand") ||
          u.username.toLowerCase().includes("og") ||
          u.username.toLowerCase().includes("scotia")
      );

      const sveng0x = users.find(
        (u) =>
          u.username.toLowerCase().includes("sveng") ||
          u.username.toLowerCase().includes("0x")
      );

      if (scotianOG) {
        console.log(
          `\n🎯 Found ScotianOG: ${scotianOG.username} with ${scotianOG.totalPoints} points!`
        );
      }

      if (sveng0x) {
        console.log(
          `🎯 Found sveng0x: ${sveng0x.username} with ${sveng0x.totalPoints} points!`
        );
      }
    }

    if (contestCount > 0) {
      console.log("\n🏆 CONTESTS FOUND:");
      const contests = await prisma.contest.findMany({
        select: {
          id: true,
          title: true,
          isActive: true,
          startDate: true,
          endDate: true,
          _count: {
            select: {
              entries: true,
            },
          },
        },
      });

      contests.forEach((contest) => {
        const status = contest.isActive ? "🟢 ACTIVE" : "🔴 INACTIVE";
        const entryCount = contest._count.entries;
        console.log(
          `   ${status} ${contest.title} (ID: ${contest.id}) - ${entryCount} entries`
        );
      });
    }

    await prisma.$disconnect();

    console.log("\n🎉 SUCCESS! Your production data is here!");
    console.log("Now you can safely run the contest cleanup if needed.");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    if (error.message.includes("does not exist")) {
      console.log('\n💡 Database "soless" still doesn\'t exist. Try:');
      console.log("1. Check if you need to create the database first");
      console.log('2. Or try with database name "postgres" instead');
    }
  }
}

if (require.main === module) {
  testCorrectURL();
}
