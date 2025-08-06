#!/usr/bin/env node

/**
 * Check the soless-db database for your production data
 */

const { PrismaClient } = require("@prisma/client");

async function checkSolessDbDatabase() {
  console.log("🔍 Checking soless-db Database for Your Data");
  console.log("============================================\n");

  // Test the soless-db database (this might have your data!)
  const solessDbUrl =
    "postgresql://soless_admin:SolessAdmin2025!@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless-db";

  console.log(
    "📋 Testing soless-db database (this might have your production data)..."
  );
  console.log(
    "   URL: postgresql://soless_admin:***@...rds.amazonaws.com:5432/soless-db"
  );
  console.log("");

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: solessDbUrl,
        },
      },
    });

    await prisma.$connect();
    console.log("✅ Connected to soless-db database successfully!\n");

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

    // Check for tables
    console.log("\n📊 Checking for tables...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`Found ${tables.length} tables:`);

    if (tables.length > 0) {
      tables.forEach((table) => {
        console.log(`   • ${table.table_name}`);
      });

      // Check for your Soless application tables
      const hasUserTable = tables.some((t) => t.table_name === "User");
      const hasContestTable = tables.some((t) => t.table_name === "Contest");
      const hasEngagementTable = tables.some(
        (t) => t.table_name === "Engagement"
      );

      if (hasUserTable && hasContestTable) {
        console.log("\n🎉 FOUND YOUR SOLESS APPLICATION TABLES!");
        console.log(
          "This appears to be your production database with user data!\n"
        );

        // Get data counts
        const userCount = await prisma.user.count();
        const contestCount = await prisma.contest.count();
        const engagementCount = await prisma.engagement.count();
        const pointTransactionCount = await prisma.pointTransaction.count();

        console.log("📊 Data Summary:");
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
              u.username.toLowerCase().includes("scotia") ||
              u.username.toLowerCase().includes("og")
          );

          const sveng0x = users.find(
            (u) =>
              u.username.toLowerCase().includes("sveng") ||
              u.username.toLowerCase().includes("0x")
          );

          if (scotianOG) {
            console.log(
              `\n🎯 FOUND SCOTIANOL: ${scotianOG.username} with ${scotianOG.totalPoints} points!`
            );
          }

          if (sveng0x) {
            console.log(
              `🎯 FOUND SVENG0X: ${sveng0x.username} with ${sveng0x.totalPoints} points!`
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

        console.log("\n🎉 SUCCESS! Found your production data!");
        console.log("\n✅ CORRECT DATABASE_URL for production:");
        console.log(`DATABASE_URL="${solessDbUrl}"`);

        console.log("\n🔧 Next steps:");
        console.log(
          "1. Update your .env.production to use soless-db instead of soless"
        );
        console.log("2. Then you can safely run contest cleanup if needed");
      } else {
        console.log(
          "\n📋 This database has tables but not your Soless application schema"
        );
        console.log(
          "Tables found:",
          tables.map((t) => t.table_name).join(", ")
        );
      }
    } else {
      console.log("   No tables found - empty database");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Connection to soless-db failed:", error.message);

    if (error.message.includes("does not exist")) {
      console.log("\n💡 soless-db database also doesn't exist");
      console.log(
        "Your data might be in the postgres database or another location"
      );
    }
  }
}

if (require.main === module) {
  checkSolessDbDatabase();
}
