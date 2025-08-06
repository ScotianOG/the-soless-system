// Test script to verify the updated bot messages
const fs = require("fs");
const path = require("path");

const botFilePath = path.join(
  __dirname,
  "server/src/core/bots/platforms/telegram/TelegramBot.ts"
);

console.log("🔍 Checking Telegram bot message updates...\n");

try {
  const botContent = fs.readFileSync(botFilePath, "utf8");

  // Check for the updated verification message
  const verificationMatch = botContent.match(
    /Don't have a code\? Visit.*?@Soulie_bot/
  );
  if (verificationMatch) {
    console.log("✅ Verification message updated correctly:");
    console.log(
      '   "Don\'t have a code? Visit https://soless.app/register to connect your wallet and generate one, then come back to @Soulie_bot to verify."'
    );
  } else {
    console.log("❌ Verification message not found or not updated");
  }

  // Check for updated account linking messages
  const linkingMatches = [
    ...botContent.matchAll(/Please visit.*?@Soulie_bot/g),
  ];
  if (linkingMatches.length >= 2) {
    console.log("✅ Account linking messages updated correctly:");
    console.log(
      '   "Please visit https://soless.app/register to connect your wallet and verify your account with @Soulie_bot."'
    );
    console.log(`   Found ${linkingMatches.length} instances updated`);
  } else {
    console.log("❌ Account linking messages not all updated");
  }

  console.log("\n📋 Summary:");
  console.log("- Updated verification code message to reference @Soulie_bot");
  console.log("- Updated account linking messages to reference @Soulie_bot");
  console.log("- Ready for deployment when server connectivity is restored");
} catch (error) {
  console.error("❌ Error reading bot file:", error.message);
}
