#!/usr/bin/env node

/**
 * SOLess Complete Database Inspector
 *
 * This script shows all users, engagement data, and any contest-related information
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function inspectCompleteDatabase() {
  try {
    console.log("🔍 SOLess Complete Database Inspector");
    console.log("====================================\n");

    // Connect to database
    console.log("🔌 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Connected successfully\n");

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
          take: 5,
        },
        verificationCodes: {
          where: { platform: "TELEGRAM" },
        },
        contestEntries: true,
        rewards: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get all contests (including completed ones)
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

    // Get all engagement data
    const totalEngagements = await prisma.engagement.count();
    const recentEngagements = await prisma.engagement.findMany({
      include: {
        user: {
          select: {
            wallet: true,
            telegramUsername: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    // Get all point transactions
    const totalPointTransactions = await prisma.pointTransaction.count();
    const recentPointTransactions = await prisma.pointTransaction.findMany({
      include: {
        user: {
          select: {
            wallet: true,
            telegramUsername: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    // Summary stats
    console.log("📊 Complete Database Summary:");
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
      console.log("👥 All Users:");
      console.log("=============");

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

        // Streaks
        if (user.streaks) {
          console.log(`   Streaks:`);
          console.log(
            `     • Telegram: ${user.streaks.telegramStreak} (Last: ${
              user.streaks.lastTelegram
                ? new Date(user.streaks.lastTelegram).toLocaleDateString()
                : "Never"
            })`
          );
          console.log(
            `     • Discord: ${user.streaks.discordStreak} (Last: ${
              user.streaks.lastDiscord
                ? new Date(user.streaks.lastDiscord).toLocaleDateString()
                : "Never"
            })`
          );
          console.log(
            `     • Twitter: ${user.streaks.twitterStreak} (Last: ${
              user.streaks.lastTwitter
                ? new Date(user.streaks.lastTwitter).toLocaleDateString()
                : "Never"
            })`
          );
        }

        // Recent engagements
        if (user.engagements.length > 0) {
          console.log(`   Recent Engagements (${user.engagements.length}):`);
          user.engagements.forEach((eng, i) => {
            console.log(
              `     ${i + 1}. ${eng.platform} - ${eng.type} (${new Date(
                eng.timestamp
              ).toLocaleString()})`
            );
          });
        }

        // Recent point transactions
        if (user.pointTransactions.length > 0) {
          console.log(
            `   Recent Point Transactions (${user.pointTransactions.length}):`
          );
          user.pointTransactions.forEach((pt, i) => {
            console.log(
              `     ${i + 1}. ${pt.points} points - ${pt.platform} - ${
                pt.type
              } (${new Date(pt.timestamp).toLocaleString()})`
            );
          });
        }

        // Contest entries
        if (user.contestEntries.length > 0) {
          console.log(`   Contest Entries: ${user.contestEntries.length}`);
        }

        // Verification codes
        if (user.verificationCodes.length > 0) {
          console.log(
            `   Telegram Verification Codes: ${user.verificationCodes.length}`
          );
          user.verificationCodes.forEach((code, i) => {
            const status = code.isUsed ? "USED" : "UNUSED";
            const expired =
              new Date(code.expiresAt) < new Date() ? "EXPIRED" : "ACTIVE";
            console.log(`     ${i + 1}. ${code.code} - ${status} | ${expired}`);
          });
        }

        console.log("");
      });
    }

    // Contest information
    if (contests.length > 0) {
      console.log("🏆 All Contests:");
      console.log("================");

      contests.forEach((contest, index) => {
        const startDate = new Date(contest.startTime).toLocaleString();
        const endDate = new Date(contest.endTime).toLocaleString();
        const createdDate = new Date(contest.createdAt).toLocaleString();

        console.log(`${index + 1}. Contest: ${contest.name || "Unnamed"}`);
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

    // Recent engagements overview
    if (recentEngagements.length > 0) {
      console.log("🎯 Recent Engagements:");
      console.log("======================");

      recentEngagements.forEach((eng, index) => {
        console.log(
          `${index + 1}. ${
            eng.user?.telegramUsername || eng.user?.wallet || "Unknown User"
          }`
        );
        console.log(`   Platform: ${eng.platform} | Type: ${eng.type}`);
        console.log(`   Time: ${new Date(eng.timestamp).toLocaleString()}`);
        console.log(`   Metadata: ${JSON.stringify(eng.metadata, null, 2)}`);
        console.log("");
      });
    }

    // Recent point transactions overview
    if (recentPointTransactions.length > 0) {
      console.log("💰 Recent Point Transactions:");
      console.log("=============================");

      recentPointTransactions.forEach((pt, index) => {
        console.log(
          `${index + 1}. ${
            pt.user?.telegramUsername || pt.user?.wallet || "Unknown User"
          }`
        );
        console.log(
          `   Points: ${pt.points} | Platform: ${pt.platform} | Type: ${pt.type}`
        );
        console.log(`   Time: ${new Date(pt.timestamp).toLocaleString()}`);
        console.log(`   Contest: ${pt.contestId || "N/A"}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error inspecting database:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed.");
  }
}

if (require.main === module) {
  inspectCompleteDatabase();
}

module.exports = { inspectCompleteDatabase };
