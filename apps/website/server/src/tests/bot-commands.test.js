"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TelegramCommandHandler_1 = require("../core/bots/platforms/telegram/handlers/TelegramCommandHandler");
const DiscordCommandHandler_1 = require("../core/bots/platforms/discord/handlers/DiscordCommandHandler");
const EngagementTrackerFactory_1 = require("../core/engagement/EngagementTrackerFactory");
const UserManager_1 = require("../core/user/UserManager");
const RewardManager_1 = require("../core/contest/RewardManager");
const client_1 = require("@prisma/client");
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
const prisma = new client_1.PrismaClient();
describe("Bot Commands Tests", () => {
    let telegramHandler;
    let discordHandler;
    let mockInstance;
    let userManager;
    let rewardManager;
    const TEST_USER_ID = "test-user-id";
    const TEST_WALLET = "test-wallet";
    beforeAll(async () => {
        // Create or update test user with streaks
        await prisma.user.upsert({
            where: { id: TEST_USER_ID },
            create: {
                id: TEST_USER_ID,
                wallet: TEST_WALLET,
                points: 0,
                streaks: {
                    create: {
                        telegramStreak: 1,
                        discordStreak: 1,
                        twitterStreak: 0,
                        lastTelegram: new Date(),
                        lastDiscord: new Date(),
                        lastTwitter: null,
                    },
                },
            },
            update: {
                wallet: TEST_WALLET,
                points: 0,
            },
        });
        // Create platform accounts with verified status
        await prisma.telegramAccount.upsert({
            where: { id: "test-telegram-id" },
            create: {
                id: "test-telegram-id",
                platformId: "test-telegram-platform-id",
                username: "test_telegram_user",
                userId: TEST_USER_ID,
            },
            update: {
                platformId: "test-telegram-platform-id",
                username: "test_telegram_user",
                userId: TEST_USER_ID,
            },
        });
        await prisma.discordAccount.upsert({
            where: { id: "test-discord-id" },
            create: {
                id: "test-discord-id",
                platformId: "test-discord-platform-id",
                username: "test_discord_user",
                userId: TEST_USER_ID,
            },
            update: {
                platformId: "test-discord-platform-id",
                username: "test_discord_user",
                userId: TEST_USER_ID,
            },
        });
        // Create test contest
        await prisma.contest.upsert({
            where: { id: "test-contest" },
            create: {
                id: "test-contest",
                name: "Test Contest",
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: client_1.ContestStatus.ACTIVE,
            },
            update: {
                name: "Test Contest",
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: client_1.ContestStatus.ACTIVE,
            },
        });
    });
    let mockBot;
    beforeEach(async () => {
        mockBot = {
            command: jest.fn().mockImplementation((cmd, handler) => {
                mockBot.handlers = mockBot.handlers || {};
                mockBot.handlers[cmd] = handler;
            }),
            on: jest.fn(),
            handlers: {},
        };
        // Create a complete mock implementation
        const mock = {
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
        };
        mockInstance = mock;
        // Mock the factory getTracker method
        jest
            .spyOn(EngagementTrackerFactory_1.EngagementTrackerFactory, "getTracker")
            .mockReturnValue(mockInstance);
        // Mock UserManager and RewardManager methods
        jest.spyOn(UserManager_1.UserManager.prototype, "getUserByPlatform").mockResolvedValue({
            id: TEST_USER_ID,
            wallet: TEST_WALLET,
            points: 10,
            streaks: {
                telegramStreak: 1,
                discordStreak: 1,
                twitterStreak: 0,
            },
        });
        jest
            .spyOn(RewardManager_1.RewardManager.prototype, "checkTierEligibility")
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
        telegramHandler = new TelegramCommandHandler_1.TelegramCommandHandler(mockBot);
        await telegramHandler.initialize();
        userManager = UserManager_1.UserManager.getInstance();
        rewardManager = RewardManager_1.RewardManager.getInstance();
        discordHandler = new DiscordCommandHandler_1.DiscordCommandHandler("DISCORD", mockInstance, userManager, rewardManager);
    });
    afterAll(async () => {
        // Clean up test data in correct order to avoid foreign key constraints
        await prisma.userStreak.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.contestEntry.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.engagement.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.pointTransaction.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.telegramAccount.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.discordAccount.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.contest.deleteMany({
            where: { status: client_1.ContestStatus.ACTIVE },
        });
        await prisma.user.deleteMany({
            where: { id: TEST_USER_ID },
        });
        await prisma.$disconnect();
        // Clear all mocks
        jest.restoreAllMocks();
    });
    describe("Telegram Commands", () => {
        it("should handle /start command", async () => {
            const ctx = {
                from: { id: parseInt(TEST_USER_ID), username: "test_user" },
                reply: jest.fn(),
            };
            await mockBot.handlers["start"](ctx);
            expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Welcome to SOLess"));
        });
        it("should handle /help command", async () => {
            const ctx = {
                from: { id: parseInt(TEST_USER_ID), username: "test_user" },
                reply: jest.fn(),
            };
            await mockBot.handlers["help"](ctx);
            expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Available commands"));
        });
        it("should handle /soulieplay command", async () => {
            const ctx = {
                from: { id: parseInt(TEST_USER_ID), username: "test_user" },
                message: { text: "/soulieplay test song" },
                reply: jest.fn(),
            };
            await mockBot.handlers["soulieplay"](ctx);
            expect(ctx.reply).toHaveBeenCalled();
        });
    });
    describe("Discord Commands", () => {
        it("should handle !points command", async () => {
            const message = {
                author: { id: TEST_USER_ID },
                reply: jest.fn(),
            };
            await discordHandler.handleCommand("points", [], message);
            expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("SOLess Stats"));
        });
        it("should handle !help command", async () => {
            const message = {
                author: { id: TEST_USER_ID },
                reply: jest.fn(),
            };
            await discordHandler.handleCommand("help", [], message);
            expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Available Commands"));
        });
        it("should handle !soulieplay command", async () => {
            const message = {
                author: { id: TEST_USER_ID },
                reply: jest.fn(),
            };
            await discordHandler.handleCommand("soulieplay", ["test", "song"], message);
            expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Thanks for sharing"));
        });
    });
});
