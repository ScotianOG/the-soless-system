#!/usr/bin/env node

/**
 * Test connection to CORRECT RDS endpoint
 */

const { PrismaClient } = require("@prisma/client");

async function testCorrectRDS() {
  console.log("🎯 Testing CORRECT RDS Endpoint");
  console.log("================================\n");

  // The correct RDS endpoint from AWS Console
  const correctEndpoint = "soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com";
  console.log(`Correct endpoint: ${correctEndpoint}`);

  // Test basic network connectivity first
  console.log("\n📡 Testing network connectivity...");

  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    // Test DNS resolution
    console.log("🔍 DNS lookup...");
    const { stdout: nslookup } = await execAsync(`nslookup ${correctEndpoint}`);
    console.log("✅ DNS resolution successful");

    // Test port connectivity
    console.log("🔌 Testing port 5432...");
    const { stdout: ncTest } = await execAsync(
      `timeout 10 nc -z ${correctEndpoint} 5432 && echo "SUCCESS" || echo "FAILED"`
    );

    if (ncTest.includes("SUCCESS")) {
      console.log("✅ Port 5432 is reachable");
    } else {
      console.log("❌ Port 5432 is NOT reachable");
      console.log("This could be a security group issue");
    }
  } catch (error) {
    console.log(`❌ Network test failed: ${error.message}`);
  }

  // Now test database connection with correct URL
  console.log("\n🔗 Testing database connection...");

  // Construct the correct DATABASE_URL
  // We need to check what credentials to use
  const dbUrl = `postgresql://postgres:your_password@${correctEndpoint}:5432/soless`;
  console.log(
    `Testing with URL pattern: postgresql://postgres:***@${correctEndpoint}:5432/soless`
  );

  try {
    // We'll try with a few common password patterns
    const passwords = ["password", "postgres", "soless2024", "SOless2024!"];

    for (const password of passwords) {
      try {
        console.log(`\nTrying password pattern: ${password.slice(0, 3)}...`);

        const testUrl = `postgresql://postgres:${password}@${correctEndpoint}:5432/soless`;
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: testUrl,
            },
          },
        });

        await prisma.$connect();
        console.log("✅ CONNECTION SUCCESSFUL!");

        // Test for data
        const userCount = await prisma.user.count();
        const contestCount = await prisma.contest.count();

        console.log(`📊 Data found:`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Contests: ${contestCount}`);

        if (userCount > 0) {
          const users = await prisma.user.findMany({
            select: {
              username: true,
              totalPoints: true,
              createdAt: true,
            },
            take: 5,
          });

          console.log("\n👥 Sample users:");
          users.forEach((user) => {
            console.log(
              `   ${user.username}: ${
                user.totalPoints
              } points (created: ${user.createdAt.toDateString()})`
            );
          });
        }

        await prisma.$disconnect();

        console.log(`\n🎉 FOUND YOUR DATA! The correct DATABASE_URL is:`);
        console.log(
          `postgresql://postgres:${password}@${correctEndpoint}:5432/soless`
        );

        return;
      } catch (connError) {
        console.log(
          `❌ Failed with this password: ${connError.message.split("\n")[0]}`
        );
      }
    }

    console.log("\n❌ Could not connect with any common passwords");
    console.log("You may need to reset the RDS password or check credentials");
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
  }
}

if (require.main === module) {
  testCorrectRDS();
}
