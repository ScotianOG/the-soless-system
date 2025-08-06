#!/usr/bin/env node

/**
 * Manual Bot Testing Helper
 * Use this to test your bot functionality step by step
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const AI_API_URL = process.env.AI_API_URL || "http://localhost:3000/api";

console.log("🤖 SOLess Bot Manual Testing Helper");
console.log("===================================\n");

class ManualTester {
  constructor() {
    this.baseURL = `https://api.telegram.org/bot${BOT_TOKEN}`;
  }

  async getBotInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/getMe`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get bot info: ${error.message}`);
    }
  }

  async getUpdates() {
    try {
      const response = await axios.get(`${this.baseURL}/getUpdates`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get updates: ${error.message}`);
    }
  }

  async checkBotCommands() {
    try {
      const response = await axios.get(`${this.baseURL}/getMyCommands`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get bot commands: ${error.message}`);
    }
  }
}

async function runManualTests() {
  try {
    const tester = new ManualTester();

    console.log("🔍 1. Bot Information");
    console.log("=====================");
    const botInfo = await tester.getBotInfo();
    console.log(`✅ Bot Name: @${botInfo.username}`);
    console.log(`✅ Bot ID: ${botInfo.id}`);
    console.log(`✅ Bot First Name: ${botInfo.first_name}`);
    console.log("");

    console.log("🔍 2. Database Connection");
    console.log("=========================");
    await prisma.$connect();
    const userCount = await prisma.user.count();
    const telegramAccounts = await prisma.telegramAccount.count();
    console.log(`✅ Connected to database`);
    console.log(`✅ Total users: ${userCount}`);
    console.log(`✅ Telegram accounts linked: ${telegramAccounts}`);
    console.log("");

    console.log("🔍 3. AI Engine Status");
    console.log("======================");
    try {
      const response = await axios.post(`${AI_API_URL}/conversations`);
      if (response.data.conversationId) {
        console.log(`✅ AI Engine is online`);
        console.log(
          `✅ Test conversation created: ${response.data.conversationId}`
        );
      }
    } catch (error) {
      console.log(`❌ AI Engine error: ${error.message}`);
    }
    console.log("");

    console.log("🔍 4. Bot Commands Setup");
    console.log("========================");
    try {
      const commands = await tester.checkBotCommands();
      if (commands.length > 0) {
        console.log(`✅ Bot has ${commands.length} commands configured:`);
        commands.forEach((cmd) => {
          console.log(`   /${cmd.command} - ${cmd.description}`);
        });
      } else {
        console.log(`⚠️  No commands configured in BotFather`);
      }
    } catch (error) {
      console.log(`❌ Commands check failed: ${error.message}`);
    }
    console.log("");

    console.log("🔍 5. Recent Bot Activity");
    console.log("=========================");
    try {
      const updates = await tester.getUpdates();
      if (updates.length > 0) {
        console.log(`✅ Bot has received ${updates.length} recent updates`);
        const lastUpdate = updates[updates.length - 1];
        if (lastUpdate.message) {
          console.log(
            `   Last message from: ${
              lastUpdate.message.from.first_name ||
              lastUpdate.message.from.username
            }`
          );
          console.log(
            `   Message: "${lastUpdate.message.text || "[non-text message]"}"`
          );
          console.log(`   Chat type: ${lastUpdate.message.chat.type}`);
        }
      } else {
        console.log(`ℹ️  No recent messages (this is normal for a new bot)`);
      }
    } catch (error) {
      console.log(`❌ Updates check failed: ${error.message}`);
    }
    console.log("");

    console.log("📋 Manual Testing Instructions");
    console.log("==============================");
    console.log(`1. Start a DM with @${botInfo.username}`);
    console.log("2. Send /help to see available commands");
    console.log(
      "3. Test verification with: /verify E6W42V (or run create-test-verification.js again)"
    );
    console.log("4. Test AI chat with: /soulie What is SOLess?");
    console.log("5. Test music sharing: /soulieplay Daft Punk - Get Lucky");
    console.log(
      "6. Send a regular message about SOLess to test point tracking"
    );
    console.log("7. Check your points with: /points");
    console.log("8. View leaderboard with: /leaderboard");
    console.log("9. Share a fact with: /solfact");
    console.log("10. Test ELI5 mode: /eli5 then ask a question");
    console.log("");

    console.log("🏆 Group Testing");
    console.log("================");
    console.log("1. Add the bot to a test group");
    console.log("2. Mention the bot: @" + botInfo.username + " hello");
    console.log('3. Use "Soulie" in a message: "Hey Soulie, what\'s up?"');
    console.log("4. Reply to a bot message");
    console.log("5. Test music sharing in group: /soulieplay Daft Punk");
    console.log("");

    console.log("🚨 Troubleshooting");
    console.log("==================");
    console.log("If bot doesn't respond:");
    console.log("1. Check if bot is running: npm run start:telegram");
    console.log(
      "2. Check AI engine is running: npm run dev (in ai-engine folder)"
    );
    console.log("3. Check database connection");
    console.log("4. Verify environment variables are set");
    console.log("5. Check terminal logs for errors");
    console.log("");

    console.log("🎯 BotFather Commands to Set");
    console.log("============================");
    console.log("Send these to @BotFather using /setcommands:");
    console.log("");
    console.log("help - Show available commands");
    console.log("soulie - Ask AI anything about SOLess");
    console.log("eli5 - Switch to simple explanations");
    console.log("normal - Switch to normal explanations");
    console.log("verify - Verify your account with a code");
    console.log("soulieplay - Share music and earn points");
    console.log("solfact - Share a random SOLess fact");
    console.log("points - Check your points and stats");
    console.log("leaderboard - View the points leaderboard");
    console.log("");
  } catch (error) {
    console.error("❌ Manual test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Validation
if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is required");
  console.log('Set it with: export TELEGRAM_BOT_TOKEN="your_bot_token_here"');
  process.exit(1);
}

runManualTests();
