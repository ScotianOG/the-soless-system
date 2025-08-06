// src/services/AuthService.ts
import { PrismaClient } from "@prisma/client";
import {
  verifyWalletSignature,
  generateToken,
  createSignMessage,
} from "../utils/auth";
import { logger } from "../utils/logger";
import { User, Platform } from "../types";
import {
  VerificationCode,
  AuthResponse,
  UserWithRelations,
} from "../routes/auth/types";

// Move interface here and export it
export interface IAuthService {
  generateVerificationCode(
    wallet: string,
    platform: Platform
  ): Promise<VerificationCode>;
  verifyWalletSignature(
    wallet: string,
    signature: string,
    message: string
  ): Promise<AuthResponse>;
  getCurrentUser(userId: string): Promise<UserWithRelations>;
  handleTwitterCallback(code: string, wallet: string): Promise<{ username: string }>;
  getTwitterAuthUrl(state: string): Promise<string>;
  handleDiscordCallback(code: string, wallet: string): Promise<{ username: string }>;
  getDiscordAuthUrl(state: string): Promise<string>;
}

export class AuthService implements IAuthService {
  private static instance: AuthService;
  private prisma: PrismaClient;
  private nonceStore: Map<string, { nonce: string; expires: number }>;

  private constructor() {
    // private constructor to enforce singleton pattern
    this.prisma = new PrismaClient();
    this.nonceStore = new Map();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async generateVerificationCode(
    wallet: string,
    platform: Platform
  ): Promise<VerificationCode> {
    try {
      // Validate inputs
      if (!wallet || !platform) {
        throw new Error("Wallet and platform are required");
      }


      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresIn = "30m";

      // First, ensure the user exists
      await this.prisma.user.upsert({
        where: { wallet },
        create: { wallet, points: 0, lifetimePoints: 0 },
        update: {},
      });

      // Then create the verification code
      await this.prisma.verificationCode.create({
        data: {
          code,
          platform,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          isUsed: false,
          user: {
            connect: { wallet },
          },
        },
      });

      return { code, expiresIn };
    } catch (error) {
      logger.error("Error generating verification code:", error);
      throw new Error("Failed to generate verification code");
    }
  }

  async verifyWalletSignature(
    wallet: string,
    signature: string,
    message: string
  ): Promise<AuthResponse> {
    try {
      const isValid = await verifyWalletSignature(wallet, signature, message);

      if (!isValid) {
        return {
          success: false,
          error: "Invalid signature",
        };
      }

      const user = await this.prisma.user.upsert({
        where: { wallet },
        update: {
          lastActive: new Date(),
        },
        create: {
          wallet,
          points: 0,
          lifetimePoints: 0,
          createdAt: new Date(),
        },
        include: {
          telegramAccount: true,
          discordAccount: true,
          twitterAccount: true,
          streaks: true,
        },
      });

      const token = generateToken({
        id: user.id,
        wallet: user.wallet,
      });

      // Convert null to undefined for User type compatibility
      const userResponse: User = {
        id: user.id,
        wallet: user.wallet,
        telegramUsername: user.telegramUsername || undefined,
        discordUsername: user.discordUsername || undefined,
        twitterUsername: user.twitterUsername || undefined,
        points: user.points,
        lastActive: user.lastActive || undefined,
        createdAt: user.createdAt,
        lifetimePoints: user.lifetimePoints,
        bestRank: user.bestRank || undefined,
        telegramAccount: user.telegramAccount
          ? {
              ...user.telegramAccount,
              username: user.telegramAccount.username || undefined,
            }
          : undefined,
        discordAccount: user.discordAccount
          ? {
              ...user.discordAccount,
              username: user.discordAccount.username || undefined,
            }
          : undefined,
        twitterAccount: user.twitterAccount
          ? {
              ...user.twitterAccount,
              username: user.twitterAccount.username || undefined,
            }
          : undefined,
        streaks: user.streaks
          ? {
              ...user.streaks,
              lastTelegram: user.streaks.lastTelegram || undefined,
              lastDiscord: user.streaks.lastDiscord || undefined,
              lastTwitter: user.streaks.lastTwitter || undefined,
            }
          : undefined,
      };

      return {
        success: true,
        token,
        user: userResponse,
      };
    } catch (error) {
      logger.error("Error verifying signature:", error);
      return {
        success: false,
        error: "Authentication failed",
      };
    }
  }

  async getCurrentUser(userId: string): Promise<UserWithRelations> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          telegramAccount: true,
          discordAccount: true,
          twitterAccount: true,
          streaks: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user as UserWithRelations;
    } catch (error) {
      logger.error("Error fetching user:", error);
      throw error;
    }
  }

  private cleanupNonces(): void {
    const now = Date.now();
    for (const [wallet, data] of this.nonceStore.entries()) {
      if (now > data.expires) {
        this.nonceStore.delete(wallet);
      }
    }
  }

  startCleanup(): void {
    setInterval(() => this.cleanupNonces(), 5 * 60 * 1000);
  }

  public async getTwitterAuthUrl(state: string): Promise<string> {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      throw new Error('Twitter OAuth configuration missing');
    }

    const scope = 'tweet.read users.read';
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  }

  public async handleTwitterCallback(code: string, wallet: string): Promise<{ username: string }> {
    try {
      const clientId = process.env.TWITTER_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;
      const redirectUri = process.env.TWITTER_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Twitter OAuth configuration missing');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: 'challenge',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json() as { access_token: string };
      const { access_token } = tokenData;

      // Get user info
      const userResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json() as { 
        data: { 
          id: string;
          username: string;
        }
      };
      const { username, id: platformId } = userData.data;

      // Update user in database
      await this.prisma.user.update({
        where: { wallet },
        data: {
          twitterUsername: username,
          twitterAccount: {
            upsert: {
              create: {
                username,
                platformId
              },
              update: {
                username,
                platformId
              },
            },
          },
        },
      });

      return { username };
    } catch (error) {
      logger.error('Error handling Twitter callback:', error);
      throw error;
    }
  }

  public async getDiscordAuthUrl(state: string): Promise<string> {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      throw new Error('Discord OAuth configuration missing');
    }

    const scope = 'identify';
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  }

  public async handleDiscordCallback(code: string, wallet: string): Promise<{ username: string }> {
    try {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;
      const redirectUri = process.env.DISCORD_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Discord OAuth configuration missing');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Failed to get access token: ${errorData}`);
      }

      const tokenData = await tokenResponse.json() as { access_token: string, token_type: string };
      const { access_token, token_type } = tokenData;

      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `${token_type} ${access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json() as {
        id: string;
        username: string;
        discriminator: string;
      };
      
      const { username, id: platformId } = userData;
      
      // Update user in database
      await this.prisma.user.update({
        where: { wallet },
        data: {
          discordUsername: username,
          discordAccount: {
            upsert: {
              create: {
                username,
                platformId
              },
              update: {
                username,
                platformId
              }
            }
          }
        }
      });

      return { username };
    } catch (error) {
      logger.error('Error handling Discord callback:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();
