// src/server/services/VerificationService.ts
import { PrismaClient } from "@prisma/client";
const crypto = require("crypto");
import { Platform } from "@prisma/client";
import { TwitterVerificationService } from "./TwitterVerificationService";

export class VerificationService {
  private static instance: VerificationService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  async generateCode(userId: string, platform: Platform): Promise<string> {
    // Check if user is already verified for this platform
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: platform === Platform.TELEGRAM,
        discordAccount: platform === Platform.DISCORD,
        twitterAccount: platform === Platform.TWITTER,
      },
    });

    if (user) {
      const isAlreadyVerified =
        (platform === Platform.TELEGRAM && user.telegramAccount) ||
        (platform === Platform.DISCORD && user.discordAccount) ||
        (platform === Platform.TWITTER && user.twitterAccount);

      if (isAlreadyVerified) {
        throw new Error(`User is already verified for ${platform}`);
      }
    }

    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    await this.prisma.verificationCode.create({
      data: {
        code,
        userId,
        platform,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    return code;
  }

  async verifyCode(
    code: string,
    platform: Platform,
    platformId: string
  ): Promise<boolean> {
    // Validate platform first
    switch (platform) {
      case Platform.TELEGRAM:
      case Platform.DISCORD:
      case Platform.TWITTER:
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const verification = await this.prisma.verificationCode.findUnique({
      where: { code },
      include: { user: true },
    });

    if (!verification) {
      throw new Error("Invalid verification code");
    }

    if (verification.isUsed) {
      throw new Error("Verification code has already been used");
    }

    if (new Date() > verification.expiresAt) {
      throw new Error("Verification code has expired");
    }

    // For Twitter, verify that the user actually tweeted the code
    if (platform === Platform.TWITTER) {
      console.log(`Verifying Twitter account ${platformId} for code ${code}`);
      const twitterService = TwitterVerificationService.getInstance();
      const isValidTweet = await twitterService.verifyTweet(platformId, code);

      if (!isValidTweet) {
        throw new Error(
          "Could not find a tweet with the verification code from this user"
        );
      }
      console.log(`Twitter verification successful for ${platformId}`);
    }

    // Check if platform account already exists
    let existingAccount: {
      id: string;
      userId: string;
      createdAt: Date;
      platformId: string;
      username: string | null;
    } | null = null;
    switch (platform) {
      case Platform.TELEGRAM:
        existingAccount = await this.prisma.telegramAccount.findUnique({
          where: { platformId },
        });
        break;
      case Platform.DISCORD:
        existingAccount = await this.prisma.discordAccount.findUnique({
          where: { platformId },
        });
        break;
      case Platform.TWITTER:
        existingAccount = await this.prisma.twitterAccount.findUnique({
          where: { platformId },
        });
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (existingAccount) {
      throw new Error(`${platform} account already linked to another user`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.verificationCode.update({
        where: { id: verification.id },
        data: { isUsed: true },
      });

      const accountData = {
        userId: verification.userId,
        platformId,
        username: null, // Will be set by platform-specific logic
      };

      switch (platform) {
        case Platform.TELEGRAM:
          await tx.telegramAccount.create({ data: accountData });
          break;
        case Platform.DISCORD:
          await tx.discordAccount.create({ data: accountData });
          break;
        case Platform.TWITTER:
          await tx.twitterAccount.create({ data: accountData });
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    });

    return true;
  }
}
