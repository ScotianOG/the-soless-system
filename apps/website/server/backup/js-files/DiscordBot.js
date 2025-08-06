"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const BasePlatformBot_1 = require("../BasePlatformBot");
const EngagementTrackerFactory_1 = require("../../../engagement/EngagementTrackerFactory");
const client_1 = require("@prisma/client");
const DiscordCommandHandler_1 = require("./handlers/DiscordCommandHandler");
const DiscordMessageHandler_1 = require("./handlers/DiscordMessageHandler");
const UserManager_1 = require("../../../user/UserManager");
const RewardManager_1 = require("../../../contest/RewardManager");
class DiscordBot extends BasePlatformBot_1.BasePlatformBot {
    constructor(config) {
        super(config);
        this.commands = new discord_js_1.Collection();
        this.userCooldowns = new Map();
        // Set up Discord client with required intents
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.GuildMessageReactions,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildPresences,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
            ],
        });
        // Initialize services
        this.prisma = new client_1.PrismaClient();
        const engagementTracker = EngagementTrackerFactory_1.EngagementTrackerFactory.getTracker("DISCORD");
        const userManager = UserManager_1.UserManager.getInstance();
        const rewardManager = RewardManager_1.RewardManager.getInstance();
        // Initialize handlers
        this.commandHandler = new DiscordCommandHandler_1.DiscordCommandHandler("DISCORD", engagementTracker, userManager, rewardManager);
        this.messageHandler = new DiscordMessageHandler_1.DiscordMessageHandler("DISCORD", engagementTracker, userManager, rewardManager);
        // Set application and guild IDs from environment
        this.applicationId = process.env.DISCORD_CLIENT_ID;
        this.guildId = process.env.DISCORD_GUILD_ID;
        // Set up event handlers
        this.setupEventHandlers();
    }
    async start() {
        try {
            await this.client.login(this.token);
            console.log("Discord bot started successfully");
        }
        catch (error) {
            console.error("Failed to start Discord bot:", error);
            throw error;
        }
    }
    async stop() {
        try {
            await this.client.destroy();
            console.log("Discord bot stopped successfully");
        }
        catch (error) {
            console.error("Failed to stop Discord bot:", error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    setupEventHandlers() {
        // Ready event
        this.client.once(discord_js_1.Events.ClientReady, async () => {
            console.log(`Discord bot ready! Logged in as ${this.client.user?.tag}`);
            await this.registerCommands();
        });
        // Message event
        this.client.on(discord_js_1.Events.MessageCreate, async (message) => {
            // Skip bot messages
            if (message.author.bot)
                return;
            // Check if the message starts with the prefix for legacy commands
            if (message.content.startsWith("!")) {
                const args = message.content.slice(1).trim().split(/ +/);
                const command = args.shift()?.toLowerCase();
                if (command) {
                    await this.commandHandler.handleCommand(command, args, message);
                }
            }
            else {
                // Handle regular messages
                await this.messageHandler.handleMessage(message);
            }
        });
        // Handle slash commands
        this.client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            await this.handleSlashCommand(interaction);
        });
        // Handle guild member join
        this.client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
            console.log(`New member joined: ${member.user.username}`);
            // TODO: Implement invite tracking and welcome messages
        });
        // Error handling
        this.client.on(discord_js_1.Events.Error, (error) => {
            console.error("Discord client error:", error);
        });
    }
    async registerCommands() {
        if (!this.applicationId || !this.guildId) {
            console.warn("Missing Discord application ID or guild ID. Slash commands will not be registered.");
            return;
        }
        try {
            const commands = [
                new discord_js_1.SlashCommandBuilder()
                    .setName("verify")
                    .setDescription("Verify your account with a code")
                    .addStringOption((option) => option
                    .setName("code")
                    .setDescription("Your verification code")
                    .setRequired(true)),
                new discord_js_1.SlashCommandBuilder()
                    .setName("points")
                    .setDescription("Check your points and stats"),
                new discord_js_1.SlashCommandBuilder()
                    .setName("leaderboard")
                    .setDescription("View the points leaderboard"),
                new discord_js_1.SlashCommandBuilder()
                    .setName("solfact")
                    .setDescription("Share a random SOLess fact"),
                new discord_js_1.SlashCommandBuilder()
                    .setName("soulieplay")
                    .setDescription("Share music and earn points")
                    .addStringOption((option) => option
                    .setName("song")
                    .setDescription("The song you want to share")
                    .setRequired(true)),
                new discord_js_1.SlashCommandBuilder()
                    .setName("help")
                    .setDescription("Show available commands"),
            ];
            const rest = new discord_js_1.REST().setToken(this.token);
            console.log("Started refreshing Discord application slash commands");
            await rest.put(discord_js_1.Routes.applicationGuildCommands(this.applicationId, this.guildId), { body: commands.map((command) => command.toJSON()) });
            console.log("Successfully registered Discord application commands");
        }
        catch (error) {
            console.error("Error registering Discord slash commands:", error);
        }
    }
    async handleSlashCommand(interaction) {
        try {
            const commandName = interaction.commandName;
            const userId = interaction.user.id;
            switch (commandName) {
                case "verify":
                    await this.handleVerifyCommand(interaction);
                    break;
                case "points":
                    await this.handlePointsCommand(interaction);
                    break;
                case "leaderboard":
                    await this.handleLeaderboardCommand(interaction);
                    break;
                case "solfact":
                    await this.handleSolFactCommand(interaction);
                    break;
                case "soulieplay":
                    await this.handleMusicCommand(interaction);
                    break;
                case "help":
                    await this.handleHelpCommand(interaction);
                    break;
                default:
                    await interaction.reply({
                        content: "Unknown command. Use /help to see available commands.",
                        ephemeral: true,
                    });
            }
        }
        catch (error) {
            console.error(`Error handling slash command:`, error);
            // If the interaction hasn't been replied to yet, send an error message
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply("An error occurred while processing your command.");
            }
            else if (!interaction.replied) {
                await interaction.reply({
                    content: "An error occurred while processing your command.",
                    ephemeral: true,
                });
            }
        }
    }
    async handleVerifyCommand(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const code = interaction.options.getString("code");
            if (!code) {
                await interaction.editReply("Please provide a verification code.");
                return;
            }
            // Get user from database to check if they're already verified
            const user = await this.prisma.discordAccount.findUnique({
                where: { platformId: interaction.user.id.toString() },
            });
            if (user) {
                await interaction.editReply("Your account is already verified.");
                return;
            }
            // Check verification code
            const verification = await this.prisma.verificationCode.findUnique({
                where: { code },
                include: { user: true },
            });
            if (!verification ||
                verification.isUsed ||
                new Date() > verification.expiresAt) {
                await interaction.editReply("❌ Invalid or expired verification code. Please try again.");
                return;
            }
            // Verify user's account
            await this.prisma.$transaction([
                // Mark code as used
                this.prisma.verificationCode.update({
                    where: { id: verification.id },
                    data: { isUsed: true },
                }),
                // Create Discord account link
                this.prisma.discordAccount.create({
                    data: {
                        userId: verification.userId,
                        platformId: interaction.user.id.toString(),
                        username: interaction.user.username,
                    },
                }),
                // Update user Discord username
                this.prisma.user.update({
                    where: { id: verification.userId },
                    data: { discordUsername: interaction.user.username },
                }),
                // Award initial points for verification
                this.prisma.pointTransaction.create({
                    data: {
                        userId: verification.userId,
                        amount: 5,
                        reason: "COMMAND",
                        platform: "DISCORD",
                        metadata: { command: "verify" },
                    },
                }),
                this.prisma.user.update({
                    where: { id: verification.userId },
                    data: {
                        points: { increment: 5 },
                        lifetimePoints: { increment: 5 },
                    },
                }),
            ]);
            await interaction.editReply("✅ Account verified! Welcome to SOLess community! You can now start earning points.");
        }
        catch (error) {
            console.error("Error verifying user:", error);
            await interaction.editReply("An error occurred during verification. Please try again later.");
        }
    }
    async handlePointsCommand(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            // Find Discord account
            const discordAccount = await this.prisma.discordAccount.findUnique({
                where: { platformId: interaction.user.id.toString() },
                include: { user: true },
            });
            if (!discordAccount) {
                await interaction.editReply("Your account is not linked yet. Please use /verify to connect your account.");
                return;
            }
            const user = discordAccount.user;
            // Get user rank
            const higherRanked = await this.prisma.user.count({
                where: { points: { gt: user.points } },
            });
            // Get streak information
            const streak = await this.prisma.userStreak.findUnique({
                where: { userId: user.id },
            });
            // Get today's points
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayPoints = await this.prisma.pointTransaction.aggregate({
                where: {
                    userId: user.id,
                    timestamp: { gte: today },
                },
                _sum: { amount: true },
            });
            // Get recent activity
            const recentActivity = await this.prisma.pointTransaction.findMany({
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
            const embed = {
                title: "🏆 Your SOLess Stats 🏆",
                color: 0x1e88e5,
                fields: [
                    {
                        name: "Total Points",
                        value: `${user.points}`,
                        inline: true,
                    },
                    {
                        name: "Global Rank",
                        value: `#${higherRanked + 1}`,
                        inline: true,
                    },
                    {
                        name: "\u200B",
                        value: "\u200B",
                        inline: false,
                    },
                    {
                        name: "🎮 Discord Activity",
                        value: `• Current Streak: ${streak?.discordStreak || 0} days\n• Points Today: ${todayPoints._sum.amount || 0}`,
                        inline: false,
                    },
                ],
                footer: {
                    text: "SOLess Community",
                },
                timestamp: new Date().toISOString(),
            };
            // Add recent activity field if available
            if (recentActivity.length > 0) {
                const activityField = {
                    name: "💫 Recent Activity",
                    value: recentActivity
                        .map((activity) => {
                        const type = activityTypes[activity.reason] ||
                            activity.reason;
                        return `• ${type} (+${activity.amount})`;
                    })
                        .join("\n"),
                    inline: false,
                };
                embed.fields.push(activityField);
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Error fetching points:", error);
            await interaction.editReply("An error occurred. Please try again later.");
        }
    }
    async handleLeaderboardCommand(interaction) {
        await interaction.deferReply();
        try {
            // Get top users by points
            const leaders = await this.prisma.user.findMany({
                where: {
                    discordUsername: { not: null },
                },
                orderBy: { points: "desc" },
                take: 10,
            });
            if (leaders.length === 0) {
                await interaction.editReply("No users on the leaderboard yet.");
                return;
            }
            const embed = {
                title: "🏆 SOLess Community Leaderboard 🏆",
                color: 0xffd700,
                description: leaders
                    .map((user, index) => {
                    const medal = index === 0
                        ? "🥇"
                        : index === 1
                            ? "🥈"
                            : index === 2
                                ? "🥉"
                                : `${index + 1}.`;
                    return `${medal} ${user.discordUsername || "Anonymous"}: ${user.points} points`;
                })
                    .join("\n"),
                footer: {
                    text: "SOLess Community",
                },
                timestamp: new Date().toISOString(),
            };
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Error fetching leaderboard:", error);
            await interaction.editReply("An error occurred. Please try again later.");
        }
    }
    async handleSolFactCommand(interaction) {
        await interaction.deferReply();
        try {
            // Find Discord account
            const discordAccount = await this.prisma.discordAccount.findUnique({
                where: { platformId: interaction.user.id.toString() },
                include: { user: true },
            });
            if (!discordAccount) {
                await interaction.editReply("Your account is not linked yet. Please use /verify to connect your account first.");
                return;
            }
            const userId = discordAccount.userId;
            // Check cooldown using the user cooldowns map
            const cooldownKey = `${userId}_FACT_SHARE`;
            const now = Date.now();
            const cooldowns = this.userCooldowns.get(userId) || {};
            if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
                const remainingTime = Math.ceil((cooldowns[cooldownKey] - now) / 1000 / 60);
                await interaction.editReply(`Please wait ${remainingTime} minutes before sharing another SOLess fact.`);
                return;
            }
            // Check daily limit
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dailyFacts = await this.prisma.pointTransaction.count({
                where: {
                    userId,
                    reason: "FACT_SHARE",
                    timestamp: { gte: today },
                },
            });
            const FACT_CONFIG = {
                points: 2,
                cooldown: 300, // 5 minutes in seconds
                dailyLimit: 3,
            };
            if (dailyFacts >= FACT_CONFIG.dailyLimit) {
                await interaction.editReply(`You've reached the daily limit of ${FACT_CONFIG.dailyLimit} SOLess facts. Try again tomorrow!`);
                return;
            }
            // List of SOLess facts
            const SOLESS_FACTS = [
                "SOLess combines three platforms: SOLspace for creators, SOLarium for DeFi, and SOLess Swap for trading.",
                "The SOLess ecosystem is built on Solana for high speed and low transaction costs.",
                "SOLess tokens can be staked for additional rewards and governance rights.",
                "SOLspace allows creators to mint and sell NFTs with customizable royalty structures.",
                "SOLarium provides liquidity pools with auto-compounding yields.",
                "SOLess Swap has a unique hybrid AMM model for better price stability.",
                "SOLess was founded by a team of blockchain developers and financial experts.",
                "SOLess governance is managed through a DAO where token holders vote on key decisions.",
                "All SOLess products feature on-chain analytics and transparent performance metrics.",
                "The SOLess ecosystem uses an innovative cross-platform reward system.",
            ];
            // Select random fact
            const randomFact = SOLESS_FACTS[Math.floor(Math.random() * SOLESS_FACTS.length)];
            // Award points
            await this.prisma.$transaction([
                this.prisma.pointTransaction.create({
                    data: {
                        userId,
                        amount: FACT_CONFIG.points,
                        reason: "FACT_SHARE",
                        platform: "DISCORD",
                        metadata: { fact: randomFact },
                    },
                }),
                this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        points: { increment: FACT_CONFIG.points },
                        lifetimePoints: { increment: FACT_CONFIG.points },
                    },
                }),
            ]);
            // Set cooldown
            this.userCooldowns.set(userId, {
                ...cooldowns,
                [cooldownKey]: now + FACT_CONFIG.cooldown * 1000,
            });
            const embed = {
                title: "🧠 SOLess Fact",
                description: randomFact,
                color: 0x4caf50,
                footer: {
                    text: `+${FACT_CONFIG.points} points awarded! (${dailyFacts + 1}/${FACT_CONFIG.dailyLimit} today)`,
                },
            };
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Error sharing SOLess fact:", error);
            await interaction.editReply("An error occurred. Please try again later.");
        }
    }
    async handleMusicCommand(interaction) {
        await interaction.deferReply();
        try {
            const songQuery = interaction.options.getString("song");
            if (!songQuery) {
                await interaction.editReply("Please provide a song to share.");
                return;
            }
            // Find Discord account
            const discordAccount = await this.prisma.discordAccount.findUnique({
                where: { platformId: interaction.user.id.toString() },
                include: { user: true },
            });
            // For users who aren't verified
            if (!discordAccount) {
                await interaction.editReply(`To start earning points with music sharing, use /verify to connect your account first.`);
                // Still share the song for non-verified users
                await interaction.followUp(`${interaction.user} shared: ${songQuery}`);
                return;
            }
            const userId = discordAccount.userId;
            // Check cooldown
            const cooldownKey = `${userId}_MUSIC_SHARE`;
            const now = Date.now();
            const cooldowns = this.userCooldowns.get(userId) || {};
            if (cooldowns[cooldownKey] && now < cooldowns[cooldownKey]) {
                const remainingTime = Math.ceil((cooldowns[cooldownKey] - now) / 1000 / 60);
                await interaction.editReply(`Please wait ${remainingTime} minutes before sharing another song.`);
                return;
            }
            // Check daily limit
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dailyShares = await this.prisma.pointTransaction.count({
                where: {
                    userId,
                    reason: "MUSIC_SHARE",
                    timestamp: { gte: today },
                },
            });
            if (dailyShares >= 10) {
                await interaction.editReply("You've reached the daily limit for music shares. Try again tomorrow!");
                return;
            }
            // Award points
            await this.prisma.$transaction([
                this.prisma.pointTransaction.create({
                    data: {
                        userId,
                        amount: 5,
                        reason: "MUSIC_SHARE",
                        platform: "DISCORD",
                        metadata: { song: songQuery },
                    },
                }),
                this.prisma.user.update({
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
            const embed = {
                title: "🎵 Music Share",
                description: songQuery,
                color: 0x9c27b0,
                footer: {
                    text: `+5 points awarded! (${dailyShares + 1}/10 shares today)`,
                },
            };
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Error sharing music:", error);
            await interaction.editReply("An error occurred. Please try again later.");
        }
    }
    async handleHelpCommand(interaction) {
        const embed = {
            title: "🎵 SOLess Community Bot Commands",
            color: 0x2196f3,
            fields: [
                {
                    name: "🎶 Music Commands",
                    value: "- `/soulieplay [song]` - Share music and earn points (5 pts, max 10/day)",
                    inline: false,
                },
                {
                    name: "📚 Information Commands",
                    value: "- `/solfact` - Share a random SOLess fact (2 pts, max 3/day)",
                    inline: false,
                },
                {
                    name: "📊 Stats & Rankings",
                    value: "- `/points` - Check your points and stats\n- `/leaderboard` - View top community members",
                    inline: false,
                },
                {
                    name: "🔗 Account Management",
                    value: "- `/verify [code]` - Link your wallet with Discord",
                    inline: false,
                },
            ],
            footer: {
                text: "Need more help? Visit our website or ask in the community!",
            },
        };
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
exports.DiscordBot = DiscordBot;
