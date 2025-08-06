// src/routes/auth/types.ts
import { User, TelegramAccount, DiscordAccount, TwitterAccount, UserStreak } from "../../types";
import { Response } from "express";

export interface VerificationCode {
  code: string;
  expiresIn: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Request body types
export interface GenerateCodeRequest {
  wallet: string;
  platform: string;
}

export interface VerifySignatureRequest {
  wallet: string;
  signature: string;
  message: string;
}

// Prisma response handling types
export interface PlatformAccount {
  id: string;
  platformId: string;
  username: string | null;
  userId: string;
  createdAt: Date;
}

export interface UserWithRelations {
  id: string;
  wallet: string;
  telegramUsername?: string;
  discordUsername?: string;
  twitterUsername?: string;
  points: number;
  lastActive?: Date;
  createdAt: Date;
  telegramAccount: TelegramAccount | null;
  discordAccount: DiscordAccount | null;
  twitterAccount: TwitterAccount | null;
  streaks: UserStreak | null;
  lifetimePoints: number;
  bestRank?: number;
}
