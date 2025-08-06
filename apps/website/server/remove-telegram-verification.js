#!/usr/bin/env node

/**
 * SOLess Telegram Verification Remover
 *
 * This script removes Telegram verification for testing purposes
 * while preserving user account and points
 */

const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function confirmAction(userDetails) {
  return new Promise((resolve) => {
    rl.question(
      `\n⚠️  WARNING: This will remove Telegram verification for testing!\n\nUser to be affected:\n• User ID: ${userDetails.id}\n• Wallet: ${userDetails.wallet}\n• Telegram Username: ${userDetails.telegramUsername}\n• Platform ID: ${userDetails.telegramAccount?.platformId}\n\nThis will:\n✅ Preserve user account and points\n✅ Preserve engagement history\n❌ Remove TelegramAccount record\n❌ Remove unused verification codes\n✅ Keep used verification codes for history\n\nType "REMOVE VERIFICATION" to confirm: `,
      (answer) => {
        rl.close();
        resolve(answer === "REMOVE VERIFICATION");
      }
    );
  });
}

async function removeVerification(userId) {
  console.log("\n🚀 Starting verification removal...\n");

  try {
    // Get user details before removal
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    console.log("📊 Before removal:");
    console.log(`   • Telegram Username: ${user.telegramUsername}`);
    console.log(
      `   • TelegramAccount: ${user.telegramAccount ? "EXISTS" : "NONE"}`
    );
    console.log(`   • Points: ${user.points} (will be preserved)`);

    // Remove verification in transaction
    const result = await prisma.$transaction(async (tx) => {
      let removedAccount = false;
      let removedUnusedCodes = 0;

      // 1. Remove TelegramAccount if exists
      if (user.telegramAccount) {
        console.log("   1/3 Removing TelegramAccount record...");
        await tx.telegramAccount.delete({
          where: { userId: userId },
        });
        removedAccount = true;
        console.log("       ✅ TelegramAccount removed");
      } else {
        console.log("   1/3 No TelegramAccount to remove");
      }

      // 2. Remove unused verification codes (keep used ones for history)
      console.log("   2/3 Removing unused verification codes...");
      const deletedCodes = await tx.verificationCode.deleteMany({
        where: {
          userId: userId,
          platform: "TELEGRAM",
          isUsed: false,
        },
      });
      removedUnusedCodes = deletedCodes.count;
      console.log(
        `       ✅ Removed ${removedUnusedCodes} unused verification codes`
      );

      // 3. Clear telegramUsername from User (optional - comment out if you want to keep it)
      console.log("   3/3 Clearing telegramUsername...");
      await tx.user.update({
        where: { id: userId },
        data: { telegramUsername: null },
      });
      console.log("       ✅ Telegram username cleared");

      return {
        removedAccount,
        removedUnusedCodes,
        preservedPoints: user.points,
        preservedLifetimePoints: user.lifetimePoints,
      };
    });

    console.log("\n✅ Verification removal completed successfully!\n");
    console.log("📈 Removal summary:");
    console.log(
      `   • TelegramAccount removed: ${result.removedAccount ? "YES" : "NO"}`
    );
    console.log(
      `   • Unused verification codes removed: ${result.removedUnusedCodes}`
    );
    console.log(`   • Points preserved: ${result.preservedPoints}`);
    console.log(
      `   • Lifetime points preserved: ${result.preservedLifetimePoints}`
    );

    // Verify removal
    console.log("\n🔍 Verifying removal...");
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: true,
        verificationCodes: {
          where: { platform: "TELEGRAM" },
        },
      },
    });

    if (updatedUser) {
      const hasNoTelegramAccount = !updatedUser.telegramAccount;
      const hasNoTelegramUsername = !updatedUser.telegramUsername;
      const remainingCodes = updatedUser.verificationCodes.length;
      const usedCodes = updatedUser.verificationCodes.filter(
        (c) => c.isUsed
      ).length;

      console.log(
        `   • TelegramAccount removed: ${hasNoTelegramAccount ? "✅" : "❌"}`
      );
      console.log(
        `   • Telegram username cleared: ${hasNoTelegramUsername ? "✅" : "❌"}`
      );
      console.log(
        `   • Remaining verification codes: ${remainingCodes} (${usedCodes} used, ${
          remainingCodes - usedCodes
        } unused)`
      );
      console.log(`   • Points preserved: ${updatedUser.points} ✅`);
      console.log(`   • Account still exists: ${updatedUser.id ? "✅" : "❌"}`);

      if (hasNoTelegramAccount && hasNoTelegramUsername) {
        console.log(
          "\n✅ Verification successfully removed! You can now test new verification."
        );
      } else {
        console.log("\n⚠️  Warning: Some verification data may still remain.");
      }
    }
  } catch (error) {
    console.error("\n❌ Error during verification removal:", error);
    console.error(
      "\nThe database transaction was rolled back. No data was removed."
    );
    throw error;
  }
}

async function main() {
  console.log("🎯 SOLess Telegram Verification Remover");
  console.log("=======================================");

  try {
    // Connect to database
    console.log("\n🔌 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Find ScotianOG user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { telegramUsername: { contains: "ScotianOG", mode: "insensitive" } },
          { wallet: { contains: "TEST", mode: "insensitive" } },
        ],
      },
      include: {
        telegramAccount: true,
      },
    });

    if (!user) {
      console.log("\n❌ ScotianOG user not found. Nothing to remove.");
      process.exit(0);
    }

    if (!user.telegramAccount && !user.telegramUsername) {
      console.log(
        "\n🎉 No Telegram verification found for this user. Already clean!"
      );
      process.exit(0);
    }

    // Get confirmation
    const confirmed = await confirmAction(user);

    if (!confirmed) {
      console.log("\n❌ Operation cancelled by user.");
      process.exit(0);
    }

    // Perform the removal
    await removeVerification(user.id);

    console.log("\n🎉 Telegram verification removal completed successfully!");
    console.log("\nYou can now test new Telegram verification flows.");
    console.log(
      "Your user account, points, and other data have been preserved."
    );
  } catch (error) {
    console.error("\n💥 Fatal error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed.");
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Operation interrupted by user");
  await prisma.$disconnect();
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { removeVerification };
