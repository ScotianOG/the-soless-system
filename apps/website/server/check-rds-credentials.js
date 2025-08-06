#!/usr/bin/env node

/**
 * Check RDS Configuration and Help Reset Password
 */

console.log("🔍 RDS Credential Troubleshooting");
console.log("=================================\n");

console.log("✅ GREAT NEWS: Port 5432 is reachable!");
console.log("❌ ISSUE: Database credentials are incorrect\n");

console.log("🎯 SOLUTIONS TO TRY:\n");

console.log("📋 Option 1: Check AWS Console for Credentials");
console.log("1. Go to AWS Console → RDS → Databases");
console.log('2. Click on "soless-db"');
console.log('3. Check the "Configuration" tab for:');
console.log('   • Master username (probably "postgres", "admin", or "soless")');
console.log('   • Database name (should be "soless")');
console.log("   • Endpoint (should match what we're using)\n");

console.log("📋 Option 2: Reset RDS Password");
console.log("1. In AWS Console → RDS → Databases → soless-db");
console.log('2. Click "Modify"');
console.log('3. Scroll to "Database authentication"');
console.log('4. Check "New master password"');
console.log("5. Set a new password (write it down!)");
console.log('6. Click "Continue" → "Modify DB instance"');
console.log("7. Wait 5-10 minutes for changes to apply\n");

console.log("📋 Option 3: Check Environment Variables");
console.log("Your current .env.production might have the correct credentials:");

try {
  require("dotenv").config({ path: ".env.production" });

  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;

    // Extract credentials from DATABASE_URL
    const urlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = dbUrl.match(urlPattern);

    if (match) {
      const [, username, password, host, port, database] = match;
      console.log(`   Username: ${username}`);
      console.log(
        `   Password: ${password.slice(0, 3)}... (${password.length} chars)`
      );
      console.log(`   Host: ${host}`);
      console.log(`   Port: ${port}`);
      console.log(`   Database: ${database}`);

      console.log("\n🧪 Let me test these exact credentials...");

      const { PrismaClient } = require("@prisma/client");

      async function testEnvCredentials() {
        try {
          const prisma = new PrismaClient({
            datasources: {
              db: {
                url: dbUrl,
              },
            },
          });

          await prisma.$connect();
          console.log("🎉 SUCCESS! Your .env.production credentials work!");

          // Quick data check
          const userCount = await prisma.user.count();
          const contestCount = await prisma.contest.count();

          console.log(`\n📊 DATA FOUND:`);
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

            console.log("\n👥 Sample users:");
            users.forEach((user) => {
              console.log(`   • ${user.username}: ${user.totalPoints} points`);
            });
          }

          await prisma.$disconnect();
          return true;
        } catch (error) {
          console.log(
            `❌ .env.production credentials failed: ${error.message}`
          );
          return false;
        }
      }

      testEnvCredentials().then((success) => {
        if (!success) {
          console.log(
            "\n💡 Try Option 2 (reset password) or check AWS Console for correct credentials"
          );
        }
      });
    } else {
      console.log("   ❌ Invalid DATABASE_URL format in .env.production");
    }
  } else {
    console.log("   ❌ No DATABASE_URL found in .env.production");
  }
} catch (error) {
  console.log(`   ❌ Error reading .env.production: ${error.message}`);
}

console.log("\n📋 Option 4: Manual Credential Test");
console.log("If you know the username and password, create a test:");
console.log("");
console.log(
  'const testUrl = "postgresql://USERNAME:PASSWORD@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless";'
);
console.log("// Replace USERNAME and PASSWORD with actual values");
console.log("");

console.log(
  "🔄 Once you have working credentials, update your .env.production and run:"
);
console.log("node inspect-contest-data.js");
