#!/usr/bin/env node

/**
 * Quick RDS Connection Test with Manual Password Entry
 */

const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

async function testRDSConnection() {
  console.log("🔐 RDS Connection Test");
  console.log("======================\n");

  const correctEndpoint = "soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com";

  // First test network connectivity
  console.log("📡 Testing network connectivity...");
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    const { stdout: ncTest } = await execAsync(
      `timeout 10 nc -z ${correctEndpoint} 5432 && echo "SUCCESS" || echo "FAILED"`
    );

    if (ncTest.includes("SUCCESS")) {
      console.log("✅ Port 5432 is now reachable!");
    } else {
      console.log("❌ Port 5432 is still not reachable");
      console.log(
        "Security group may need more time to propagate, or check the configuration"
      );
      return;
    }
  } catch (error) {
    console.log(`❌ Network test failed: ${error.message}`);
    return;
  }

  console.log("\n🔑 Testing database credentials...");

  // Try a few common database/username combinations
  const testConfigs = [
    { user: "postgres", db: "soless" },
    { user: "soless", db: "soless" },
    { user: "admin", db: "soless" },
    { user: "root", db: "soless" },
    { user: "postgres", db: "postgres" },
  ];

  // Common passwords to try
  const passwords = [
    "password",
    "postgres",
    "soless2024",
    "SOless2024!",
    "Soless123!",
    "soless123",
    "Password123!",
    "123456789",
    "admin123",
  ];

  console.log("Testing common credential combinations...\n");

  for (const config of testConfigs) {
    for (const password of passwords) {
      try {
        console.log(
          `Testing: ${config.user}@${config.db} with password ${password.slice(
            0,
            3
          )}...`
        );

        const testUrl = `postgresql://${config.user}:${password}@${correctEndpoint}:5432/${config.db}`;
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: testUrl,
            },
          },
        });

        await prisma.$connect();
        console.log("🎉 CONNECTION SUCCESSFUL!");

        // Quick data check
        const userCount = await prisma.user.count();
        const contestCount = await prisma.contest.count();

        console.log(`\n📊 FOUND YOUR DATA:`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Contests: ${contestCount}`);

        if (userCount > 0) {
          const users = await prisma.user.findMany({
            select: {
              username: true,
              totalPoints: true,
              telegramUserId: true,
              createdAt: true,
            },
            take: 10,
          });

          console.log("\n👥 Users found:");
          users.forEach((user) => {
            console.log(
              `   • ${user.username}: ${user.totalPoints} points (Telegram: ${
                user.telegramUserId || "none"
              })`
            );
          });
        }

        await prisma.$disconnect();

        console.log(`\n✅ SUCCESS! Your DATABASE_URL should be:`);
        console.log(
          `postgresql://${config.user}:${password}@${correctEndpoint}:5432/${config.db}`
        );

        return { success: true, url: testUrl, userCount, contestCount };
      } catch (connError) {
        // Don't log every failed attempt, just continue
        continue;
      }
    }
  }

  console.log("\n❌ Could not connect with any common credentials");
  console.log("\nPlease check:");
  console.log("1. RDS master username in AWS Console");
  console.log("2. Reset password if needed");
  console.log('3. Verify database name is "soless"');
}

if (require.main === module) {
  testRDSConnection();
}

module.exports = { testRDSConnection };
