// src/routes/users/types.ts
export type Platform = 'telegram' | 'discord' | 'twitter';

export interface UserProfile {
  id: string;
  wallet: string;
  points: number;
  telegramUsername?: string;
  discordUsername?: string;
  twitterUsername?: string;
  createdAt: Date;
  lastActive?: Date;
}

export interface UpdateStreakRequest {
  wallet: string;
  platform: Platform;
}

export interface UserStreaks {
  id: string;
  userId: string;
  telegramStreak: number;
  discordStreak: number;
  twitterStreak: number;
  lastTelegram?: Date;
  lastDiscord?: Date;
  lastTwitter?: Date;
}
