#!/usr/bin/env node

/**
 * Discover correct database name and username
 */

const { PrismaClient } = require("@prisma/client");

async function discoverDatabaseInfo() {
  console.log("🔍 Discovering RDS Database Configuration");
  console.log("=========================================\n");

  const endpoint = "soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com";
  const password = "SolessAdmin2025!";

  // Common username/database combinations to try
  const combinations = [
    { user: "postgres", db: "postgres" }, // Default PostgreSQL
    { user: "soless_admin", db: "postgres" }, // Your user, default DB
    { user: "postgres", db: "soless" }, // Default user, your DB
    { user: "soless_admin", db: "soless_db" }, // Your user, variant DB name
    { user: "admin", db: "postgres" }, // AWS common admin user
    { user: "admin", db: "soless" },
    { user: "soless", db: "soless" },
    { user: "root", db: "postgres" },
  ];

  console.log("🧪 Testing different username/database combinations...\n");

  for (const combo of combinations) {
    const testUrl = `postgresql://${combo.user}:${password}@${endpoint}:5432/${combo.db}`;

    try {
      console.log(`Testing: ${combo.user} → ${combo.db}`);

      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: testUrl,
          },
        },
      });

      await prisma.$connect();
      console.log("✅ CONNECTION SUCCESSFUL!\n");

      // Get database information
      const dbInfo = await prisma.$queryRaw`
        SELECT 
          current_database() as current_db,
          current_user as current_user,
          version() as postgres_version
      `;

      console.log("🏢 Database Information:");
      console.log(`   Current Database: ${dbInfo[0].current_db}`);
      console.log(`   Current User: ${dbInfo[0].current_user}`);
      console.log(
        `   PostgreSQL Version: ${dbInfo[0].postgres_version.split(" ")[0]}`
      );

      // List all databases
      console.log("\n📊 Available Databases:");
      const databases = await prisma.$queryRaw`
        SELECT datname as name 
        FROM pg_database 
        WHERE datistemplate = false
        ORDER BY datname
      `;

      databases.forEach((db) => {
        console.log(`   • ${db.name}`);
      });

      // Check for existing tables
      console.log("\n📋 Tables in current database:");
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;

      if (tables.length > 0) {
        tables.forEach((table) => {
          console.log(`   • ${table.table_name}`);
        });

        // Check for your specific tables
        const hasUserTable = tables.some((t) => t.table_name === "User");
        const hasContestTable = tables.some((t) => t.table_name === "Contest");

        if (hasUserTable && hasContestTable) {
          console.log("\n🎉 FOUND YOUR SOLESS TABLES!");

          // Check for data
          const userCount = await prisma.user.count();
          const contestCount = await prisma.contest.count();

          console.log(`\n📊 Data Summary:`);
          console.log(`   Users: ${userCount}`);
          console.log(`   Contests: ${contestCount}`);

          if (userCount > 0) {
            console.log("\n👥 Users found:");
            const users = await prisma.user.findMany({
              select: {
                username: true,
                totalPoints: true,
                telegramUserId: true,
              },
              take: 10,
            });

            users.forEach((user) => {
              console.log(`   • ${user.username}: ${user.totalPoints} points`);
            });
          }
        }
      } else {
        console.log("   (No tables found - empty database)");
      }

      await prisma.$disconnect();

      console.log("\n✅ CORRECT DATABASE_URL:");
      console.log(`DATABASE_URL="${testUrl}"`);

      // If this database has your data, we're done
      if (tables.some((t) => t.table_name === "User")) {
        console.log("\n🎯 This is your production database with user data!");
        return true;
      }

      console.log(
        "\n⚠️  This database works but may not have your data. Continuing search...\n"
      );
    } catch (error) {
      const errorMsg = error.message.split("\n")[0];
      console.log(`❌ Failed: ${errorMsg}\n`);
      continue;
    }
  }

  console.log("❌ No working combination found");
  console.log("\n💡 Next steps:");
  console.log("1. Check AWS Console → RDS → soless-db → Configuration tab");
  console.log("2. Note the exact Master username");
  console.log("3. If needed, reset the master password");
  console.log("4. Check if there are multiple databases in the instance");

  return false;
}

if (require.main === module) {
  discoverDatabaseInfo();
}
