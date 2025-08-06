#!/usr/bin/env node

/**
 * Connect directly to AWS RDS Production Database
 *
 * This script bypasses local config and connects directly to RDS
 */

const { PrismaClient } = require("@prisma/client");

// Force connection to AWS RDS (your production database)
const RDS_DATABASE_URL =
  "postgresql://ScotianOG:Orson2024@database-soless.cf82ywo8kc1z.us-east-2.rds.amazonaws.com:5432/soless";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: RDS_DATABASE_URL,
    },
  },
});

async function checkRealProduction() {
  console.log("🎯 CONNECTING TO REAL PRODUCTION DATABASE (AWS RDS)");
  console.log("==================================================\n");

  try {
    console.log("🔌 Connecting to AWS RDS...");
    console.log(
      "📍 Host: database-soless.cf82ywo8kc1z.us-east-2.rds.amazonaws.com"
    );
    await prisma.$connect();
    console.log("✅ Connected to AWS RDS successfully!\n");

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        telegramAccount: true,
        pointTransactions: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get all contests
    const contests = await prisma.contest.findMany({
      include: {
        entries: {
          include: {
            user: {
              select: {
                telegramUsername: true,
                wallet: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get totals
    const [totalEngagements, totalPointTransactions] = await Promise.all([
      prisma.engagement.count(),
      prisma.pointTransaction.count(),
    ]);

    console.log("📊 REAL PRODUCTION DATA:");
    console.log(`   • Total Users: ${users.length}`);
    console.log(`   • Total Contests: ${contests.length}`);
    console.log(`   • Total Engagements: ${totalEngagements}`);
    console.log(`   • Total Point Transactions: ${totalPointTransactions}`);

    const totalCurrentPoints = users.reduce(
      (sum, user) => sum + user.points,
      0
    );
    const totalLifetimePoints = users.reduce(
      (sum, user) => sum + user.lifetimePoints,
      0
    );

    console.log(`   • Total Current Points: ${totalCurrentPoints}`);
    console.log(`   • Total Lifetime Points: ${totalLifetimePoints}\n`);

    if (users.length > 0) {
      console.log("👥 PRODUCTION USERS:");
      console.log("====================");

      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.telegramUsername || "No Telegram"}`);
        console.log(`   Wallet: ${user.wallet}`);
        console.log(
          `   Points: ${user.points} (Lifetime: ${user.lifetimePoints})`
        );
        console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
        console.log(
          `   Last Active: ${
            user.lastActive
              ? new Date(user.lastActive).toLocaleString()
              : "Never"
          }`
        );

        if (user.telegramAccount) {
          console.log(`   Telegram ID: ${user.telegramAccount.platformId}`);
        }

        if (user.pointTransactions.length > 0) {
          console.log(`   Recent Points:`);
          user.pointTransactions.slice(0, 3).forEach((pt, i) => {
            console.log(
              `     • ${pt.points || "N/A"} points - ${pt.platform} (${new Date(
                pt.timestamp
              ).toLocaleDateString()})`
            );
          });
        }
        console.log("");
      });
    }

    if (contests.length > 0) {
      console.log("🏆 PRODUCTION CONTESTS:");
      console.log("=======================");

      contests.forEach((contest, index) => {
        const isActive = contest.status === "ACTIVE";
        console.log(
          `${index + 1}. ${contest.name || "Unnamed"} ${
            isActive ? "🔴 ACTIVE" : ""
          }`
        );
        console.log(`   Status: ${contest.status}`);
        console.log(`   Entries: ${contest.entries.length}`);
        console.log(
          `   Start: ${new Date(contest.startTime).toLocaleString()}`
        );
        console.log(`   End: ${new Date(contest.endTime).toLocaleString()}`);

        if (contest.entries.length > 0) {
          console.log(`   Participants:`);
          contest.entries.forEach((entry, i) => {
            console.log(
              `     • ${entry.user.telegramUsername || entry.user.wallet} - ${
                entry.points
              } points`
            );
          });
        }
        console.log("");
      });
    }

    // Look for sveng0x specifically
    const svengUser = users.find(
      (u) =>
        u.telegramUsername?.toLowerCase().includes("sveng") ||
        u.wallet?.toLowerCase().includes("sveng")
    );

    if (svengUser) {
      console.log("🎯 FOUND SVENG0X:");
      console.log("=================");
      console.log(`   Points: ${svengUser.points} (Should be 7)`);
      console.log(`   Lifetime: ${svengUser.lifetimePoints}`);
      console.log(
        `   Created: ${new Date(svengUser.createdAt).toLocaleString()}`
      );
      console.log(
        `   Last Active: ${
          svengUser.lastActive
            ? new Date(svengUser.lastActive).toLocaleString()
            : "Never"
        }`
      );
    }
  } catch (error) {
    console.error("❌ ERROR connecting to AWS RDS:", error.message);
    console.log("\nThis might indicate:");
    console.log("  • Network connectivity issues");
    console.log("  • RDS security group restrictions");
    console.log("  • Database credentials changed");
    console.log("  • RDS instance stopped/terminated");
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed.");
  }
}

if (require.main === module) {
  checkRealProduction();
}

module.exports = { checkRealProduction };
