import { TelegramBot } from "../core/bots/platforms/telegram/TelegramBot";
import { DiscordBot } from "../core/bots/platforms/discord/DiscordBot";
import { DiscordCommandHandler } from "../core/bots/platforms/discord/handlers/DiscordCommandHandler";
import { EngagementTracker } from "../core/engagement/EngagementTracker";
import { EngagementTrackerFactory } from "../core/engagement/EngagementTrackerFactory";
import { UserManager } from "../core/user/UserManager";
import { RewardManager } from "../core/contest/RewardManager";
import { PrismaClient, EngagementType, ContestStatus } from "@prisma/client";
import { Bot } from "grammy";
import YouTubeService from "../utils/youtube";
import { Client as DiscordClient } from "discord.js";

// Mock YouTube service
jest.mock("../utils/youtube", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    searchVideo: jest.fn().mockResolvedValue({
      title: "Test Video",
      url: "https://youtube.com/test",
    }),
  })),
}));

// Mock Grammy
jest.mock("grammy", () => ({
  Bot: jest.fn().mockImplementation(() => ({
    command: jest.fn(),
    on: jest.fn(),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    catch: jest.fn(),
    api: {
      setMyCommands: jest.fn().mockResolvedValue(undefined),
    },
  })),
}));

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    telegramAccount: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    discordAccount: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    userStreak: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    pointTransaction: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    contest: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    contestEntry: {
      deleteMany: jest.fn(),
    },
    engagement: {
      deleteMany: jest.fn(),
    },
    verificationCode: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  })),
  EngagementType: {
    MUSIC_SHARE: "MUSIC_SHARE",
    MESSAGE: "MESSAGE",
    COMMAND: "COMMAND",
    QUALITY_POST: "QUALITY_POST",
    MENTION: "MENTION",
    TEACHING_POST: "TEACHING_POST",
    FACT_SHARE: "FACT_SHARE",
  },
  ContestStatus: {
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
  },
}));

// Mock Discord.js
jest.mock("discord.js", () => ({
  Client: jest.fn().mockImplementation(() => ({
    once: jest.fn(),
    on: jest.fn(),
    login: jest.fn().mockResolvedValue("logged in"),
    destroy: jest.fn().mockResolvedValue(undefined),
    user: { tag: "TestBot#1234" },
  })),
  Collection: jest.fn().mockImplementation(() => new Map()),
  Events: {
    ClientReady: "ready",
    MessageCreate: "messageCreate",
    InteractionCreate: "interactionCreate",
    GuildMemberAdd: "guildMemberAdd",
    Error: "error",
  },
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
  })),
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn().mockResolvedValue([]),
  })),
  Routes: {
    applicationGuildCommands: jest.fn(),
  },
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 512,
    MessageContent: 32768,
  },
}));

// Mock environment variables
process.env.TELEGRAM_BOT_TOKEN = "test-telegram-token";
process.env.DISCORD_BOT_TOKEN = "test-discord-token";
process.env.DISCORD_CLIENT_ID = "test-client-id";
process.env.DISCORD_GUILD_ID = "test-guild-id";
process.env.YOUTUBE_API_KEY = "test-youtube-key";

const mockPrisma = new PrismaClient();

