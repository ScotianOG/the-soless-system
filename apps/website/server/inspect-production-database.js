#!/usr/bin/env node

/**
 * SOLess Production Database Inspector
 *
 * This script connects directly to the production database to inspect contest data
 */

const { PrismaClient } = require("@prisma/client");

// Production database URL
const PRODUCTION_DATABASE_URL =
  "postgresql://ScotianOG:Orson2024@database-soless.cf82ywo8kc1z.us-east-2.rds.amazonaws.com:5432/soless";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DATABASE_URL,
    },
  },
});

async function inspectProductionDatabase() {
  try {
    console.log("🔍 SOLess Production Database Inspector");
    console.log("======================================\n");

    // Connect to production database
    console.log("🔌 Connecting to PRODUCTION database...");
    console.log(
      "📍 Host: database-soless.cf82ywo8kc1z.us-east-2.rds.amazonaws.com"
    );
    await prisma.$connect();
    console.log("✅ Connected successfully to PRODUCTION!\n");

    // Get all users with complete data
    const users = await prisma.user.findMany({
      include: {
        telegramAccount: true,
        discordAccount: true,
        twitterAccount: true,
        streaks: true,
        engagements: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
        pointTransactions: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
        verificationCodes: {
          where: { platform: "TELEGRAM" },
        },
        contestEntries: true,
        rewards: true,
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
                wallet: true,
                telegramUsername: true,
              },
            },
          },
        },
        rewards: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get engagement and point transaction totals
    const totalEngagements = await prisma.engagement.count();
    const totalPointTransactions = await prisma.pointTransaction.count();

    // Summary stats
    console.log("📊 PRODUCTION Database Summary:");
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

    // Detailed user information
    if (users.length > 0) {
      console.log("👥 All Users in PRODUCTION:");
      console.log("===========================");

      users.forEach((user, index) => {
        const lastActiveDate = user.lastActive
          ? new Date(user.lastActive).toLocaleString()
          : "Never";
        const createdDate = new Date(user.createdAt).toLocaleString();

        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Wallet: ${user.wallet}`);
        console.log(
          `   Points: ${user.points} (Lifetime: ${user.lifetimePoints})`
        );
        console.log(`   Best Rank: ${user.bestRank || "N/A"}`);
        console.log(`   Last Active: ${lastActiveDate}`);
        console.log(`   Created: ${createdDate}`);

        // Social accounts
        console.log(`   Social Accounts:`);
        console.log(
          `     • Telegram: ${user.telegramUsername || "None"} ${
            user.telegramAccount
              ? `(ID: ${user.telegramAccount.platformId})`
              : ""
          }`
        );
        console.log(
          `     • Discord: ${user.discordUsername || "None"} ${
            user.discordAccount ? `(ID: ${user.discordAccount.platformId})` : ""
          }`
        );
        console.log(
          `     • Twitter: ${user.twitterUsername || "None"} ${
            user.twitterAccount ? `(ID: ${user.twitterAccount.platformId})` : ""
          }`
        );

        // Recent point transactions
        if (user.pointTransactions.length > 0) {
          console.log(
            `   Recent Point Transactions (${user.pointTransactions.length}):`
          );
          user.pointTransactions.slice(0, 5).forEach((pt, i) => {
            console.log(
              `     ${i + 1}. ${pt.points || "N/A"} points - ${pt.platform} - ${
                pt.type
              } (${new Date(pt.timestamp).toLocaleString()})`
            );
          });
        }

        // Contest entries
        if (user.contestEntries.length > 0) {
          console.log(`   Contest Entries: ${user.contestEntries.length}`);
          user.contestEntries.forEach((entry, i) => {
            console.log(
              `     ${i + 1}. Contest ${entry.contestId} - ${
                entry.points
              } points (Rank: ${entry.rank || "N/A"})`
            );
          });
        }

        console.log("");
      });
    }

    // Contest information
    if (contests.length > 0) {
      console.log("🏆 All Contests in PRODUCTION:");
      console.log("==============================");

      contests.forEach((contest, index) => {
        const startDate = new Date(contest.startTime).toLocaleString();
        const endDate = new Date(contest.endTime).toLocaleString();
        const createdDate = new Date(contest.createdAt).toLocaleString();
        const isActive = contest.status === "ACTIVE";

        console.log(
          `${index + 1}. Contest: ${contest.name || "Unnamed"} ${
            isActive ? "🔴 ACTIVE" : ""
          }`
        );
        console.log(`   ID: ${contest.id}`);
        console.log(`   Status: ${contest.status}`);
        console.log(`   Start: ${startDate}`);
        console.log(`   End: ${endDate}`);
        console.log(`   Created: ${createdDate}`);
        console.log(`   Entries: ${contest.entries.length}`);
        console.log(`   Rewards: ${contest.rewards.length}`);

        if (contest.entries.length > 0) {
          console.log(`   Participants:`);
          contest.entries.forEach((entry, i) => {
            console.log(
              `     ${i + 1}. ${
                entry.user.telegramUsername || entry.user.wallet
              } - ${entry.points} points (Rank: ${entry.rank || "N/A"})`
            );
          });
        }
        console.log("");
      });
    }

    // Check for sveng0x specifically
    const svengUser = users.find(
      (u) =>
        u.telegramUsername?.toLowerCase().includes("sveng") ||
        u.wallet?.toLowerCase().includes("sveng")
    );

    if (svengUser) {
      console.log("🎯 Found sveng0x User:");
      console.log("======================");
      console.log(`   User ID: ${svengUser.id}`);
      console.log(`   Wallet: ${svengUser.wallet}`);
      console.log(`   Telegram Username: ${svengUser.telegramUsername}`);
      console.log(`   Points: ${svengUser.points} (Expected: 7)`);
      console.log(`   Lifetime Points: ${svengUser.lifetimePoints}`);
      console.log(
        `   Last Active: ${
          svengUser.lastActive
            ? new Date(svengUser.lastActive).toLocaleString()
            : "Never"
        }`
      );
      console.log(
        `   Created: ${new Date(svengUser.createdAt).toLocaleString()}`
      );
    } else {
      console.log("❌ sveng0x user not found in production database");
    }
  } catch (error) {
    console.error("❌ Error inspecting production database:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed.");
  }
}

if (require.main === module) {
  inspectProductionDatabase();
}

module.exports = { inspectProductionDatabase };
