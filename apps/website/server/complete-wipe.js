#!/usr/bin/env node

/**
 * COMPLETE DATABASE WIPE - Fresh Start for Testing
 *
 * This will delete ALL data and start completely fresh
 */

const { PrismaClient } = require("@prisma/client");

async function completeWipe() {
  console.log("🧹 COMPLETE DATABASE WIPE - FRESH START");
  console.log("======================================\n");

  console.log("⚠️  WARNING: This will delete ALL data permanently!");
  console.log("   • All users");
  console.log("   • All contests");
  console.log("   • All points and transactions");
  console.log("   • All social media connections");
  console.log("   • All engagement data");
  console.log("");

  // Use the correct production database
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
    console.log("✅ Connected to production database\n");

    // Get current data counts
    console.log("📊 Current data before wipe:");
    const userCount = await prisma.user.count();
    const contestCount = await prisma.contest.count();
    const transactionCount = await prisma.pointTransaction.count();
    const engagementCount = await prisma.engagement.count();

    console.log(`   Users: ${userCount}`);
    console.log(`   Contests: ${contestCount}`);
    console.log(`   Point Transactions: ${transactionCount}`);
    console.log(`   Engagements: ${engagementCount}`);
    console.log("");

    console.log("🗑️  Starting complete wipe...");

    // Delete in correct order to respect foreign key constraints
    const tables = [
      "ContestReward",
      "ContestQualification",
      "ContestEntry",
      "Contest",
      "PointHistory",
      "PointTransaction",
      "Engagement",
      "Notification",
      "InviteClaim",
      "InviteLink",
      "UserStreak",
      "VerificationCode",
      "BetaTesterSignup",
      "Document",
      "TelegramAccount",
      "TwitterAccount",
      "DiscordAccount",
      "User",
    ];

    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        console.log(`   ✅ Cleared ${table}`);
      } catch (error) {
        if (error.message.includes("does not exist")) {
          console.log(`   ⚠️  ${table} table doesn't exist - skipping`);
        } else {
          console.log(`   ❌ Error clearing ${table}: ${error.message}`);
        }
      }
    }

    // Reset auto-increment sequences
    console.log("\n🔄 Resetting ID sequences...");
    const sequenceTables = [
      "User",
      "Contest",
      "PointTransaction",
      "Engagement",
    ];

    for (const table of sequenceTables) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER SEQUENCE "${table}_id_seq" RESTART WITH 1`
        );
        console.log(`   ✅ Reset ${table} ID sequence`);
      } catch (error) {
        console.log(
          `   ⚠️  Could not reset ${table} sequence (might not exist)`
        );
      }
    }

    // Verify everything is clean
    console.log("\n🔍 Verifying clean state...");
    const finalUserCount = await prisma.user.count();
    const finalContestCount = await prisma.contest.count();
    const finalTransactionCount = await prisma.pointTransaction.count();

    console.log(`   Users: ${finalUserCount}`);
    console.log(`   Contests: ${finalContestCount}`);
    console.log(`   Transactions: ${finalTransactionCount}`);

    if (
      finalUserCount === 0 &&
      finalContestCount === 0 &&
      finalTransactionCount === 0
    ) {
      console.log("\n🎉 SUCCESS! Database completely wiped clean!");
      console.log("\n📋 Ready for fresh testing with dual-point system:");
      console.log("   • Users can register from scratch");
      console.log("   • Social media verification will be fresh");
      console.log("   • Contest system ready for new 72-hour cycles");
      console.log("   • All IDs will start from 1");
      console.log("\n🏆 Point System Design:");
      console.log(
        "   • Contest Points: Reset every 72 hours (leaderboard competition)"
      );
      console.log(
        "   • Lifetime Points: Accumulate forever (overall achievement)"
      );
      console.log(
        "   • Users register ONCE, auto-participate in all future contests"
      );
      console.log("\n🚀 Your onboarding flow is ready to test!");
    } else {
      console.log("\n⚠️  Some data may remain - check manually");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ WIPE FAILED:", error.message);
    console.error("\nDatabase may be in an inconsistent state!");
  }
}

// Add a safety check
console.log(
  "🚨 SAFETY CHECK: Are you sure you want to wipe ALL production data?"
);
console.log("This action cannot be undone!");
console.log("\nTo proceed, run: node complete-wipe.js --confirm");

if (process.argv.includes("--confirm")) {
  completeWipe();
} else {
  console.log("\n❌ Wipe cancelled. Add --confirm flag to proceed.");
}
