#!/usr/bin/env node

/**
 * SOLess Telegram Users Inspector
 *
 * This script shows verified Telegram users and their verification status
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function inspectTelegramUsers() {
  try {
    console.log("🔍 SOLess Telegram Users Inspector");
    console.log("===================================\n");

    // Connect to database
    console.log("🔌 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Connected successfully\n");

    // Get all users with their Telegram data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        wallet: true,
        telegramUsername: true,
        points: true,
        lifetimePoints: true,
        lastActive: true,
        createdAt: true,
        telegramAccount: {
          select: {
            id: true,
            platformId: true,
            username: true,
            createdAt: true,
          },
        },
      },
      where: {
        OR: [
          { telegramUsername: { not: null } },
          { telegramAccount: { isNot: null } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Get verification codes
    const verificationCodes = await prisma.verificationCode.findMany({
      where: { platform: "TELEGRAM" },
      select: {
        id: true,
        userId: true,
        code: true,
        isUsed: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            telegramUsername: true,
            wallet: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    console.log("📊 Telegram Users Summary:");
    console.log(`   • Total users with Telegram data: ${users.length}`);

    const usersWithTelegramAccount = users.filter((u) => u.telegramAccount);
    const usersWithUsername = users.filter((u) => u.telegramUsername);
    const usedVerificationCodes = verificationCodes.filter((v) => v.isUsed);

    console.log(
      `   • Users with TelegramAccount records: ${usersWithTelegramAccount.length}`
    );
    console.log(
      `   • Users with telegramUsername: ${usersWithUsername.length}`
    );
    console.log(
      `   • Verification codes (all time): ${verificationCodes.length}`
    );
    console.log(
      `   • Used verification codes: ${usedVerificationCodes.length}\n`
    );

    if (users.length === 0) {
      console.log("🎉 No Telegram users found in the database!\n");
    } else {
      console.log("👥 User Details:");
      console.log("================");

      users.forEach((user, index) => {
        const lastActiveDate = user.lastActive
          ? new Date(user.lastActive).toLocaleDateString()
          : "Never";
        const createdDate = new Date(user.createdAt).toLocaleDateString();

        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Wallet: ${user.wallet || "No wallet"}`);
        console.log(`   Telegram Username: ${user.telegramUsername || "None"}`);
        console.log(
          `   Points: ${user.points} (Lifetime: ${user.lifetimePoints})`
        );
        console.log(`   Last Active: ${lastActiveDate}`);
        console.log(`   Created: ${createdDate}`);

        if (user.telegramAccount) {
          console.log(`   TelegramAccount:`);
          console.log(`     • Platform ID: ${user.telegramAccount.platformId}`);
          console.log(
            `     • Username: ${user.telegramAccount.username || "None"}`
          );
          console.log(
            `     • Account Created: ${new Date(
              user.telegramAccount.createdAt
            ).toLocaleDateString()}`
          );
        }
        console.log("");
      });
    }

    // Show recent verification codes
    if (verificationCodes.length > 0) {
      console.log("🔑 Recent Verification Codes:");
      console.log("=============================");

      verificationCodes.slice(0, 10).forEach((code, index) => {
        const expiredStatus =
          new Date(code.expiresAt) < new Date() ? "EXPIRED" : "ACTIVE";
        const usedStatus = code.isUsed ? "USED" : "UNUSED";

        console.log(`${index + 1}. Code: ${code.code}`);
        console.log(
          `   User: ${code.user?.telegramUsername || "Unknown"} (${
            code.user?.wallet || "No wallet"
          })`
        );
        console.log(`   Status: ${usedStatus} | ${expiredStatus}`);
        console.log(`   Created: ${new Date(code.createdAt).toLocaleString()}`);
        console.log(`   Expires: ${new Date(code.expiresAt).toLocaleString()}`);
        console.log("");
      });
    }

    // Show ScotianOG specific data
    const scotianOGUser = users.find(
      (u) =>
        u.telegramUsername?.toLowerCase().includes("scotianog") ||
        u.wallet?.includes("ScotianOG") ||
        u.telegramAccount?.username?.toLowerCase().includes("scotianog")
    );

    if (scotianOGUser) {
      console.log("👑 ScotianOG User Found:");
      console.log("========================");
      console.log(`   User ID: ${scotianOGUser.id}`);
      console.log(`   Wallet: ${scotianOGUser.wallet}`);
      console.log(`   Telegram Username: ${scotianOGUser.telegramUsername}`);
      console.log(
        `   Points: ${scotianOGUser.points} (Lifetime: ${scotianOGUser.lifetimePoints})`
      );
      console.log(
        `   Last Active: ${
          scotianOGUser.lastActive
            ? new Date(scotianOGUser.lastActive).toLocaleString()
            : "Never"
        }`
      );
      if (scotianOGUser.telegramAccount) {
        console.log(
          `   TelegramAccount Platform ID: ${scotianOGUser.telegramAccount.platformId}`
        );
        console.log(
          `   TelegramAccount Username: ${
            scotianOGUser.telegramAccount.username || "None"
          }`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error inspecting Telegram users:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed.");
  }
}

if (require.main === module) {
  inspectTelegramUsers();
}

module.exports = { inspectTelegramUsers };
