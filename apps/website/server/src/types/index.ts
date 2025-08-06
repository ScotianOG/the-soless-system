import { Request } from "express";

export const Platform = {
  TELEGRAM: "TELEGRAM",
  DISCORD: "DISCORD",
  TWITTER: "TWITTER",
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

export interface GlobalBotConfig {
  enabled: boolean;
  token: string;
  clientId?: string;
  clientSecret?: string;
  channels?: string[];
  admins?: string[];
  telegramToken?: string;
  discordToken?: string;
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

export interface PlatformConnection {
  platform: Platform;
  username: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface UserProfile {
  id: string;
  wallet: string;
  telegramUsername?: string;
  discordUsername?: string;
  twitterUsername?: string;
  lastActive?: Date;
  createdAt: Date;
  points: number;
  lifetimePoints: number;
  bestRank?: number;
}

export interface User {
  id: string;
  wallet: string;
  telegramUsername?: string;
  discordUsername?: string;
  twitterUsername?: string;
  points: number;
  lastActive?: Date;
  createdAt: Date;
  lifetimePoints: number;
  bestRank?: number;
  telegramAccount?: TelegramAccount;
  discordAccount?: DiscordAccount;
  twitterAccount?: TwitterAccount;
  streaks?: UserStreak;
}

export interface TelegramAccount {
  id: string;
  platformId: string;
  username?: string;
  userId: string;
  createdAt: Date;
}

export interface DiscordAccount {
  id: string;
  platformId: string;
  username?: string;
  userId: string;
  createdAt: Date;
}

export interface TwitterAccount {
  id: string;
  platformId: string;
  username?: string;
  userId: string;
  createdAt: Date;
}

export interface UserStreak {
  id: string;
  userId: string;
  telegramStreak: number;
  discordStreak: number;
  twitterStreak: number;
  lastTelegram?: Date;
  lastDiscord?: Date;
  lastTwitter?: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface ContestRules {
  minPoints: number;
  duration: number;
  tiers: ContestTier[];
}

export interface ContestTier {
  id: string;
  name: string;
  minPoints: number;
  reward: string;
  description?: string;
}

export const ContestStatus = {
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type ContestStatus = (typeof ContestStatus)[keyof typeof ContestStatus];

export interface PlatformStats {
  totalPoints: number;
  messageCount: number;
  reactionCount: number;
  streak: number;
  lastActive?: Date;
  rank: number; // Add this line
}

export interface MultiPlatformStats {
  userId: string;
  totalPoints: number;
  platformStats: {
    TELEGRAM: PlatformStats;
    DISCORD: PlatformStats;
    TWITTER: PlatformStats;
  };
}

export interface RateLimiterConfig {
  maxRequests: number;
  timeWindow: number;
}

export interface YouTubeConfig {
  apiKey: string;
  channelId: string;
}
