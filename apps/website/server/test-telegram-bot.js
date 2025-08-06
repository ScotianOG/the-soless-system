#!/usr/bin/env node

/**
 * Comprehensive Telegram Bot Test Script
 * Tests all bot functionality before community launch
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const AI_API_URL = process.env.AI_API_URL || "http://localhost:3000/api";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

// Test configuration
const TEST_CONFIG = {
  // Use your actual Telegram user ID for testing
  TEST_USER_ID: "123456789", // Replace with your Telegram user ID
  TEST_USERNAME: "testuser", // Replace with your Telegram username
  CHAT_ID: "123456789", // Use same as user ID for DM testing
};

console.log("🧪 SOLess Telegram Bot Test Suite");
console.log("==================================\n");

// Test utilities
class BotTester {
  constructor() {
    this.baseURL = `https://api.telegram.org/bot${BOT_TOKEN}`;
    this.testResults = [];
  }

  async test(name, testFunction) {
    console.log(`🔍 Testing: ${name}`);
    try {
      await testFunction();
      console.log(`✅ PASS: ${name}\n`);
      this.testResults.push({ name, status: "PASS", error: null });
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}\n`);
      this.testResults.push({ name, status: "FAIL", error: error.message });
    }
  }

  async sendMessage(text, chatId = TEST_CONFIG.CHAT_ID) {
    const response = await axios.post(`${this.baseURL}/sendMessage`, {
      chat_id: chatId,
      text: text,
    });
    return response.data;
  }

  async getUpdates() {
    const response = await axios.get(`${this.baseURL}/getUpdates`);
    return response.data.result;
  }

  async getBotInfo() {
    const response = await axios.get(`${this.baseURL}/getMe`);
    return response.data.result;
  }

  printSummary() {
    console.log("\n📊 Test Summary");
    console.log("================");

    const passed = this.testResults.filter((r) => r.status === "PASS").length;
    const failed = this.testResults.filter((r) => r.status === "FAIL").length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(
      `📈 Success Rate: ${Math.round(
        (passed / this.testResults.length) * 100
      )}%\n`
    );

    if (failed > 0) {
      console.log("❌ Failed Tests:");
      this.testResults
        .filter((r) => r.status === "FAIL")
        .forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
      console.log("");
    }
  }
}

const tester = new BotTester();

// Test functions
async function testBotConnection() {
  const botInfo = await tester.getBotInfo();
  if (!botInfo.is_bot) {
    throw new Error("Bot token is invalid");
  }
  console.log(`   Bot Name: @${botInfo.username}`);
  console.log(`   Bot ID: ${botInfo.id}`);
}

async function testDatabaseConnection() {
  await prisma.$connect();
  const userCount = await prisma.user.count();
  console.log(`   Connected to database`);
  console.log(`   Total users: ${userCount}`);
}

async function testAIEngineConnection() {
  try {
    const response = await axios.get(`${AI_API_URL}/health`);
    console.log(
      `   AI Engine Status: ${response.status === 200 ? "Online" : "Offline"}`
    );
  } catch (error) {
    // Try alternative endpoint
    const response = await axios.post(`${AI_API_URL}/conversations`);
    if (response.data.conversationId) {
      console.log(`   AI Engine Status: Online (conversation created)`);
    } else {
      throw new Error("AI Engine not responding properly");
    }
  }
}

async function testHelpCommand() {
  const message = await tester.sendMessage("/help");
  if (!message.ok) {
    throw new Error("Failed to send help command");
  }
  console.log(`   Help command sent successfully`);
}

async function testSoulieCommand() {
  const message = await tester.sendMessage("/soulie What is SOLess?");
  if (!message.ok) {
    throw new Error("Failed to send soulie command");
  }
  console.log(`   Soulie command sent successfully`);
}

async function testEli5Command() {
  const message = await tester.sendMessage("/eli5");
  if (!message.ok) {
    throw new Error("Failed to send eli5 command");
  }
  console.log(`   ELI5 command sent successfully`);
}

async function testNormalCommand() {
  const message = await tester.sendMessage("/normal");
  if (!message.ok) {
    throw new Error("Failed to send normal command");
  }
  console.log(`   Normal command sent successfully`);
}

async function testPointsCommand() {
  const message = await tester.sendMessage("/points");
  if (!message.ok) {
    throw new Error("Failed to send points command");
  }
  console.log(`   Points command sent successfully`);
}

async function testLeaderboardCommand() {
  const message = await tester.sendMessage("/leaderboard");
  if (!message.ok) {
    throw new Error("Failed to send leaderboard command");
  }
  console.log(`   Leaderboard command sent successfully`);
}

async function testSolfactCommand() {
  const message = await tester.sendMessage("/solfact");
  if (!message.ok) {
    throw new Error("Failed to send solfact command");
  }
  console.log(`   Solfact command sent successfully`);
}

async function testSoulieplayCommand() {
  const message = await tester.sendMessage("/soulieplay Daft Punk - Get Lucky");
  if (!message.ok) {
    throw new Error("Failed to send soulieplay command");
  }
  console.log(`   Soulieplay command sent successfully`);
}

async function testVerifyCommand() {
  const message = await tester.sendMessage("/verify");
  if (!message.ok) {
    throw new Error("Failed to send verify command");
  }
  console.log(`   Verify command sent successfully (should show instructions)`);
}

async function testRegularMessage() {
  const message = await tester.sendMessage(
    "This is a test message about SOLess and blockchain technology. It should trigger point tracking for verified users."
  );
  if (!message.ok) {
    throw new Error("Failed to send regular message");
  }
  console.log(`   Regular message sent successfully`);
}

async function testAIConversation() {
  const message = await tester.sendMessage(
    "Hello Soulie, can you explain what SOLess is about?"
  );
  if (!message.ok) {
    throw new Error("Failed to send AI conversation message");
  }
  console.log(`   AI conversation message sent successfully`);
}

async function testBotCommands() {
  const botInfo = await tester.getBotInfo();
  // Note: This doesn't directly test if commands are set, but ensures bot is accessible
  console.log(`   Bot commands accessible via @${botInfo.username}`);
}

async function testEnvironmentVariables() {
  const requiredVars = ["TELEGRAM_BOT_TOKEN", "AI_API_URL", "DATABASE_URL"];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  console.log(`   All required environment variables present`);
}

async function testYouTubeService() {
  if (!process.env.YOUTUBE_API_KEY) {
    console.log(
      `   ⚠️  YouTube API key not set - music sharing will be limited`
    );
    return;
  }

  // Test YouTube API key validity (basic check)
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          part: "snippet",
          q: "test",
          maxResults: 1,
          type: "video",
        },
      }
    );

    if (response.status === 200) {
      console.log(`   YouTube API key is valid`);
    }
  } catch (error) {
    console.log(
      `   ⚠️  YouTube API key may be invalid: ${error.response?.status}`
    );
  }
}

// Run all tests
async function runAllTests() {
  try {
    console.log("⚙️  Pre-launch Test Configuration");
    console.log(`   Test User ID: ${TEST_CONFIG.TEST_USER_ID}`);
    console.log(`   Test Username: ${TEST_CONFIG.TEST_USERNAME}`);
    console.log(`   AI API URL: ${AI_API_URL}`);
    console.log(`   API Base URL: ${API_BASE_URL}\n`);

    // Core connectivity tests
    await tester.test("Bot Connection", testBotConnection);
    await tester.test("Database Connection", testDatabaseConnection);
    await tester.test("AI Engine Connection", testAIEngineConnection);
    await tester.test("Environment Variables", testEnvironmentVariables);
    await tester.test("YouTube Service", testYouTubeService);

    // Command tests
    await tester.test("Help Command", testHelpCommand);
    await tester.test("Soulie Command", testSoulieCommand);
    await tester.test("ELI5 Command", testEli5Command);
    await tester.test("Normal Command", testNormalCommand);
    await tester.test("Points Command", testPointsCommand);
    await tester.test("Leaderboard Command", testLeaderboardCommand);
    await tester.test("Solfact Command", testSolfactCommand);
    await tester.test("Soulieplay Command", testSoulieplayCommand);
    await tester.test("Verify Command", testVerifyCommand);

    // Functionality tests
    await tester.test("Regular Message", testRegularMessage);
    await tester.test("AI Conversation", testAIConversation);
    await tester.test("Bot Commands Setup", testBotCommands);

    tester.printSummary();

    // Additional notes
    console.log("📝 Manual Testing Notes:");
    console.log("========================");
    console.log("1. Test the bot in a private DM first");
    console.log("2. Test AI responses and point tracking");
    console.log("3. Verify account linking with a real verification code");
    console.log("4. Test music sharing with /soulieplay");
    console.log('5. Test group mentions (@botname and "Soulie")');
    console.log("6. Verify cooldowns and daily limits");
    console.log("7. Test streak tracking over multiple days");
    console.log("8. Check leaderboard after some activity\n");

    console.log("🚀 Ready for Community Launch Checklist:");
    console.log("=========================================");
    console.log("□ All tests passing");
    console.log("□ Bot responds to DMs");
    console.log("□ Bot responds to group mentions");
    console.log("□ Points system working");
    console.log("□ AI responses working");
    console.log("□ Music sharing working");
    console.log("□ Verification system working");
    console.log("□ BotFather commands configured");
    console.log("□ Bot added to community group");
    console.log("□ Admin permissions set correctly\n");
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line arguments
if (process.argv.includes("--help")) {
  console.log("SOLess Telegram Bot Test Suite");
  console.log("Usage: node test-telegram-bot.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --help     Show this help message");
  console.log("");
  console.log("Environment Variables Required:");
  console.log("  TELEGRAM_BOT_TOKEN  - Your bot token from BotFather");
  console.log(
    "  AI_API_URL         - AI engine API URL (default: http://localhost:3000/api)"
  );
  console.log(
    "  API_BASE_URL       - Main API URL (default: http://localhost:3001)"
  );
  console.log("  DATABASE_URL       - PostgreSQL database connection string");
  console.log(
    "  YOUTUBE_API_KEY    - YouTube API key (optional, for music features)"
  );
  console.log("");
  console.log("Before running:");
  console.log("1. Update TEST_CONFIG with your Telegram user ID");
  console.log("2. Ensure bot and AI engine are running");
  console.log("3. Ensure database is accessible");
  process.exit(0);
}

// Validation
if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN environment variable is required");
  console.log('Set it with: export TELEGRAM_BOT_TOKEN="your_bot_token_here"');
  process.exit(1);
}

if (TEST_CONFIG.TEST_USER_ID === "123456789") {
  console.log(
    "⚠️  Warning: Using default test user ID. Update TEST_CONFIG with your actual Telegram user ID for better testing."
  );
  console.log(
    "   You can get your user ID by messaging @userinfobot on Telegram\n"
  );
}

// Run the tests
runAllTests();
