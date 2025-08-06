// src/routes/stats/types.ts
import { Platform } from "@prisma/client";
export { Platform };
export type ActivityType =
  | "MESSAGE"
  | "REACTION"
  | "VOICE_CHAT"
  | "MUSIC_SHARE"
  | "INVITE";

export interface PlatformStats {
  points: number;
  interactions: number;
  engagements: number;
}

export interface MultiPlatformStats {
  points: number;
  totalPoints: number;
  rank: number;
  platforms: {
    telegram: PlatformStats;
    discord: PlatformStats;
    twitter: PlatformStats;
  };
  platformStats: {
    TELEGRAM: PlatformStats;
    DISCORD: PlatformStats;
    TWITTER: PlatformStats;
  };
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  timestamp: Date;
  type: ActivityType;
  platform: Platform;
  points: number;
  metadata: Record<string, any>;
}

export interface UserContestStats {
  totalContests: number;
  totalPoints: number;
  bestRank: number;
  contestHistory: Array<{
    contestId: string;
    rank: number | null;
    points: number;
  }>;
}

export interface GlobalStats {
  totalUsers: number;
  activeToday: number;
  totalPoints: number;
  totalEngagements: number;
  platformStats: {
    TELEGRAM: {
      activeUsers: number;
      totalPoints: number;
    };
    DISCORD: {
      activeUsers: number;
      totalPoints: number;
    };
    TWITTER: {
      activeUsers: number;
      totalPoints: number;
    };
  };
  topActions: Record<string, number>;
  contest: {
    currentRound: string;
    timeLeft: string;
    qualifiedUsers: number;
  } | null;
}

export type TimeFrame = "DAY" | "WEEK" | "MONTH" | "YEAR";

export interface TimeSeriesStats {
  date: string;
  TELEGRAM: {
    engagements: number;
    points: number;
  };
  DISCORD: {
    engagements: number;
    points: number;
  };
  TWITTER: {
    engagements: number;
    points: number;
  };
  newUsers: number;
  total: {
    engagements: number;
    points: number;
  };
}

export interface ActionBreakdown {
  type: string;
  count: number;
  percentage: number;
}
