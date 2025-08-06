#!/usr/bin/env node

/**
 * Quick test with the credentials from .env.production
 */

const { PrismaClient } = require("@prisma/client");

async function testCredentialsFromEnv() {
  console.log("🔑 Testing with .env.production credentials");
  console.log("==========================================\n");

  // The credentials from your .env.production file
  const username = "soless_admin";
  const password = "SolessAdmin2025!";
  const endpoint = "soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com";
  const database = "soless";

  const correctUrl = `postgresql://${username}:${password}@${endpoint}:5432/${database}`;

  console.log("📋 Testing with:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password.slice(0, 6)}...`);
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Database: ${database}`);
  console.log("");

  try {
    console.log("🔌 Connecting to RDS...");

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: correctUrl,
        },
      },
    });

    await prisma.$connect();
    console.log("🎉 CONNECTION SUCCESSFUL!");

    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        version() as postgres_version
    `;

    console.log(`\n🏢 Database Info:`);
    console.log(`   Database: ${dbInfo[0].database_name}`);
    console.log(`   PostgreSQL: ${dbInfo[0].postgres_version.split(" ")[0]}`);

    // Check for data
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
      console.log("\n👥 Found Users:");
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

      users.forEach((user) => {
        const createDate = user.createdAt.toDateString();
        console.log(
          `   • ${user.username}: ${user.totalPoints} points (${createDate})`
        );
      });

      // Check for your specific users
      const scotianOG = users.find(
        (u) =>
          u.username.toLowerCase().includes("scotiand") ||
          u.username.toLowerCase().includes("og")
      );
      const sveng0x = users.find((u) =>
        u.username.toLowerCase().includes("sveng")
      );

      if (scotianOG) {
        console.log(
          `\n🎯 Found ScotianOG-like user: ${scotianOG.username} with ${scotianOG.totalPoints} points`
        );
      }

      if (sveng0x) {
        console.log(
          `🎯 Found sveng0x-like user: ${sveng0x.username} with ${sveng0x.totalPoints} points`
        );
      }
    }

    if (contestCount > 0) {
      console.log("\n🏆 Found Contests:");
      const contests = await prisma.contest.findMany({
        select: {
          id: true,
          title: true,
          isActive: true,
          startDate: true,
          endDate: true,
        },
      });

      contests.forEach((contest) => {
        const status = contest.isActive ? "🟢 ACTIVE" : "🔴 INACTIVE";
        console.log(`   ${status} ${contest.title} (ID: ${contest.id})`);
      });
    }

    await prisma.$disconnect();

    console.log(
      "\n✅ SUCCESS! Your RDS database is working and contains data!"
    );
    console.log(
      "\n🔧 Now update your .env.production with the correct DATABASE_URL:"
    );
    console.log(`DATABASE_URL="${correctUrl}"`);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    if (error.message.includes("password authentication failed")) {
      console.log(
        "\n💡 The password might be wrong. Try resetting it in AWS Console:"
      );
      console.log("1. RDS → Databases → soless-db → Modify");
      console.log("2. Set new master password");
      console.log("3. Apply changes");
    } else if (
      error.message.includes("database") &&
      error.message.includes("does not exist")
    ) {
      console.log("\n💡 The database name might be wrong. Try:");
      console.log('- "postgres" instead of "soless"');
      console.log("- Check database name in AWS Console");
    } else {
      console.log("\n💡 Other possible issues:");
      console.log('- Username might be "postgres" instead of "soless_admin"');
      console.log("- Check RDS configuration in AWS Console");
    }
  }
}

if (require.main === module) {
  testCredentialsFromEnv();
}
