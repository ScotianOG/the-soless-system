"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordCommandHandler = void 0;
const CommandHandler_1 = require("../../../handlers/CommandHandler");
class DiscordCommandHandler extends CommandHandler_1.CommandHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        super(platform, engagementTracker, userManager, rewardManager);
    }
    async handleCommand(command, args, message) {
        if (!(await this.validateCommand(message.author.id, command))) {
            await message.reply("Please verify your account first!");
            return;
        }
        switch (command.toLowerCase()) {
            case "points":
                await this.handlePointsCommand(message);
                break;
            case "rewards":
                await this.handleRewardsCommand(message);
                break;
            case "help":
                await message.reply(this.getHelpMessage());
                break;
            case "soulieplay":
                await this.handleMusicCommand(message, args);
                break;
            default:
                await message.reply("Unknown command. Use !help to see available commands.");
        }
    }
    // Implement the abstract method from base class
    async validateCommand(userId, command) {
        const user = await this.userManager.getUserByPlatform(this.platform, userId);
        if (!user)
            return false;
        return true;
    }
    // Implement help message
    getHelpMessage() {
        return [
            "**Available Commands**",
            "!points - Check your points and stats",
            "!rewards - View available rewards",
            "!soulieplay <song> - Share music",
            "!help - Show this help message",
        ].join("\n");
    }
    async handleRewardsCommand(message) {
        // TODO: Implement rewards command
        await message.reply("Rewards feature coming soon!");
    }
    async handlePointsCommand(message) {
        const user = await this.userManager.getUserByPlatform("DISCORD", message.author.id);
        if (!user)
            return;
        const stats = (await this.userManager.getUserStats(user.id));
        const response = [
            "🏆 **Your SOLess Stats**",
            "",
            `Total Points: ${stats.contestStats.totalPoints}`,
            `Global Rank: #${stats.contestStats.rank}`,
            "",
            "🎮 Discord Activity",
            `• Current Streak: ${stats.user.streaks.discordStreak} days`,
            `• Platform Points: ${stats.contestStats.platformPoints.DISCORD || 0}`,
            "",
            "🎵 Recent Activity",
            ...stats.user.pointTransactions
                .slice(0, 3)
                .map((tx) => `• ${tx.reason} (+${tx.amount})`),
        ].join("\n");
        await message.reply({ content: response });
    }
    async handleMusicCommand(message, args) {
        const songInfo = args.join(" ");
        if (!songInfo) {
            await message.reply('Please provide a song link or "artist - song"');
            return;
        }
        const user = await this.userManager.getUserByPlatform("DISCORD", message.author.id);
        if (!user)
            return;
        await this.trackEngagement({
            userId: user.id,
            type: "MUSIC_SHARE",
            metadata: { songInfo },
            platform: this.platform,
            timestamp: new Date(),
        });
        await message.reply("🎵 Thanks for sharing! Points awarded.");
    }
    async trackEngagement(data) {
        await this.engagementTracker.trackEngagement(data);
    }
}
exports.DiscordCommandHandler = DiscordCommandHandler;
