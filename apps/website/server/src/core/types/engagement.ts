// src/core/types/engagement.ts
import { Platform } from "./platform";
import type { Engagement } from "@prisma/client";

export type EngagementType = Engagement["type"];

export interface EngagementEvent {
  platform: Platform;
  userId: string;
  type: EngagementType;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface PointAward {
  amount: number;
  reason: string;
  platform: Platform;
  timestamp: Date;
}

export interface UserActivity {
  lastActive: Date;
  streaks: {
    [key in Platform]: {
      currentStreak: number;
      lastActive: Date | null;
    };
  };
  points: {
    total: number;
    daily: number;
    weekly: number;
    byPlatform: {
      [key in Platform]: number;
    };
  };
}

export interface EngagementRule {
  points: number;
  cooldown?: number;
  dailyLimit?: number;
}

export type PointConfig = {
  [key in Platform]: {
    [action: string]: EngagementRule;
  };
};
