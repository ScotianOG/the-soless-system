// src/core/utils/VerificationManager.ts
import { PrismaClient } from "@prisma/client";
import { Platform } from "../types/platform";
import * as crypto from "crypto";

export class VerificationManager {
  static async linkPlatformAccount(
    tx: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
    >,
    userId: string,
    platform: Platform,
    platformId: string
  ) {
    return await this.getInstance().linkPlatformAccount(
      tx,
      userId,
      platform,
      platformId
    );
  }
  static async generateCode(
    userId: string,
    platform: Platform
  ): Promise<string> {
    return await this.getInstance().generateCode(userId, platform);
  }

  static async verifyCode(
    code: string,
    platform: Platform,
    platformId: string
  ): Promise<{ success: boolean; message?: string }> {
    return await this.getInstance().verifyCode(code, platform, platformId);
  }

  static async getUserVerificationStatus(userId: string): Promise<
    Record<
      Platform,
      {
        verified: boolean;
        code?: string;
        expiresAt?: Date;
      }
    >
  > {
    return await this.getInstance().getUserVerificationStatus(userId);
  }

  private static instance: VerificationManager;
  private prismaClient!: PrismaClient;
  private codeExpiration = 30 * 60 * 1000; // 30 minutes
  private codes = new Map<
    string,
    {
      wallet: string;
      timestamp: number;
      used: boolean;
      platform: Platform;
    }
  >();

  constructor() {
    // PrismaClient will be set via setPrismaClient
  }

  public static setPrismaClient(client: PrismaClient): void {
    this.getInstance().prismaClient = client;
  }

  public static getInstance(): VerificationManager {
    if (!VerificationManager.instance) {
      VerificationManager.instance = new VerificationManager();
    }
    return VerificationManager.instance;
  }

  async generateCode(userId: string, platform: Platform): Promise<string> {
    // First check if user is already verified for this platform
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: platform === "TELEGRAM",
        discordAccount: platform === "DISCORD",
        twitterAccount: platform === "TWITTER",
      },
    });

    if (user) {
      const isAlreadyVerified =
        (platform === "TELEGRAM" && user.telegramAccount) ||
        (platform === "DISCORD" && user.discordAccount) ||
        (platform === "TWITTER" && user.twitterAccount);

      if (isAlreadyVerified) {
        throw new Error(`User is already verified for ${platform}`);
      }
    }

    // Check if user already has a valid code
    const existingCode = await this.prismaClient.verificationCode.findFirst({
      where: {
        userId,
        platform,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingCode) {
      return existingCode.code;
    }

    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    await this.prismaClient.verificationCode.create({
      data: {
        code,
        userId,
        platform,
        expiresAt: new Date(Date.now() + this.codeExpiration),
        isUsed: false,
      },
    });

    this.codes.set(code, {
      wallet: userId,
      timestamp: Date.now(),
      used: false,
      platform,
    });

    this.cleanupExpiredCodes();
    return code;
  }

  async verifyCode(
    code: string,
    platform: Platform,
    platformId: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    // Check code validity
    const dbCode = await this.prismaClient.verificationCode.findFirst({
      where: {
        code: code,
        isUsed: false,
        expiresAt: {
          gt: new Date(), // Ensure code hasn't expired
        },
      },
    });

    if (!dbCode) {
      return {
        success: false,
        message: "Invalid or expired verification code.",
      };
    }

    // Check if platform account already exists
    const existingAccount = await this.checkExistingAccount(
      platform,
      platformId
    );
    if (existingAccount) {
      return {
        success: false,
        message: "This platform account is already linked to another user.",
      };
    }

    try {
      await this.prismaClient.$transaction(
        async (
          tx: Omit<
            PrismaClient,
            | "$connect"
            | "$disconnect"
            | "$on"
            | "$transaction"
            | "$use"
            | "$extends"
          >
        ) => {
          // Mark code as used
          await tx.verificationCode.update({
            where: { id: dbCode.id },
            data: { isUsed: true },
          });

          // Create platform account
          await this.linkPlatformAccount(
            tx,
            dbCode.userId,
            platform,
            platformId
          );

          // Update platform username in User model
          await this.updateUserPlatformInfo(
            tx,
            dbCode.userId,
            platform,
            platformId
          );
        }
      );

      // Clear from memory cache
      this.codes.delete(code);

      return { success: true };
    } catch (error) {
      console.error("Error verifying code:", error);
      return { success: false, message: "Error processing verification." };
    }
  }

  private async checkExistingAccount(platform: Platform, platformId: string) {
    switch (platform) {
      case "TELEGRAM":
        return this.prismaClient.telegramAccount.findUnique({
          where: { platformId },
        });
      case "DISCORD":
        return this.prismaClient.discordAccount.findUnique({
          where: { platformId },
        });
      case "TWITTER":
        return this.prismaClient.twitterAccount.findUnique({
          where: { platformId },
        });
    }
  }

  async linkPlatformAccount(
    tx: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    platform: Platform,
    platformId: string
  ) {
    const accountData = {
      userId,
      platformId,
      createdAt: new Date(),
    };

    switch (platform) {
      case "TELEGRAM":
        return tx.telegramAccount.create({ data: accountData });
      case "DISCORD":
        return tx.discordAccount.create({ data: accountData });
      case "TWITTER":
        return tx.twitterAccount.create({ data: accountData });
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async updateUserPlatformInfo(
    tx: Omit<
      PrismaClient,
      "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    platform: Platform,
    platformId: string
  ) {
    const updateData: {
      telegramUsername?: string;
      discordUsername?: string;
      twitterUsername?: string;
    } = {};
    switch (platform) {
      case "TELEGRAM":
        updateData.telegramUsername = platformId;
        break;
      case "DISCORD":
        updateData.discordUsername = platformId;
        break;
      case "TWITTER":
        updateData.twitterUsername = platformId;
        break;
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async getUserVerificationStatus(userId: string): Promise<
    Record<
      Platform,
      {
        verified: boolean;
        code?: string;
        expiresAt?: Date;
      }
    >
  > {
    const verifications = await this.prismaClient.verificationCode.findMany({
      where: {
        userId,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    const status: Record<
      Platform,
      {
        verified: boolean;
        code?: string;
        expiresAt?: Date;
      }
    > = {
      TELEGRAM: { verified: false },
      DISCORD: { verified: false },
      TWITTER: { verified: false },
    };

    for (const verification of verifications) {
      status[verification.platform as Platform] = {
        verified: false,
        code: verification.code,
        expiresAt: verification.expiresAt,
      };
    }

    // Check existing platform links
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId },
      include: {
        telegramAccount: true,
        discordAccount: true,
        twitterAccount: true,
      },
    });

    if (user) {
      if (user.telegramAccount) status.TELEGRAM.verified = true;
      if (user.discordAccount) status.DISCORD.verified = true;
      if (user.twitterAccount) status.TWITTER.verified = true;
    }

    return status;
  }

  private cleanupExpiredCodes(): void {
    const now = Date.now();
    Array.from(this.codes.entries()).forEach(([code, data]) => {
      if (now - data.timestamp > this.codeExpiration) {
        this.codes.delete(code);
      }
    });
  }
}

// Export the class instead of the instance
export default VerificationManager;
