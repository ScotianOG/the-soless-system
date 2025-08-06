"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardNotifier = exports.RewardNotifierFactory = void 0;
// src/core/contest/RewardNotifier.ts
const client_1 = require("@prisma/client");
/**
 * Factory for creating RewardNotifier instances
 * Replaces singleton pattern for better testability and isolation
 */
class RewardNotifierFactory {
    static getInstance() {
        if (!this.instance) {
            this.instance = new RewardNotifier();
        }
        return this.instance;
    }
    static createInstance() {
        return new RewardNotifier();
    }
    static clearInstance() {
        this.instance = null;
    }
}
exports.RewardNotifierFactory = RewardNotifierFactory;
RewardNotifierFactory.instance = null;
class RewardNotifier {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RewardNotifier();
        }
        return this.instance;
    }
    setTelegramBot(bot) {
        this.telegramBot = bot;
    }
    async notifyRewardEarned(userId, rewardType, tier) {
        try {
            // Get user's platform accounts
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    telegramAccount: true,
                    discordAccount: true,
                    twitterAccount: true,
                },
            });
            if (!user)
                return;
            // Prepare notification message
            const message = this.formatRewardMessage(rewardType, tier);
            // Send notifications to all connected platforms
            await Promise.all([
                this.sendTelegramNotification(user.telegramAccount?.platformId, message),
                this.sendDiscordNotification(user.discordAccount?.platformId, message),
                this.sendTwitterNotification(user.twitterAccount?.platformId, message),
            ]);
            // Record notification
            await this.prisma.notification.create({
                data: {
                    userId,
                    type: "REWARD_EARNED",
                    message,
                    metadata: {
                        rewardType,
                        tierName: tier.name,
                    },
                },
            });
        }
        catch (error) {
            console.error("Error sending reward notification:", error);
        }
    }
    async notifyRankUpdate(userId, contestId, rank, reward) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    telegramAccount: true,
                },
            });
            if (!user)
                return;
            const message = [
                "🎉 *Rank Update* 🎉",
                "",
                `Congratulations! You're now rank #${rank}!`,
                "",
                `• Prize: ${reward.amount} USDC`,
                `• ${reward.description}`,
                "",
                "Keep earning points to maintain or improve your rank!",
            ].join("\n");
            await this.sendTelegramNotification(user.telegramAccount?.platformId, message);
        }
        catch (error) {
            console.error("Error sending rank update:", error);
        }
    }
    async notifyContestEnd(contestId) {
        try {
            const contest = await this.prisma.contest.findUnique({
                where: { id: contestId },
                include: {
                    entries: {
                        orderBy: { points: "desc" },
                        take: 10,
                        include: {
                            user: {
                                include: {
                                    telegramAccount: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!contest)
                return;
            // Using the actual Prisma types
            const formatLeaderboardEntry = (entry, index) => `${index + 1}. ${entry.user.telegramAccount?.username || "Anonymous"}: ${entry.points} points`;
            const leaderboardMessage = [
                "🏆 *Contest Results* 🏆",
                "",
                "Final Rankings:",
                ...contest.entries.map(formatLeaderboardEntry),
                "",
                "Winners will receive their USDC rewards automatically!",
                "",
                "Check /rewards to view your rewards.",
            ].join("\n");
            // Notify all participants
            for (const entry of contest.entries) {
                if (entry.user.telegramAccount?.platformId) {
                    await this.sendTelegramNotification(entry.user.telegramAccount.platformId, leaderboardMessage);
                }
            }
        }
        catch (error) {
            console.error("Error sending contest end notifications:", error);
        }
    }
    async sendTelegramNotification(telegramId, message) {
        if (!telegramId || !this.telegramBot)
            return;
        try {
            await this.telegramBot.api.sendMessage(telegramId, message, {
                parse_mode: "Markdown",
            });
        }
        catch (error) {
            console.error("Error sending Telegram notification:", error);
        }
    }
    async sendDiscordNotification(discordId, message) {
        // Discord notification will be implemented when Discord bot is set up
        // This is just a placeholder for future implementation
        if (!discordId)
            return;
        try {
            // Implementation will depend on how the Discord bot is set up
            console.log(`[Discord Notification] To ${discordId}: ${message}`);
        }
        catch (error) {
            console.error("Error sending Discord notification:", error);
        }
    }
    async sendTwitterNotification(twitterId, message) {
        // Twitter notification will be implemented when Twitter bot is set up
        // This is just a placeholder for future implementation
        if (!twitterId)
            return;
        try {
            // Implementation will depend on how the Twitter API integration is set up
            console.log(`[Twitter Notification] To ${twitterId}: ${message}`);
        }
        catch (error) {
            console.error("Error sending Twitter notification:", error);
        }
    }
    formatRewardMessage(rewardType, tier) {
        return [
            "🎉 *Reward Earned!* 🎉",
            "",
            `Congratulations! You've earned a ${this.formatRewardType(rewardType)}!`,
            "",
            `Tier: ${tier.name}`,
            `Required Points: ${tier.minPoints}`,
            "",
            "Use /rewards to view and claim your rewards.",
            "",
            "⚠️ Some rewards may have expiration dates. Make sure to claim them in time!",
        ].join("\n");
    }
    formatRewardType(rewardType) {
        const formats = {
            USDC: "USDC Reward",
            SOLANA: "SOL Reward",
            SOUL: "SOUL Token Reward",
            WHITELIST: "Whitelist Spot",
            FREE_MINT: "Free Mint",
            FREE_GAS: "Free Gas",
            NO_FEES: "No Trading Fees",
            NONE: "No Reward",
        };
        return formats[rewardType] || rewardType;
    }
}
exports.RewardNotifier = RewardNotifier;
RewardNotifier.instance = null;
exports.default = RewardNotifier.getInstance();
