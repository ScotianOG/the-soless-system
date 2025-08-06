#!/usr/bin/env node

/**
 * Pre-Launch Checklist for SOLess Telegram Bot
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

console.log("🚀 SOLess Bot Pre-Launch Checklist");
console.log("==================================\n");

async function runPreLaunchChecklist() {
  const checklist = [];
  let allPassed = true;

  async function check(name, testFunction) {
    try {
      await testFunction();
      console.log(`✅ ${name}`);
      checklist.push({ name, status: "PASS" });
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      checklist.push({ name, status: "FAIL", error: error.message });
      allPassed = false;
    }
  }

  // 1. Environment checks
  await check("Environment Variables Set", async () => {
    const required = ["TELEGRAM_BOT_TOKEN", "AI_API_URL", "DATABASE_URL"];
    const missing = required.filter((v) => !process.env[v]);
    if (missing.length > 0) throw new Error(`Missing: ${missing.join(", ")}`);
  });

  // 2. Bot connectivity
  await check("Bot Token Valid", async () => {
    const response = await axios.get(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
    );
    if (!response.data.ok) throw new Error("Invalid bot token");
  });

  // 3. Database connectivity
  await check("Database Connected", async () => {
    await prisma.$connect();
    await prisma.user.count();
  });

  // 4. AI Engine connectivity
  await check("AI Engine Online", async () => {
    const response = await axios.post(
      `${process.env.AI_API_URL}/conversations`
    );
    if (!response.data.conversationId)
      throw new Error("AI Engine not responding properly");
  });

  // 5. Bot commands configured
  await check("Bot Commands Configured", async () => {
    const response = await axios.get(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMyCommands`
    );
    const commands = response.data.result;
    if (commands.length < 9)
      throw new Error(`Only ${commands.length}/9 commands set`);
  });

  // 6. Prisma schema up to date
  await check("Database Schema Current", async () => {
    // Check if AI_CHAT enum exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'AI_CHAT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EngagementType')
      ) as exists
    `;
    if (!result[0].exists)
      throw new Error("AI_CHAT enum missing from EngagementType");
  });

  // 7. Test verification code available
  await check("Test Verification Code Available", async () => {
    const codes = await prisma.verificationCode.findMany({
      where: { isUsed: false, expiresAt: { gt: new Date() } },
    });
    if (codes.length === 0)
      throw new Error("No valid verification codes available");
  });

  // 8. Check for YouTube API key
  await check("YouTube API Configured", async () => {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error(
        "YouTube API key not set - music features will be limited"
      );
    }
  });

  console.log("\n📊 Checklist Summary");
  console.log("====================");
  const passed = checklist.filter((c) => c.status === "PASS").length;
  const failed = checklist.filter((c) => c.status === "FAIL").length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (allPassed) {
    console.log("\n🎉 ALL CHECKS PASSED - READY FOR LAUNCH! 🎉");
  } else {
    console.log("\n⚠️  Some checks failed - please resolve before launch");
    checklist
      .filter((c) => c.status === "FAIL")
      .forEach((c) => {
        console.log(`   ❌ ${c.name}: ${c.error}`);
      });
  }

  console.log("\n🎯 Final Manual Tests to Complete:");
  console.log("==================================");
  console.log("□ Test bot in DM with your personal account");
  console.log("□ Test verification with /verify command");
  console.log("□ Test AI responses with /soulie command");
  console.log("□ Test music sharing with /soulieplay");
  console.log("□ Test point tracking with regular messages");
  console.log("□ Test bot in a private group");
  console.log('□ Test @mentions and "Soulie" triggers');
  console.log("□ Verify cooldowns and daily limits work");
  console.log("□ Check leaderboard updates correctly");
  console.log("□ Test ELI5 mode functionality");

  console.log("\n🚀 Community Launch Steps:");
  console.log("==========================");
  console.log("1. Complete all manual tests above");
  console.log("2. Add bot to community group");
  console.log("3. Set bot as admin with needed permissions");
  console.log("4. Send welcome message explaining bot features");
  console.log("5. Monitor for first 24 hours");
  console.log("6. Gather user feedback and iterate");

  await prisma.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runPreLaunchChecklist().catch((error) => {
  console.error("❌ Checklist failed:", error.message);
  process.exit(1);
});