describe("Bot Commands Tests", () => {
  let telegramBot: TelegramBot;
  let discordBot: DiscordBot;
  let discordHandler: DiscordCommandHandler;
  let mockInstance: EngagementTracker;
  let userManager: UserManager;
  let rewardManager: RewardManager;
  let mockGrammyBot: any;
  let mockDiscordClient: any;

  const TEST_USER_ID = "test-user-id";
  const TEST_WALLET = "test-wallet";
  const TEST_TELEGRAM_ID = "123456789";
  const TEST_DISCORD_ID = "987654321";

  beforeAll(async () => {
    // Mock database responses
    (mockPrisma.user.upsert as jest.Mock).mockResolvedValue({
      id: TEST_USER_ID,
      wallet: TEST_WALLET,
      points: 100,
      streaks: {
        telegramStreak: 1,
        discordStreak: 1,
        twitterStreak: 0,
      },
    });

    (mockPrisma.telegramAccount.upsert as jest.Mock).mockResolvedValue({
      id: "test-telegram-id",
      platformId: TEST_TELEGRAM_ID,
      username: "test_telegram_user",
      userId: TEST_USER_ID,
    });

    (mockPrisma.discordAccount.upsert as jest.Mock).mockResolvedValue({
      id: "test-discord-id",
      platformId: TEST_DISCORD_ID,
      username: "test_discord_user",
      userId: TEST_USER_ID,
    });

    (mockPrisma.contest.upsert as jest.Mock).mockResolvedValue({
      id: "test-contest",
      name: "Test Contest",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: ContestStatus.ACTIVE,
    });

    // Mock common database queries
    (mockPrisma.telegramAccount.findUnique as jest.Mock).mockResolvedValue({
      id: "test-telegram-id",
      platformId: TEST_TELEGRAM_ID,
      username: "test_telegram_user",
      userId: TEST_USER_ID,
      user: {
        id: TEST_USER_ID,
        wallet: TEST_WALLET,
        points: 100,
      },
    });

    (mockPrisma.discordAccount.findUnique as jest.Mock).mockResolvedValue({
      id: "test-discord-id",
      platformId: TEST_DISCORD_ID,
      username: "test_discord_user",
      userId: TEST_USER_ID,
      user: {
        id: TEST_USER_ID,
        wallet: TEST_WALLET,
        points: 100,
      },
    });

    (mockPrisma.user.count as jest.Mock).mockResolvedValue(5);
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: TEST_USER_ID,
        telegramUsername: "test_user",
        discordUsername: "test_user",
        points: 100,
      },
    ]);

    (mockPrisma.userStreak.findUnique as jest.Mock).mockResolvedValue({
      userId: TEST_USER_ID,
      telegramStreak: 1,
      discordStreak: 1,
      twitterStreak: 0,
    });

    (mockPrisma.pointTransaction.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 10 },
    });

    (mockPrisma.pointTransaction.findMany as jest.Mock).mockResolvedValue([
      {
        id: "tx1",
        userId: TEST_USER_ID,
        amount: 5,
        reason: "MUSIC_SHARE",
        timestamp: new Date(),
      },
    ]);

    (mockPrisma.$transaction as jest.Mock).mockResolvedValue([]);
  });

  beforeEach(async () => {
    // Mock Grammy bot
    mockGrammyBot = {
      command: jest.fn(),
      on: jest.fn(),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      handlers: new Map(),
    };

    // Mock Discord client
    mockDiscordClient = {
      once: jest.fn(),
      on: jest.fn(),
      login: jest.fn().mockResolvedValue("logged in"),
      destroy: jest.fn().mockResolvedValue(undefined),
      user: { tag: "TestBot#1234" },
    };

    // Create engagement tracker mock
    mockInstance = {
      platform: "TELEGRAM",
      getCooldownInfo: jest.fn().mockResolvedValue(null),
      calculatePoints: jest.fn().mockReturnValue(1),
      canEngage: jest.fn().mockResolvedValue(true),
      getUserDailyPoints: jest.fn().mockResolvedValue(0),
      updateStreak: jest.fn().mockResolvedValue(undefined),
      getLastActivityDate: jest.fn().mockReturnValue(new Date()),
      getCurrentStreak: jest.fn().mockReturnValue(1),
      resetStreak: jest.fn().mockResolvedValue(undefined),
      incrementStreak: jest.fn().mockResolvedValue(undefined),
      isYesterdayOrEarlierToday: jest.fn().mockReturnValue(true),
      trackCommand: jest.fn().mockResolvedValue(undefined),
      trackEngagement: jest.fn().mockResolvedValue(true),
      trackMessage: jest.fn().mockResolvedValue(undefined),
      trackReaction: jest.fn().mockResolvedValue(undefined),
      getGlobalStats: jest.fn().mockResolvedValue({
        totalUsers: 1,
        activeToday: 1,
        totalPoints: 10,
        platformStats: {
          TELEGRAM: { activeUsers: 1, totalPoints: 5 },
          DISCORD: { activeUsers: 1, totalPoints: 5 },
          TWITTER: { activeUsers: 0, totalPoints: 0 },
        },
        topActions: {},
        contest: { currentRound: "", timeLeft: "", qualifiedUsers: 0 },
      }),
      getUserStats: jest.fn().mockResolvedValue({
        user: {
          id: TEST_USER_ID,
          points: 10,
          streaks: {
            telegramStreak: 1,
            discordStreak: 1,
            twitterStreak: 0,
          },
        },
        contestStats: {
          totalPoints: 10,
          rank: 1,
        },
        platforms: {
          TELEGRAM: { verified: true },
          DISCORD: { verified: true },
          TWITTER: { verified: false },
        },
      }),
      startContestRound: jest.fn().mockResolvedValue(undefined),
      endContestRound: jest.fn().mockResolvedValue(undefined),
    } as unknown as EngagementTracker;

    // Mock factory
    jest
      .spyOn(EngagementTrackerFactory, "getTracker")
      .mockReturnValue(mockInstance);

    // Mock UserManager
    jest.spyOn(UserManager.prototype, "getUserByPlatform").mockResolvedValue({
      id: TEST_USER_ID,
      wallet: TEST_WALLET,
      points: 10,
      streaks: {
        telegramStreak: 1,
        discordStreak: 1,
        twitterStreak: 0,
      },
    } as any);

    jest.spyOn(UserManager.prototype, "getUserStats").mockResolvedValue({
      user: {
        id: TEST_USER_ID,
        points: 10,
        streaks: {
          telegramStreak: 1,
          discordStreak: 1,
          twitterStreak: 0,
        },
        pointTransactions: [
          {
            id: "tx1",
            userId: TEST_USER_ID,
            platform: "DISCORD",
            metadata: {},
            timestamp: new Date(),
            amount: 5,
            reason: "MUSIC_SHARE",
            contestId: null,
          },
        ],
        contestEntries: [],
      },
      contestStats: {
        totalPoints: 10,
        rank: 1,
        platformPoints: {
          TELEGRAM: 5,
          DISCORD: 5,
          TWITTER: 0,
        },
      },
      platforms: {
        TELEGRAM: { verified: true },
        DISCORD: { verified: true },
        TWITTER: { verified: false },
      },
    } as any);

    // Mock RewardManager
    jest
      .spyOn(RewardManager.prototype, "checkTierEligibility")
      .mockResolvedValue({
        eligible: true,
        currentTier: {
          name: "GOLD",
          minPoints: 100,
          reward: "SOUL",
        },
        nextTier: {
          name: "PLATINUM",
          minPoints: 200,
          reward: "SOLANA",
        },
        pointsNeeded: 100,
      });

    // Create bot instances
    userManager = UserManager.getInstance();
    rewardManager = RewardManager.getInstance();

    discordHandler = new DiscordCommandHandler(
      "DISCORD",
      mockInstance as EngagementTracker,
      userManager,
      rewardManager
    );

    // Create actual bot instances for integration testing
    telegramBot = new TelegramBot({
      token: "test-token",
      platform: "TELEGRAM",
    });

    discordBot = new DiscordBot({
      token: "test-token",
      platform: "DISCORD",
    });
  });

  afterAll(async () => {
    // Clean up test data
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Telegram Bot Tests", () => {
    it("should initialize Telegram bot successfully", async () => {
      expect(telegramBot).toBeDefined();
      expect(telegramBot).toBeInstanceOf(TelegramBot);
    });

    it("should handle start method", async () => {
      // Since the bot is mocked, we just test that the method exists and can be called
      await expect(telegramBot.start()).resolves.not.toThrow();
    });

    it("should handle stop method", async () => {
      // Since the bot is mocked, we just test that the method exists and can be called
      await expect(telegramBot.stop()).resolves.not.toThrow();
    });

    it("should handle points command context", () => {
      // Test that the telegram bot has the right structure
      expect(telegramBot.getBot()).toBeDefined();
    });
  });

  describe("Discord Bot Tests", () => {
    it("should initialize Discord bot successfully", async () => {
      expect(discordBot).toBeDefined();
      expect(discordBot).toBeInstanceOf(DiscordBot);
    });

    it("should handle start method", async () => {
      await expect(discordBot.start()).resolves.not.toThrow();
    });

    it("should handle stop method", async () => {
      await expect(discordBot.stop()).resolves.not.toThrow();
    });

    it("should have client getter", () => {
      const client = discordBot.getClient();
      expect(client).toBeDefined();
    });
  });

  describe("Discord Command Handler Tests", () => {
    it("should handle points command", async () => {
      const message = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand("points", [], message as any);
      expect(message.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("SOLess Stats"),
        })
      );
    });

    it("should handle help command", async () => {
      const message = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand("help", [], message as any);
      expect(message.reply).toHaveBeenCalledWith(
        expect.stringContaining("Available Commands")
      );
    });

    it("should handle soulieplay command", async () => {
      const message = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand(
        "soulieplay",
        ["test", "song"],
        message as any
      );
      expect(message.reply).toHaveBeenCalledWith(
        expect.stringContaining("Thanks for sharing")
      );
    });

    it("should handle unknown command", async () => {
      const message = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand("unknown", [], message as any);
      expect(message.reply).toHaveBeenCalledWith(
        expect.stringContaining("Unknown command")
      );
    });

    it("should validate user before handling commands", async () => {
      // Mock user not found
      jest
        .spyOn(UserManager.prototype, "getUserByPlatform")
        .mockResolvedValueOnce(null);

      const message = {
        author: { id: "unknown-user" },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand("points", [], message as any);
      expect(message.reply).toHaveBeenCalledWith(
        expect.stringContaining("verify your account")
      );
    });
  });

  describe("Bot Integration Tests", () => {
    it("should track engagement when processing commands", async () => {
      const message = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand(
        "soulieplay",
        ["test song"],
        message as any
      );

      expect(mockInstance.trackEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          type: "MUSIC_SHARE",
          platform: "DISCORD",
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      // Mock database error
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      const message = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn(),
      };

      await discordHandler.handleCommand("points", [], message as any);
      // Should still attempt to reply even if there's an error
      expect(message.reply).toHaveBeenCalled();
    });
  });

  describe("Bot Manager Integration", () => {
    it("should create bots with proper configuration", () => {
      const telegramConfig = {
        token: "test-token",
        platform: "TELEGRAM" as const,
      };

      const discordConfig = {
        token: "test-token",
        platform: "DISCORD" as const,
      };

      const tgBot = new TelegramBot(telegramConfig);
      const dcBot = new DiscordBot(discordConfig);

      expect(tgBot).toBeInstanceOf(TelegramBot);
      expect(dcBot).toBeInstanceOf(DiscordBot);
    });
  });
});
