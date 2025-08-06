import { DiscordCommandHandler } from "../core/bots/platforms/discord/handlers/DiscordCommandHandler";
import { DiscordMessageHandler } from "../core/bots/platforms/discord/handlers/DiscordMessageHandler";
import { DiscordAdminHandler } from "../core/bots/platforms/discord/handlers/DiscordAdminHandler";
import { EngagementTracker } from "../core/engagement/EngagementTracker";
import { UserManager } from "../core/user/UserManager";
import { RewardManager } from "../core/contest/RewardManager";

// Mock Discord.js
jest.mock("discord.js", () => ({
  Message: jest.fn(),
  MessageReaction: jest.fn(),
  User: jest.fn(),
  PartialUser: jest.fn(),
  GuildMember: jest.fn(),
  Role: jest.fn(),
  TextChannel: jest.fn(),
}));

// Mock Prisma
jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    contest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    engagement: {
      count: jest.fn(),
    },
  },
}));

describe("Bot Handlers Tests", () => {
  let commandHandler: DiscordCommandHandler;
  let messageHandler: DiscordMessageHandler;
  let adminHandler: DiscordAdminHandler;
  let mockEngagementTracker: jest.Mocked<EngagementTracker>;
  let mockUserManager: jest.Mocked<UserManager>;
  let mockRewardManager: jest.Mocked<RewardManager>;
  let mockDiscordClient: any;

  const TEST_USER_ID = "test-user-123";
  const TEST_DISCORD_ID = "discord-456";

  beforeEach(() => {
    // Mock Prisma with proper return values
    const mockPrisma = require("../lib/prisma").prisma;
    mockPrisma.user.count.mockResolvedValue(100);
    mockPrisma.engagement.count.mockResolvedValue(500);
    mockPrisma.contest.findFirst.mockResolvedValue({
      id: "test-contest",
      name: "Test Contest",
      status: "ACTIVE",
    });

    // Create mocks
    mockEngagementTracker = {
      trackEngagement: jest.fn().mockResolvedValue(undefined),
      trackCommand: jest.fn().mockResolvedValue(undefined),
      trackMessage: jest.fn().mockResolvedValue(undefined),
      trackReaction: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockUserManager = {
      getUserByPlatform: jest.fn().mockResolvedValue({
        id: TEST_USER_ID,
        wallet: "test-wallet",
        points: 100,
      }),
      getUserStats: jest.fn().mockResolvedValue({
        user: {
          id: TEST_USER_ID,
          points: 100,
          streaks: {
            telegramStreak: 1,
            discordStreak: 2,
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
          totalPoints: 100,
          rank: 1,
          platformPoints: {
            TELEGRAM: 30,
            DISCORD: 70,
            TWITTER: 0,
          },
        },
        platforms: {
          TELEGRAM: { verified: true },
          DISCORD: { verified: true },
          TWITTER: { verified: false },
        },
      }),
    } as any;

    mockRewardManager = {
      checkAndAwardEngagementRewards: jest.fn().mockResolvedValue(undefined),
      checkTierEligibility: jest.fn().mockResolvedValue({
        eligible: true,
        currentTier: { name: "GOLD", minPoints: 100, reward: "SOUL" },
        nextTier: { name: "PLATINUM", minPoints: 200, reward: "SOLANA" },
        pointsNeeded: 100,
      }),
    } as any;

    mockDiscordClient = {
      guilds: {
        cache: {
          first: jest.fn().mockReturnValue({
            members: {
              fetch: jest.fn().mockResolvedValue({
                permissions: {
                  has: jest.fn().mockReturnValue(true),
                },
                roles: {
                  cache: {
                    some: jest.fn().mockReturnValue(true),
                  },
                },
              }),
            },
            channels: {
              cache: {
                find: jest.fn().mockReturnValue({
                  isTextBased: jest.fn().mockReturnValue(true),
                  send: jest.fn().mockResolvedValue(undefined),
                }),
              },
            },
          }),
        },
      },
    };

    // Create handlers
    commandHandler = new DiscordCommandHandler(
      "DISCORD",
      mockEngagementTracker,
      mockUserManager,
      mockRewardManager
    );

    messageHandler = new DiscordMessageHandler(
      "DISCORD",
      mockEngagementTracker,
      mockUserManager,
      mockRewardManager
    );

    adminHandler = new DiscordAdminHandler(
      mockDiscordClient,
      mockEngagementTracker,
      mockUserManager,
      mockRewardManager
    );
  });

  describe("DiscordCommandHandler", () => {
    it("should handle points command successfully", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await commandHandler.handleCommand("points", [], mockMessage as any);

      expect(mockUserManager.getUserByPlatform).toHaveBeenCalledWith(
        "DISCORD",
        TEST_DISCORD_ID
      );
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("SOLess Stats"),
        })
      );
    });

    it("should handle help command", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await commandHandler.handleCommand("help", [], mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("Available Commands")
      );
    });

    it("should handle music sharing command", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await commandHandler.handleCommand(
        "soulieplay",
        ["test", "song"],
        mockMessage as any
      );

      expect(mockEngagementTracker.trackEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          type: "MUSIC_SHARE",
          platform: "DISCORD",
        })
      );
      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("Thanks for sharing")
      );
    });

    it("should handle unknown command", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await commandHandler.handleCommand("unknown", [], mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("Unknown command")
      );
    });

    it("should require verification for unverified users", async () => {
      mockUserManager.getUserByPlatform.mockResolvedValueOnce(null);

      const mockMessage = {
        author: { id: "unverified-user" },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await commandHandler.handleCommand("points", [], mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("verify your account")
      );
    });

    it("should handle rewards command", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await commandHandler.handleCommand("rewards", [], mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("coming soon")
      );
    });
  });

  describe("DiscordMessageHandler", () => {
    it("should handle regular messages", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID, bot: false },
        content: "Hello world",
        attachments: { size: 0 },
        embeds: [],
      };

      await messageHandler.handleMessage(mockMessage as any);

      expect(mockUserManager.getUserByPlatform).toHaveBeenCalledWith(
        "DISCORD",
        TEST_DISCORD_ID
      );
      expect(
        mockRewardManager.checkAndAwardEngagementRewards
      ).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("should ignore bot messages", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID, bot: true },
        content: "Bot message",
      };

      await messageHandler.handleMessage(mockMessage as any);

      expect(mockUserManager.getUserByPlatform).not.toHaveBeenCalled();
    });

    it("should handle messages with attachments", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID, bot: false },
        content: "Message with attachment",
        attachments: { size: 1 },
        embeds: [{}],
      };

      await messageHandler.handleMessage(mockMessage as any);

      expect(mockEngagementTracker.trackEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          type: "MESSAGE",
          metadata: {
            attachments: 1,
            embeds: 1,
          },
        })
      );
    });

    it("should handle reactions", async () => {
      const mockReaction = {
        emoji: { name: "👍" },
        message: { id: "message-123" },
      };

      const mockUser = {
        id: TEST_DISCORD_ID,
        bot: false,
      };

      await messageHandler.handleReaction(mockReaction as any, mockUser as any);

      expect(mockEngagementTracker.trackEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          type: "REACTION",
          metadata: {
            emoji: "👍",
            messageId: "message-123",
          },
        })
      );
    });

    it("should ignore bot reactions", async () => {
      const mockReaction = {
        emoji: { name: "👍" },
        message: { id: "message-123" },
      };

      const mockUser = {
        id: TEST_DISCORD_ID,
        bot: true,
      };

      await messageHandler.handleReaction(mockReaction as any, mockUser as any);

      expect(mockUserManager.getUserByPlatform).not.toHaveBeenCalled();
    });
  });

  describe("DiscordAdminHandler", () => {
    it("should check admin status", async () => {
      const result = await adminHandler.isAdmin(TEST_DISCORD_ID);
      expect(result).toBe(true);
    });

    it("should handle admin commands", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await adminHandler.handleAdminCommand("stats", [], mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalled();
    });

    it("should reject non-admin users", async () => {
      // Mock non-admin user
      mockDiscordClient.guilds.cache.first.mockReturnValueOnce({
        members: {
          fetch: jest.fn().mockResolvedValue({
            permissions: {
              has: jest.fn().mockReturnValue(false),
            },
            roles: {
              cache: {
                some: jest.fn().mockReturnValue(false),
              },
            },
          }),
        },
      });

      const mockMessage = {
        author: { id: "non-admin-user" },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await adminHandler.handleAdminCommand("stats", [], mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("administrators only")
      );
    });

    it("should handle stats command", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await adminHandler.handleStats(mockMessage as any);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining("Statistics"),
            }),
          ]),
        })
      );
    });

    it("should handle announcement command", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
        guild: {
          channels: {
            cache: {
              find: jest.fn().mockReturnValue({
                isTextBased: jest.fn().mockReturnValue(true),
                send: jest.fn().mockResolvedValue(undefined),
              }),
            },
          },
        },
      };

      await adminHandler.handleAdminCommand(
        "announce",
        ["Test", "announcement"],
        mockMessage as any
      );

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("sent successfully")
      );
    });

    it("should handle contest commands", async () => {
      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      await adminHandler.handleAdminCommand(
        "contest",
        ["start"],
        mockMessage as any
      );

      expect(mockMessage.reply).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockUserManager.getUserByPlatform.mockRejectedValueOnce(
        new Error("Database error")
      );

      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      // Expect the command to handle the error gracefully and not throw
      await expect(
        commandHandler.handleCommand("points", [], mockMessage as any)
      ).resolves.not.toThrow();

      // Should still attempt to reply even if there's an error
      expect(mockMessage.reply).toHaveBeenCalled();
    });

    it("should handle engagement tracking errors", async () => {
      // Set up a successful user lookup first
      mockUserManager.getUserByPlatform.mockResolvedValueOnce({
        id: TEST_USER_ID,
        wallet: "test-wallet",
        points: 100,
        lifetimePoints: 100,
        createdAt: new Date(),
        lastActive: new Date(),
        bestRank: null,
        telegramUsername: null,
        discordUsername: "testuser",
        twitterUsername: null,
        streaks: null,
        telegramAccount: null,
        discordAccount: {
          id: "disc-123",
          platformId: TEST_DISCORD_ID,
          username: "testuser",
          userId: TEST_USER_ID,
          createdAt: new Date(),
        },
        twitterAccount: null,
        contestEntries: [],
      });

      mockEngagementTracker.trackEngagement.mockRejectedValueOnce(
        new Error("Tracking error")
      );

      const mockMessage = {
        author: { id: TEST_DISCORD_ID },
        reply: jest.fn().mockResolvedValue(undefined),
      };

      // Expect the command to handle the tracking error gracefully
      await expect(
        commandHandler.handleCommand(
          "soulieplay",
          ["test", "song"],
          mockMessage as any
        )
      ).resolves.not.toThrow();

      // Should still reply even if tracking fails
      expect(mockMessage.reply).toHaveBeenCalled();
    });
  });
});
