// src/routes/verifications/generateCode.ts
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { GenerateCodeRequest } from "./types";

export async function generateVerificationCode(
  prisma: PrismaClient,
  data: GenerateCodeRequest
) {
  // Find or create user
  const user = await prisma.user.upsert({
    where: { wallet: data.wallet },
    update: {}, // No updates needed
    create: {
      wallet: data.wallet,
    },
  });

  // Check if user is already verified for this platform
  const verificationStatus = await checkPlatformVerification(
    prisma,
    user.id,
    data.platform
  );
  if (verificationStatus.verified) {
    throw new Error(`User is already verified for ${data.platform}`);
  }

  // Generate a random 6-character code
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();

  // Create verification code entry
  const verification = await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code,
      platform: data.platform,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      isUsed: false,
    },
  });

  // Log successful code generation
  console.log(
    `Generated verification code for wallet ${data.wallet} on platform ${data.platform}`
  );

  return { code, expiresIn: "30m" };
}

async function checkPlatformVerification(
  prisma: PrismaClient,
  userId: string,
  platform: string
) {
  console.log(
    `Checking verification for user ${userId} on platform ${platform}`
  );

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      telegramAccount: platform === "TELEGRAM",
      discordAccount: platform === "DISCORD",
      twitterAccount: platform === "TWITTER",
    },
  });

  console.log(`User found:`, user ? "Yes" : "No");

  if (!user) {
    return { verified: false };
  }

  const isVerified =
    (platform === "TELEGRAM" && user.telegramAccount) ||
    (platform === "DISCORD" && user.discordAccount) ||
    (platform === "TWITTER" && user.twitterAccount);

  console.log(`Platform ${platform} verification status:`, isVerified);
  console.log(`Account details:`, {
    telegram: user.telegramAccount,
    discord: user.discordAccount,
    twitter: user.twitterAccount,
  });

  return { verified: isVerified };
}
