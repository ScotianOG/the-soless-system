#!/usr/bin/env node

/**
 * Create a test verification code for bot testing
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function createTestVerificationCode() {
  try {
    console.log("🔧 Creating test verification code...\n");

    // Create or find a test user
    const testWallet = "0xTEST" + crypto.randomBytes(16).toString("hex");
    let testUser = await prisma.user.findFirst({
      where: { wallet: { startsWith: "0xTEST" } },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          wallet: testWallet,
          points: 0,
          lifetimePoints: 0,
        },
      });
      console.log("✅ Created test user");
    } else {
      console.log("✅ Found existing test user");
    }

    // Generate verification code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create verification code
    const verification = await prisma.verificationCode.create({
      data: {
        code,
        userId: testUser.id,
        platform: "TELEGRAM",
        expiresAt,
        isUsed: false,
      },
    });

    console.log("📋 Test Verification Details:");
    console.log("=============================");
    console.log(`Code: ${code}`);
    console.log(`User ID: ${testUser.id}`);
    console.log(`Wallet: ${testUser.wallet}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("");
    console.log("🧪 To test verification:");
    console.log(`1. Start a DM with your bot`);
    console.log(`2. Send: /verify ${code}`);
    console.log(`3. Bot should link your Telegram account`);
    console.log("");
  } catch (error) {
    console.error("❌ Error creating test verification code:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestVerificationCode();
