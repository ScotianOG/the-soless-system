// src/config/engagement.ts
import { ContestConfig } from "../core/types/contest";
import { Platform } from "../types";
import { EngagementType } from "../core/types/engagement";

export interface EngagementRule {
  points: number;
  cooldown?: number;
  dailyLimit?: number;
  minWords?: number;
  resetHour?: number;
  daysRequired?: number;
  maxDaily?: number;
}

export type PlatformConfig = Record<
  Platform,
  Partial<Record<EngagementType, EngagementRule>>
>;

export const ENGAGEMENT_CONFIG = {
  // Core point values and rules
  points: {
    TELEGRAM: {
      MESSAGE: { points: 1, cooldown: 60 }, // 1 minute cooldown for keyword messages
      QUALITY_POST: { points: 1, cooldown: 300 }, // 5 min cooldown
      MENTION: { points: 1, cooldown: 180 }, // 3 min cooldown
      TEACHING_POST: { points: 4, cooldown: 900 }, // 15 min cooldown
      DAILY_ACTIVE: { points: 2 },
      STREAK_BONUS: { points: 5 },
      MUSIC_SHARE: { points: 5, dailyLimit: 10 }, // 10 per day
      FACT_SHARE: { points: 2, dailyLimit: 3 }, // 3 per day
      INVITE: { points: 10 },
    },
    DISCORD: {
      QUALITY_POST: { points: 1, cooldown: 300 },
      DAILY_ACTIVE: { points: 2 },
      STREAK_BONUS: { points: 5 },
      VOICE_CHAT: { points: 2, cooldown: 300 }, // 5 min cooldown
      REACTION: { points: 1, cooldown: 60 }, // 1 min cooldown
      INVITE: { points: 10 },
    },
    TWITTER: {
      TWEET: { points: 2, cooldown: 300 }, // 5 min cooldown
      RETWEET: { points: 1, cooldown: 300 },
      MENTION: { points: 3, cooldown: 600 },
      DAILY_ACTIVE: { points: 2 },
      STREAK_BONUS: { points: 5 },
    },
  } as PlatformConfig,

  // Platform-specific configurations
  platforms: {
    TELEGRAM: {
      chatId: process.env.TELEGRAM_CHAT_ID!,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      commands: {
        soulieplay: {
          enabled: true,
          pointReward: 5,
          cooldownMinutes: 5,
          maxDailySubmissions: 10,
        },
        solfact: {
          enabled: true,
          pointReward: 2,
          cooldownMinutes: 240, // 4 hours cooldown
          maxDailySubmissions: 3,
        },
        points: {
          enabled: true,
          cooldownMinutes: 1,
        },
        leaderboard: {
          enabled: true,
          refreshMinutes: 5,
          displayLimit: 10,
        },
        help: { enabled: true },
        admin: {
          announce: true,
          setPoints: true,
          manageUsers: true,
        },
      },
      features: {
        pointTracking: true,
        streaks: true,
        inviteRewards: true,
        qualityPosts: true,
        teachingPosts: true, // Add this new feature flag
      },
    },
    DISCORD: {
      guildId: process.env.DISCORD_GUILD_ID!,
      voiceChat: {
        enabled: true,
        minDurationSeconds: 300, // 5 minutes minimum
        pointsPerInterval: 2,
        intervalMinutes: 15,
        minDuration: 60, // minimum duration in seconds
      },
      reactions: {
        enabled: true,
        points: 1,
        cooldownSeconds: 30,
        dailyLimit: 50,
      },
      features: {
        musicBot: true,
        roleRewards: true,
        voiceRewards: true,
      },
    },
    TWITTER: {
      webhookUrl: process.env.TWITTER_WEBHOOK_URL,
      tracking: {
        keywords: ["soless", "#soless", "@soless"],
        hashtags: ["#soless", "#solesssystem"],
        accounts: ["@soless_official"],
      },
      points: {
        tweet: { points: 2, cooldown: 300 },
        retweet: { points: 1, cooldown: 300 },
        mention: { points: 3, cooldown: 600 },
        hashtag: { points: 2, cooldown: 300 },
      },
      features: {
        autoRetweet: true,
        mentionTracking: true,
        hashtagTracking: true,
        accountActivity: true,
      },
    },
  },

  // Global streak configurations
  streaks: {
    singlePlatformBonus: 3, // Points for platform-specific streaks
    allPlatformsBonus: 15, // Bonus for maintaining streaks on all platforms
    resetHour: 0, // When daily streaks reset (UTC)
    maxMissedDays: 1, // How many days can be missed before streak breaks
  },

  // Feature flags
  features: {
    pointTracking: true,
    multiPlatform: true,
    streaks: true,
    inviteRewards: true,
    qualityPosts: true,
    musicSharing: true,
    adminCommands: true,
  },

  // Admin configuration
  admin: {
    minPointsAward: -1000, // Minimum points an admin can award/remove
    maxPointsAward: 1000, // Maximum points an admin can award/remove
    commands: {
      announce: true,
      setPoints: true,
      manageUsers: true,
      configureBot: true,
      viewStats: true,
    },
    roles: {
      superAdmin: ["OWNER"],
      admin: ["ADMIN", "MODERATOR"],
      helper: ["HELPER"],
    },
  },

  // Contest mode settings
  contests: {
    enabled: true,
    roundDurationHours: 24, //  24 hour cycles only while testing
    minPointsToQualify: 0, // No min points needed to qualify while testing
    prizes: [
      {
        rank: 1,
        reward: "USDC",
        amount: "100",
        description: "First Place - 250 USDC",
      },
      {
        rank: 2,
        reward: "USDC",
        amount: "75",
        description: "Second Place - 150 USDC",
      },
      {
        rank: 3,
        reward: "USDC",
        amount: "50",
        description: "Third Place - 100 USDC",
      },
      {
        rank: 4,
        reward: "USDC",
        amount: "25",
        description: "Fourth Place - 50 USDC",
      },
      {
        rank: 5,
        reward: "USDC",
        amount: "10",
        description: "Fifth Place - 25 USDC",
      },
    ],
    tiers: [
      { name: "BRONZE", minPoints: 50, reward: "WHITELIST" },
      { name: "SILVER", minPoints: 100, reward: "FREE_MINT" },
      { name: "GOLD", minPoints: 200, reward: "FREE_GAS" },
      { name: "PLATINUM", minPoints: 300, reward: "NO_FEES" },
      { name: "DIAMOND", minPoints: 500, reward: "SOUL" },
    ],
    rules: {
      entryRequirements: {
        minimumPoints: 100,
        platforms: ["TELEGRAM", "DISCORD", "TWITTER"],
      },
      restrictions: {
        maxEntriesPerUser: 1,
        cooldownPeriod: 3600,
      },
      bonuses: {
        streakMultiplier: 1.2,
        platformMultiplier: {
          TELEGRAM: 1.1,
          DISCORD: 1.1,
          TWITTER: 1.1,
        },
      },
    },
  } as ContestConfig,

  // Global rate limits
  rateLimits: {
    maxPointsPerDay: 1000, // Maximum points a user can earn per day
    maxInvitesPerDay: 10, // Maximum number of invites per day
    maxCommandsPerMinute: 10, // Maximum commands per minute
    cooldownMinutes: {
      default: 1,
      points: 1,
      leaderboard: 5,
      help: 1,
    },
  },

  roles: {
    admin: ["Admin", "Moderator"], // Add the admin role names you want to check for
  },
};
