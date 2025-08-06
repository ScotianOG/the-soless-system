"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBot = void 0;
// src/core/bots/platforms/telegram/TelegramBot.ts
const grammy_1 = require("grammy");
const BasePlatformBot_1 = require("../BasePlatformBot");
const client_1 = require("@prisma/client");
const youtube_1 = __importDefault(require("../../../../utils/youtube"));
const facts_1 = require("../../../../config/facts");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
var EngagementType;
(function (EngagementType) {
    EngagementType["MUSIC_SHARE"] = "MUSIC_SHARE";
    EngagementType["MESSAGE"] = "MESSAGE";
    EngagementType["COMMAND"] = "COMMAND";
    EngagementType["QUALITY_POST"] = "QUALITY_POST";
    EngagementType["MENTION"] = "MENTION";
    EngagementType["TEACHING_POST"] = "TEACHING_POST";
    EngagementType["FACT_SHARE"] = "FACT_SHARE";
})(EngagementType || (EngagementType = {}));
class TelegramBot extends BasePlatformBot_1.BasePlatformBot {
    constructor(config) {
        super(config);
        this.isRunning = false;
        this.userCooldowns = new Map();
        this.debug = process.env.NODE_ENV !== "production";
        this.bot = new grammy_1.Bot(this.token);
        this.youtubeService = new youtube_1.default(process.env.YOUTUBE_API_KEY || "");
        this.setupHandlers();
    }
    setupHandlers() {
        // Debug handler
        if (this.debug) {
            this.bot.command("ping", async (ctx) => {
                await ctx.reply("pong");
            });
        }
        // Help command
        this.bot.command("help", async (ctx) => {
            await ctx.reply(`🎵 SOLess Community Bot Commands 🎵

🎶 Music Commands:
- /soulieplay [song] - Share music and earn points (5 pts, max 10/day)

📚 Information Commands:
- /solfact - Share a random SOLess fact (2 pts, max 3/day)

📊 Stats & Rankings:
- /points - Check your points and stats
- /leaderboard - View top community members

🔗 Account Management:
- /verify [code] - Link your wallet with Telegram

Need more help? Visit our website or ask in the community!`);
        });
        // Verify command
        this.bot.command("verify", async (ctx) => {
            try {
                const text = ctx.message?.text || "";
                const parts = text.split(" ");
                const code = parts.length > 1 ? parts[1].trim().toUpperCase() : "";
                if (!code) {
                    await ctx.reply("Please provide your verification code:\n" +
                        "/verify YOUR_CODE\n\n" +
                        "Don't have a code? Visit https://soless.app/register to connect your wallet and generate one.");
                    return;
                }
                if (!ctx.from?.id) {
                    await ctx.reply("Could not identify user.");
                    return;
                }
                const verification = await prisma.verificationCode.findUnique({
                    where: { code },
                    include: { user: true },
                });
                if (!verification ||
                    verification.isUsed ||
                    new Date() > verification.expiresAt) {
                    await ctx.reply("❌ Invalid or expired code. Please try again.");
                    return;
                }
                // Check if this telegram account is already linked
                const existingAccount = await prisma.telegramAccount.findUnique({
                    where: { platformId: ctx.from.id.toString() },
                });
                if (existingAccount) {
                    await ctx.reply("This Telegram account is already linked to a wallet.");
                    return;
                }
                await prisma.$transaction([
                    // Mark code as used
                    prisma.verificationCode.update({
                        where: { id: verification.id },
                        data: { isUsed: true },
                    }),
                    // Update user record with Telegram username
                    prisma.user.update({
                        where: { id: verification.user.id },
                        data: { telegramUsername: ctx.from.username || undefined },
                    }),
                    // Create Telegram account link
                    prisma.telegramAccount.create({
                        data: {
                            userId: verification.user.id,
                            platformId: ctx.from.id.toString(),
                            username: ctx.from.username || undefined,
                        },
                    }),
                ]);
                await ctx.reply("✅ Account verified! Welcome to SOLess community! You can now start earning points.");
                // Award initial points for verification
                await prisma.$transaction([
                    prisma.pointTransaction.create({
                        data: {
                            userId: verification.user.id,
                            amount: 5,
                            reason: "COMMAND",
                            platform: "TELEGRAM",
                            metadata: { command: "verify" },
                        },
                    }),
                    prisma.user.update({
                        where: { id: verification.user.id },
                        data: {
                            points: { increment: 5 },
                            lifetimePoints: { increment: 5 },
                        },
                    }),
                ]);
            }
            catch (error) {
                console.error("Verification error:", error);
                await ctx.reply("An error occurred. Please try again later.");
            }
        });
        // Points command
        this.bot.command("points", async (ctx) => {
            try {
                if (!ctx.from?.id) {
                    await ctx.reply("Could not identify your account.");
                    return;
                }
                const telegramAccount = await prisma.telegramAccount.findUnique({
                    where: { platformId: ctx.from.id.toString() },
                    include: { user: true },
                });
                if (!telegramAccount) {
                    await ctx.reply("Your account is not linked yet.\n" +
                        "Please visit https://soless.app/register to connect your wallet and verify your account.");
                    return;
                }
                const user = telegramAccount.user;
                // Get rank
                const higherRanked = await prisma.user.count({
                    where: { points: { gt: user.points } },
                });
                // Get streak
                const streak = await prisma.userStreak.findUnique({
                    where: { userId: user.id },
                });
                // Get today's points
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayPoints = await prisma.pointTransaction.aggregate({
                    where: {
                        userId: user.id,
                        timestamp: { gte: today },
                    },
                    _sum: { amount: true },
                });
                // Get recent activity
                const recentActivity = await prisma.pointTransaction.findMany({
                    where: { userId: user.id },
                    orderBy: { timestamp: "desc" },
                    take: 5,
                });
                const activityTypes = {
                    MUSIC_SHARE: "Music sharing",
                    MESSAGE: "Regular message",
                    QUALITY_POST: "Quality post",
                    MENTION: "Mentioning others",
                    COMMAND: "Command used",
                    STREAK_BONUS: "Streak bonus",
                    TEACHING_POST: "Teaching post",
                    FACT_SHARE: "SOLess fact",
                };
                const message = [
                    "🏆 Your SOLess Stats 🏆",
                    "",
                    `Total Points: ${user.points}`,
                    `Global Rank: #${higherRanked + 1}`,
                    "",
                    "📱 Telegram Activity",
                    `• Current Streak: ${streak?.telegramStreak || 0} days`,
                    `• Points Today: ${todayPoints._sum.amount || 0}`,
                    "",
                    "💫 Recent Activity",
                ];
                if (recentActivity.length > 0) {
                    recentActivity.forEach((activity) => {
                        const type = activityTypes[activity.reason] ||
                            activity.reason;
                        message.push(`• ${type} (+${activity.amount})`);
                    });
                }
                else {
                    message.push("• No recent activity");
                }
                await ctx.reply(message.join("\n"));
            }
            catch (error) {
                console.error("Error fetching points:", error);
                await ctx.reply("An error occurred. Please try again later.");
            }
        });
        // Leaderboard command
        this.bot.command("leaderboard", async (ctx) => {
            try {
                // Get top users by points
                const leaders = await prisma.user.findMany({
                    where: {
                        telegramUsername: { not: null },
                    },
                    orderBy: { points: "desc" },
                    take: 10,
                });
                if (leaders.length === 0) {
                    await ctx.reply("No users on the leaderboard yet.");
                    return;
                }
                const message = ["🏆 SOLess Community Leaderboard 🏆", ""];
                leaders.forEach((user, index) => {
                    message.push(`${index + 1}. @${user.telegramUsername || "Anonymous"}: ${user.points} points`);
                });
                await ctx.reply(message.join("\n"));
            }
            catch (error) {
                console.error("Error fetching leaderboard:", error);
                await ctx.reply("An error occurred. Please try again later.");
            }
        });
        // Solfact command
        this.bot.command("solfact", async (ctx) => {
            try {
                if (!ctx.from?.id) {
                    await ctx.reply("Could not identify your account.");
                    return;
                }
                const telegramId = ctx.from.id.toString();
                // Find user
                const telegramAccount = await prisma.telegramAccount.findUnique({
                    where: { platformId: telegramId },
                    include: { user: true },
                });
                if (!telegramAccount) {
                    await ctx.reply("Your account is not linked yet.\n" +
                        "Please visit https://soless.app/register to connect your wallet and verify your account.");
                    return;
                }
                const userId = telegramAccount.userId;
                // Check cooldown
                const cooldownKey = `${userId}_FACT_SHARE`;
                const now = Date.now();
                const cooldowns = this.userCooldowns.get(userId) || {};
                if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
                    const remainingTime = Math.ceil((cooldowns[cooldownKey] - now) / 1000 / 60);
                    await ctx.reply(`Please wait ${remainingTime} minutes before sharing another SOLess fact.`);
                    return;
                }
                // Check daily limit
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dailyFacts = await prisma.pointTransaction.count({
                    where: {
                        userId,
                        reason: "FACT_SHARE",
                        timestamp: { gte: today },
                    },
                });
                if (dailyFacts >= facts_1.FACT_CONFIG.dailyLimit) {
                    await ctx.reply(`You've reached the daily limit of ${facts_1.FACT_CONFIG.dailyLimit} SOLess facts. Try again tomorrow!`);
                    return;
                }
                // Select random fact
                const randomFact = facts_1.SOLESS_FACTS[Math.floor(Math.random() * facts_1.SOLESS_FACTS.length)];
                // Award points
                await prisma.$transaction([
                    prisma.pointTransaction.create({
                        data: {
                            userId,
                            amount: facts_1.FACT_CONFIG.points,
                            reason: "FACT_SHARE",
                            platform: "TELEGRAM",
                            metadata: { fact: randomFact },
                        },
                    }),
                    prisma.user.update({
                        where: { id: userId },
                        data: {
                            points: { increment: facts_1.FACT_CONFIG.points },
                            lifetimePoints: { increment: facts_1.FACT_CONFIG.points },
                        },
                    }),
                ]);
                // Set cooldown
                this.userCooldowns.set(userId, {
                    ...cooldowns,
                    [cooldownKey]: now + facts_1.FACT_CONFIG.cooldown * 1000,
                });
                await ctx.reply(`🧠 SOLess Fact #${dailyFacts + 1}/${facts_1.FACT_CONFIG.dailyLimit}:\n\n` +
                    `"${randomFact}"\n\n` +
                    `+${facts_1.FACT_CONFIG.points} points awarded!`);
            }
            catch (error) {
                console.error("Error sharing SOLess fact:", error);
                await ctx.reply("An error occurred. Please try again later.");
            }
        });
        // Handle soulieplay
        this.bot.command("soulieplay", async (ctx) => {
            try {
                if (!ctx.from?.id || !ctx.chat?.id)
                    return;
                const text = ctx.message?.text || "";
                const parts = text.split(" ");
                const songQuery = parts.slice(1).join(" ").trim();
                if (!songQuery) {
                    await ctx.reply("Please provide a song to share. Example: /soulieplay Daft Punk - Get Lucky");
                    return;
                }
                // Find user
                const telegramId = ctx.from.id.toString();
                const telegramAccount = await prisma.telegramAccount.findUnique({
                    where: { platformId: telegramId },
                    include: { user: true },
                });
                // Check if user is a new member who needs to be unrestricted
                const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
                if (chatMember.status === "restricted") {
                    await ctx.api.restrictChatMember(ctx.chat.id, ctx.from.id, {
                        can_send_messages: true,
                        can_send_other_messages: true,
                        can_add_web_page_previews: true,
                        can_invite_users: true,
                    });
                    // Even unverified users can be unrestricted with soulieplay
                    await ctx.reply(`Chat privileges unlocked! 🎉\n\nYou can now participate in the community. Connect your wallet at https://soless.app/register to start earning points.`);
                    // Search for the song and share it
                    try {
                        const video = await this.youtubeService.searchVideo(songQuery);
                        if (video) {
                            await ctx.reply(`You shared: ${video.title}\n${video.url}`);
                        }
                        else {
                            await ctx.reply("Sorry, I couldn't find that song on YouTube.");
                        }
                    }
                    catch (error) {
                        console.error("YouTube search error:", error);
                        await ctx.reply("Error searching for your song. Please try again later.");
                    }
                    return;
                }
                // For verified users, track points
                if (!telegramAccount) {
                    await ctx.reply(`To start earning points with music sharing, connect your wallet at https://soless.app/register`);
                    // Still search and share the song for non-verified users
                    try {
                        const video = await this.youtubeService.searchVideo(songQuery);
                        if (video) {
                            await ctx.reply(`You shared: ${video.title}\n${video.url}`);
                        }
                        else {
                            await ctx.reply("Sorry, I couldn't find that song on YouTube.");
                        }
                    }
                    catch (error) {
                        console.error("YouTube search error:", error);
                        await ctx.reply("Error searching for your song. Please try again later.");
                    }
                    return;
                }
                const userId = telegramAccount.userId;
                // Check cooldown
                const cooldownKey = `${userId}_MUSIC_SHARE`;
                const now = Date.now();
                const cooldowns = this.userCooldowns.get(userId) || {};
                if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
                    const remainingTime = Math.ceil((cooldowns[cooldownKey] - now) / 1000 / 60);
                    await ctx.reply(`Please wait ${remainingTime} minutes before sharing another song.`);
                    return;
                }
                // Check daily limit
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dailyShares = await prisma.pointTransaction.count({
                    where: {
                        userId,
                        reason: "MUSIC_SHARE",
                        timestamp: { gte: today },
                    },
                });
                if (dailyShares >= 10) {
                    await ctx.reply("You've reached the daily limit for music shares. Try again tomorrow!");
                    return;
                }
                // Search for the song
                const video = await this.youtubeService.searchVideo(songQuery);
                if (!video) {
                    await ctx.reply("Sorry, I couldn't find that song on YouTube. Please try a different query.");
                    return;
                }
                // Award points
                await prisma.$transaction([
                    prisma.pointTransaction.create({
                        data: {
                            userId,
                            amount: 5,
                            reason: "MUSIC_SHARE",
                            platform: "TELEGRAM",
                            metadata: { song: video.title, url: video.url },
                        },
                    }),
                    prisma.user.update({
                        where: { id: userId },
                        data: {
                            points: { increment: 5 },
                            lifetimePoints: { increment: 5 },
                        },
                    }),
                ]);
                // Set cooldown (5 minutes)
                this.userCooldowns.set(userId, {
                    ...cooldowns,
                    [cooldownKey]: now + 5 * 60 * 1000,
                });
                await ctx.reply(`🎵 Thanks for sharing music!\n\nYou shared: ${video.title}\n${video.url}\n\n+5 points awarded! (${dailyShares + 1}/10 shares today)`);
            }
            catch (error) {
                console.error("Soulieplay error:", error);
                await ctx.reply("An error occurred. Please try again later.");
            }
        });
        // Handle regular messages for point tracking
        this.bot.on("message", async (ctx) => {
            // Skip command messages
            if (ctx.message?.text?.startsWith("/"))
                return;
            try {
                const telegramId = ctx.from?.id?.toString();
                const messageText = ctx.message?.text || "";
                if (!telegramId || !messageText)
                    return;
                // Find user
                const telegramAccount = await prisma.telegramAccount.findUnique({
                    where: { platformId: telegramId },
                    include: { user: true },
                });
                if (!telegramAccount)
                    return; // Not a verified user
                const userId = telegramAccount.userId;
                const now = Date.now();
                const cooldowns = this.userCooldowns.get(userId) || {};
                // Award points based on message content
                // 1. Count points for this message
                let totalPoints = 0;
                const pointReasons = [];
                // Check for keyword mentions (1 point)
                const keywords = [
                    "soless",
                    "#soless",
                    "@soless",
                    "solarium",
                    "solspace",
                    "soulie",
                    "soul",
                    "nft",
                    "swap",
                ];
                const hasKeyword = keywords.some((keyword) => messageText.toLowerCase().includes(keyword));
                if (hasKeyword) {
                    // Check cooldown for keyword message (60 seconds)
                    const messageKey = `${userId}_MESSAGE`;
                    if (!cooldowns[messageKey] || now >= cooldowns[messageKey]) {
                        // Can award keyword message point
                        totalPoints += 1;
                        pointReasons.push({ type: EngagementType.MESSAGE, points: 1 });
                        // Set cooldown
                        cooldowns[messageKey] = now + 60 * 1000; // 60 second cooldown
                    }
                }
                // 2. Quality post check (additional 1 point for 10+ words)
                if (messageText.split(" ").length >= 10) {
                    // Check cooldown for quality posts (5 minutes)
                    const qualityKey = `${userId}_QUALITY_POST`;
                    if (!cooldowns[qualityKey] || now >= cooldowns[qualityKey]) {
                        // Can award quality post point
                        totalPoints += 1;
                        pointReasons.push({ type: EngagementType.QUALITY_POST, points: 1 });
                        // Set cooldown
                        cooldowns[qualityKey] = now + 5 * 60 * 1000; // 5 minute cooldown
                    }
                }
                // 3. Mentions check (additional 1 point for @username)
                if (messageText.includes("@") && !messageText.includes("@soless")) {
                    // Check cooldown for mentions (3 minutes)
                    const mentionKey = `${userId}_MENTION`;
                    if (!cooldowns[mentionKey] || now >= cooldowns[mentionKey]) {
                        // Can award mention point
                        totalPoints += 1;
                        pointReasons.push({ type: EngagementType.MENTION, points: 1 });
                        // Set cooldown
                        cooldowns[mentionKey] = now + 3 * 60 * 1000; // 3 minute cooldown
                    }
                }
                // 4. Teaching post check (additional 4 points for 35+ words)
                if (messageText.split(" ").length >= 35) {
                    // Check cooldown for teaching posts (15 minutes)
                    const teachingKey = `${userId}_TEACHING_POST`;
                    if (!cooldowns[teachingKey] || now >= cooldowns[teachingKey]) {
                        // Can award teaching post points
                        totalPoints += 4;
                        pointReasons.push({
                            type: EngagementType.TEACHING_POST,
                            points: 4,
                        });
                        // Set cooldown
                        cooldowns[teachingKey] = now + 15 * 60 * 1000; // 15 minute cooldown
                    }
                }
                // Update cooldowns
                this.userCooldowns.set(userId, cooldowns);
                // If any points were earned, record transactions
                if (totalPoints > 0) {
                    // Check daily limit
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dailyPoints = await prisma.pointTransaction.aggregate({
                        where: {
                            userId,
                            timestamp: { gte: today },
                        },
                        _sum: { amount: true },
                    });
                    const currentDailyPoints = dailyPoints._sum.amount || 0;
                    // Limit to 1000 points per day
                    if (currentDailyPoints + totalPoints > 1000) {
                        // Skip awarding points if over daily limit
                        return;
                    }
                    // Create transactions for each reason
                    await prisma.$transaction([
                        ...pointReasons.map((reason) => prisma.pointTransaction.create({
                            data: {
                                userId,
                                amount: reason.points,
                                reason: reason.type,
                                platform: "TELEGRAM",
                                metadata: {
                                    messageId: ctx.message?.message_id,
                                    length: messageText.length,
                                    wordCount: messageText.split(" ").length,
                                },
                            },
                        })),
                        // Update user's total points
                        prisma.user.update({
                            where: { id: userId },
                            data: {
                                points: { increment: totalPoints },
                                lifetimePoints: { increment: totalPoints },
                                lastActive: new Date(),
                            },
                        }),
                    ]);
                    // Update streak
                    await this.updateUserStreak(userId);
                    console.log(`Awarded ${totalPoints} points to user ${userId} for message`);
                }
            }
            catch (error) {
                console.error("Error handling message:", error);
            }
        });
        // Handle new chat members for invite tracking
        this.bot.on("chat_member", async (ctx) => {
            try {
                if (ctx.chatMember.new_chat_member?.status === "member") {
                    // Get the invite link directly from the context if available
                    const inviteLink = ctx.chatMember.invite_link?.invite_link;
                    const newMember = ctx.chatMember.new_chat_member.user;
                    if (inviteLink && newMember) {
                        // Extract code from invite link
                        const code = inviteLink.split('/').pop();
                        if (code) {
                            // Call API to track invite claim
                            await axios_1.default.post(`${process.env.API_BASE_URL || 'http://localhost:3001'}/invites/claim`, {
                                inviteCode: code,
                                telegramUserId: newMember.id.toString(),
                                telegramUsername: newMember.username
                            });
                            console.log(`Tracked invite claim from user ${newMember.id} using invite code ${code}`);
                        }
                    }
                }
            }
            catch (error) {
                console.error("Failed to track invite claim:", error);
            }
        });
        // Error handling
        this.bot.catch((err) => {
            console.error("Bot error:", err);
        });
    }
    // Helper function to update user streak
    async updateUserStreak(userId) {
        try {
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            // Get user's current streak
            let streak = await prisma.userStreak.findUnique({
                where: { userId },
            });
            if (!streak) {
                // Create streak record if it doesn't exist
                streak = await prisma.userStreak.create({
                    data: {
                        userId,
                        telegramStreak: 0,
                        discordStreak: 0,
                        twitterStreak: 0,
                    },
                });
            }
            const lastActivity = streak.lastTelegram;
            if (!lastActivity) {
                // First activity
                await prisma.userStreak.update({
                    where: { userId },
                    data: {
                        telegramStreak: 1,
                        lastTelegram: now,
                    },
                });
                return;
            }
            const lastDate = new Date(lastActivity);
            lastDate.setHours(0, 0, 0, 0);
            if (lastDate.getTime() === today.getTime()) {
                // Already updated streak today
                return;
            }
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate.getTime() === yesterday.getTime()) {
                // Consecutive day - increment streak
                const newStreakValue = streak.telegramStreak + 1;
                await prisma.userStreak.update({
                    where: { userId },
                    data: {
                        telegramStreak: newStreakValue,
                        lastTelegram: now,
                    },
                });
                // Award bonus points for every 3rd day
                if (newStreakValue % 3 === 0) {
                    await prisma.$transaction([
                        prisma.pointTransaction.create({
                            data: {
                                userId,
                                amount: 5,
                                reason: "STREAK_BONUS",
                                platform: "TELEGRAM",
                                metadata: { days: newStreakValue },
                            },
                        }),
                        prisma.user.update({
                            where: { id: userId },
                            data: {
                                points: { increment: 5 },
                                lifetimePoints: { increment: 5 },
                            },
                        }),
                    ]);
                    console.log(`Awarded 5 bonus points to user ${userId} for ${newStreakValue}-day streak`);
                }
            }
            else {
                // Streak broken - reset to 1
                await prisma.userStreak.update({
                    where: { userId },
                    data: {
                        telegramStreak: 1,
                        lastTelegram: now,
                    },
                });
            }
        }
        catch (error) {
            console.error("Error updating streak:", error);
        }
    }
    async start() {
        try {
            // Register core commands
            await this.bot.api.setMyCommands([
                { command: "help", description: "Show available commands" },
                { command: "verify", description: "Verify your account with a code" },
                { command: "soulieplay", description: "Share music and earn points" },
                { command: "solfact", description: "Share a random SOLess fact" },
                { command: "points", description: "Check your points and stats" },
                { command: "leaderboard", description: "View the points leaderboard" },
            ]);
            // Start polling
            await this.bot.start({
                drop_pending_updates: true,
                onStart: (botInfo) => {
                    console.log(`Telegram bot ${botInfo.username} started with polling`);
                    this.isRunning = true;
                },
            });
        }
        catch (error) {
            console.error("Failed to start bot:", error);
            throw error;
        }
    }
    async stop() {
        try {
            await this.bot.stop();
            this.isRunning = false;
            console.log("Telegram bot stopped");
        }
        catch (error) {
            console.error("Error stopping bot:", error);
        }
    }
    getBot() {
        return this.bot;
    }
}
exports.TelegramBot = TelegramBot;
